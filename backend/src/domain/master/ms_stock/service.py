import math
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import or_

from resources.strings import (MS_STOCK_ALREADY_EXIST_ERROR, MS_STOCK_ARTICLE_ID_REQUIRED_ERROR,
                               MS_STOCK_DELETE_SUCCESS, MS_STOCK_DOES_NOT_EXIST_ERROR,
                               MS_STOCK_INVALID_ACTIVE_ERROR, MS_STOCK_ITEM_CODE_REQUIRED_ERROR,
                               MS_STOCK_ITEM_NAME_REQUIRED_ERROR, MS_STOCK_MIN_OVER_MAX_ERROR,
                               MS_STOCK_NEGATIVE_VALUE_ERROR, MS_STOCK_POST_SUCCESS, MS_STOCK_UPDATE_SUCCESS,
                               SOLUM_ARTICLE_NO_CHANGE, SOLUM_ARTICLE_NOT_LINKED, SOLUM_ARTICLE_PUSH_SUCCESS,
                               SOLUM_LED_SUCCESS)
from src.config import (ACTIVE_DATA, ALL_DATA, GUEST_USER_CODE, INACTIVE_DATA, LIMIT, STOCK_SOLUM_DATA_KEYS,
                        STOCK_SOLUM_ON_PREMISE_DATA_KEYS, STOCK_STATUS_EMPTY, STOCK_STATUS_LED_COLORS, STOCK_STATUS_OVER_MAX,
                        STOCK_STATUS_SAFE, STOCK_STATUS_UNDER_MIN, get_branch_time)
from src.database import db_dependency
from src.domain.master.ms_stock.models import MsStock
from src.domain.master.ms_stock.schemas import (MessageResponse, MsStockCreate, MsStockFilterResponse,
                                                MsStockResponse, MsStockUpdate, MsStockUpdateResponse,
                                                SolumCallResult)
from src.domain.master.solum import service as serviceSolum
from src.services import solum_client
from src.services.solum_client import SolumError

# Columns the update body can change (stock_status is always computed)
EDITABLE_COLUMNS = ('item_code', 'article_id', 'item_name', 'mnemonic', 'own_stock', 'min_stock', 'max_stock',
                    'storage_bin', 'stock_on_hand', 'stock_on_hand_rfid', 'active')


# Get Selected MsStock
def get_stock_by_code(db: db_dependency, item_code: str):
    return db.query(MsStock).filter(MsStock.item_code == item_code).first()


# Get MsStock Linked To A SOLUM Article
def get_stock_by_article_id(db: db_dependency, article_id: str):
    return db.query(MsStock).filter(MsStock.article_id == article_id).first()


# Get Stock Status
# Checked in this order: 0 -> KOSONG, below min -> UNDER MIN, above max -> OVER MAX,
# otherwise (min..max, both inclusive) -> AMAN.
def get_stock_status(own_stock: int, min_stock: int, max_stock: int):
    if own_stock == 0:
        return STOCK_STATUS_EMPTY
    if own_stock < min_stock:
        return STOCK_STATUS_UNDER_MIN
    if own_stock > max_stock:
        return STOCK_STATUS_OVER_MAX
    return STOCK_STATUS_SAFE


# Validate Stock Values (values is a dict of ms_stock columns after the change)
def validate_stock_values(values: dict):
    if not values.get('item_name'):
        raise HTTPException(status_code=400, detail=MS_STOCK_ITEM_NAME_REQUIRED_ERROR)

    # own/min/max are required; the stock on hand columns may stay empty
    for column in ('own_stock', 'min_stock', 'max_stock', 'stock_on_hand', 'stock_on_hand_rfid'):
        value = values.get(column)
        if value is None and column in ('own_stock', 'min_stock', 'max_stock'):
            raise HTTPException(status_code=400, detail=f"{column.replace('_', ' ')} is required")
        if value is not None and value < 0:
            raise HTTPException(status_code=400, detail=MS_STOCK_NEGATIVE_VALUE_ERROR)

    if values['min_stock'] > values['max_stock']:
        raise HTTPException(status_code=400, detail=MS_STOCK_MIN_OVER_MAX_ERROR)


# Validate Stock Keys On Update
# item_code and article_id may be changed, but each must stay unique: a new item_code may not belong to
# another row, and a new article may not be linked to another row. The row itself is not a duplicate.
def validate_stock_keys(db: db_dependency, row: MsStock, values: dict):
    if values['item_code'] != row.item_code:
        if not values['item_code']:
            raise HTTPException(status_code=400, detail=MS_STOCK_ITEM_CODE_REQUIRED_ERROR)
        if get_stock_by_code(db, values['item_code']):
            raise HTTPException(status_code=400, detail=MS_STOCK_ALREADY_EXIST_ERROR)

    if values['article_id'] != row.article_id:
        if not values['article_id']:
            raise HTTPException(status_code=400, detail=MS_STOCK_ARTICLE_ID_REQUIRED_ERROR)
        linked = get_stock_by_article_id(db, values['article_id'])
        if linked and linked.id != row.id:
            raise HTTPException(status_code=400, detail=f"article {values['article_id']} is already linked to "
                                                        f"item code {linked.item_code}")


# Build MsStock Response
def build_stock_response(row: MsStock):
    return MsStockResponse(
        id=row.id,
        item_code=row.item_code,
        article_id=row.article_id,
        item_name=row.item_name,
        mnemonic=row.mnemonic,
        own_stock=row.own_stock,
        min_stock=row.min_stock,
        max_stock=row.max_stock,
        storage_bin=row.storage_bin,
        stock_on_hand=row.stock_on_hand,
        stock_on_hand_rfid=row.stock_on_hand_rfid,
        stock_status=row.stock_status,
        active=row.active,
        updated_at=row.updated_at,
        updated_by=row.updated_by,
    )


# Build SOLUM Article Payload
# The articles POST is AIMS' register/update call, so every mapped key is sent each time (not only the
# changed ones): the label keeps all its stock fields even if AIMS replaces the article's data.
# SOLUM data values are strings; an empty column is sent as "" so the label clears it.
def build_solum_article(row: MsStock):
    data = {}
    for column, solum_key in STOCK_SOLUM_DATA_KEYS.items():
        value = getattr(row, column)
        data[solum_key] = '' if value is None else str(value)

    return [{'articleId': row.article_id, 'articleName': row.item_name, 'data': data}]


# Build On Premise Article Data (the stock fields only; the SOLUM client merges them into the article)
def build_on_premise_article_data(row: MsStock):
    data = {}
    for column, solum_key in STOCK_SOLUM_ON_PREMISE_DATA_KEYS.items():
        value = getattr(row, column)
        data[solum_key] = '' if value is None else str(value)
    return data


# Build SOLUM LED Blink List (color follows the stock status, duration comes from SOLUM_LED_DURATION)
def build_led_blink_list(row: MsStock):
    return [{
        'articleId': row.article_id,
        'color': STOCK_STATUS_LED_COLORS[row.stock_status],
        'duration': solum_client.SOLUM_LED_DURATION,
        'patternId': solum_client.SOLUM_LED_PATTERN_ID,
        'multiLed': solum_client.SOLUM_LED_MULTI_LED,
    }]


# Blink Stock LED On Premise (best-effort like blink_stock_led): PUT /labels/contents/led on every label
# linked to the article, so the payload is only known once the labels are found
async def blink_on_premise_stock_led(row: MsStock, store: str):
    color = STOCK_STATUS_LED_COLORS[row.stock_status]
    try:
        url, payload, status_code, body = await solum_client.blink_on_premise_led(row.article_id, color, store)
        return SolumCallResult(
            is_sent=True, is_success=True, message=SOLUM_LED_SUCCESS, method='PUT', url=url,
            status_code=status_code, payload=payload, response=body)
    except SolumError as error:
        return SolumCallResult(
            is_sent=True, is_success=False, message=error.message, method=error.method, url=error.url,
            status_code=error.status_code, response=error.body)


# Blink Stock LED (best-effort: a failure is returned as the result, never raised)
async def blink_stock_led(row: MsStock, company: str, store: str):
    if solum_client.is_on_premise():
        return await blink_on_premise_stock_led(row, store)

    led_blink_list = build_led_blink_list(row)
    led_url = solum_client.build_url(solum_client.ARTICLES_LED_PATH, company, store)
    try:
        status_code, body = await solum_client.blink_article_led(led_blink_list, company, store)
        return SolumCallResult(
            is_sent=True, is_success=True, message=SOLUM_LED_SUCCESS, method='PUT', url=led_url,
            status_code=status_code, payload={'ledBlinkList': led_blink_list}, response=body)
    except SolumError as error:
        return SolumCallResult(
            is_sent=True, is_success=False, message=error.message, method='PUT', url=led_url,
            status_code=error.status_code, payload={'ledBlinkList': led_blink_list}, response=error.body)


# Get MsStock By Filter Data
# search matches item_code, article_id or item_name, for the single search box on the Edit Data tab.
# article_id is an exact match, so the Used Stock tab can find the row of the article it picked.
def get_stock_by_filter(db: db_dependency,
                        search: Optional[str] = None,
                        item_code: Optional[str] = None,
                        article_id: Optional[str] = None,
                        item_name: Optional[str] = None,
                        mnemonic: Optional[str] = None,
                        storage_bin: Optional[str] = None,
                        stock_status: Optional[str] = None,
                        active: Optional[str] = ACTIVE_DATA,
                        page: Optional[int] = 1):

    # Default page to 1 if not provided
    if page is None or page < 1:
        page = 1

    # Calculate offset
    offset = (page - 1) * LIMIT

    # Start Query
    query = db.query(MsStock)

    # Dynamically add filters based on provided parameters
    if search:
        query = query.filter(or_(MsStock.item_code.ilike(f"%{search}%"),
                                 MsStock.article_id.ilike(f"%{search}%"),
                                 MsStock.item_name.ilike(f"%{search}%")))
    if item_code:
        query = query.filter(MsStock.item_code.ilike(f"%{item_code}%"))
    if article_id:
        query = query.filter(MsStock.article_id == article_id)
    if item_name:
        query = query.filter(MsStock.item_name.ilike(f"%{item_name}%"))
    if mnemonic:
        query = query.filter(MsStock.mnemonic.ilike(f"%{mnemonic}%"))
    if storage_bin:
        query = query.filter(MsStock.storage_bin.ilike(f"%{storage_bin}%"))
    if stock_status:
        query = query.filter(MsStock.stock_status == stock_status)
    if active != ALL_DATA:
        query = query.filter(MsStock.active == active)

    # Totals across all pages, counted on the same filtered query before paging
    total_items = query.count()
    total_page = math.ceil(total_items / LIMIT)

    # Execute the query
    rows = query.order_by(MsStock.item_code.asc()).offset(offset).limit(LIMIT).all()

    data = [build_stock_response(row) for row in rows]

    return MsStockFilterResponse(
        data=data, page=page, total_items=total_items, total_page=total_page)


# Create MsStock
def create_stock(db: db_dependency, request: MsStockCreate):
    # item_code is typed by the user -- one row per code
    if not request.item_code:
        raise HTTPException(status_code=400, detail=MS_STOCK_ITEM_CODE_REQUIRED_ERROR)
    existing = get_stock_by_code(db, request.item_code)
    if existing:
        raise HTTPException(status_code=400, detail=MS_STOCK_ALREADY_EXIST_ERROR)

    # article_id is the SOLUM label this row updates -- one row per article, or two rows would fight
    # over the same label's stock fields and LED
    if not request.article_id:
        raise HTTPException(status_code=400, detail=MS_STOCK_ARTICLE_ID_REQUIRED_ERROR)
    linked = get_stock_by_article_id(db, request.article_id)
    if linked:
        raise HTTPException(status_code=400, detail=f"article {request.article_id} is already linked to "
                                                    f"item code {linked.item_code}")

    # Validate stock values
    validate_stock_values(request.dict())

    # Post Data request
    ms_stock_model = MsStock(
        item_code=request.item_code,
        article_id=request.article_id,
        item_name=request.item_name,
        mnemonic=request.mnemonic,
        own_stock=request.own_stock,
        min_stock=request.min_stock,
        max_stock=request.max_stock,
        storage_bin=request.storage_bin,
        stock_on_hand=request.stock_on_hand,
        stock_on_hand_rfid=request.stock_on_hand_rfid,
        stock_status=get_stock_status(request.own_stock, request.min_stock, request.max_stock),
    )
    ms_stock_model.active = ACTIVE_DATA
    ms_stock_model.updated_by = GUEST_USER_CODE
    ms_stock_model.updated_at = get_branch_time(None)

    # Add new data to database
    db.add(ms_stock_model)
    db.commit()

    # Post Response
    return MessageResponse(message=MS_STOCK_POST_SUCCESS)


# Update MsStock
# Only the fields sent in the body change. When a column mapped in STOCK_SOLUM_DATA_KEYS changes, the
# article data is pushed to SOLUM before the commit: if SOLUM rejects it nothing is saved, so the table
# and the label never disagree. The LED blink runs after the commit on every update and is best-effort:
# the stock is already saved, so a failed blink is reported in solum_led instead of raised. A row without
# article_id has no label: it is saved only, and both calls are reported as not sent.
async def update_stock(db: db_dependency, request: MsStockUpdate, item_code: str):
    # Get Selected Data
    ms_stock_model = get_stock_by_code(db, item_code)

    # When data not found
    if ms_stock_model is None:
        raise HTTPException(status_code=404, detail=MS_STOCK_DOES_NOT_EXIST_ERROR)

    # SOLUM store and LED duration are checked before anything is written
    company, store = serviceSolum.resolve_target(request.company, request.store)
    serviceSolum.validate_led_duration()

    # Current values merged with the fields sent in the body
    changes = request.dict(exclude_unset=True, exclude={'company', 'store'})
    old_values = {column: getattr(ms_stock_model, column) for column in EDITABLE_COLUMNS}
    new_values = {**old_values, **changes}
    validate_stock_values(new_values)
    if new_values['active'] not in (ACTIVE_DATA, INACTIVE_DATA):
        raise HTTPException(status_code=400, detail=MS_STOCK_INVALID_ACTIVE_ERROR)
    validate_stock_keys(db, ms_stock_model, new_values)

    # SOLUM is only updated when the row has an article and a column the label shows, or the article
    # itself, has changed. A new article gets all the stock fields; the old article's label is left as is.
    is_linked = bool(new_values['article_id'])
    is_article_changed = new_values['article_id'] != old_values['article_id']
    is_solum_changed = is_article_changed or any(
        new_values[column] != old_values[column] for column in STOCK_SOLUM_DATA_KEYS)

    # Variable that want to update
    for column, value in changes.items():
        setattr(ms_stock_model, column, value)
    ms_stock_model.stock_status = get_stock_status(
        new_values['own_stock'], new_values['min_stock'], new_values['max_stock'])
    ms_stock_model.updated_by = GUEST_USER_CODE
    ms_stock_model.updated_at = get_branch_time(None)

    # Push article data to SOLUM, undo the change when SOLUM rejects it
    if not is_linked:
        solum_article = SolumCallResult(is_sent=False, is_success=True, message=SOLUM_ARTICLE_NOT_LINKED)
    elif is_solum_changed and solum_client.is_on_premise():
        try:
            url, payload, status_code, body = await solum_client.push_on_premise_article(
                ms_stock_model.article_id, ms_stock_model.item_name, build_on_premise_article_data(ms_stock_model),
                store)
        except SolumError as error:
            db.rollback()
            raise HTTPException(status_code=502, detail=error.message)
        solum_article = SolumCallResult(
            is_sent=True, is_success=True, message=SOLUM_ARTICLE_PUSH_SUCCESS, method='POST', url=url,
            status_code=status_code, payload=payload, response=body)
    elif is_solum_changed:
        articles = build_solum_article(ms_stock_model)
        try:
            status_code, body = await solum_client.push_articles(articles, company, store)
        except SolumError as error:
            db.rollback()
            raise HTTPException(status_code=502, detail=error.message)
        solum_article = SolumCallResult(
            is_sent=True, is_success=True, message=SOLUM_ARTICLE_PUSH_SUCCESS, method='POST',
            url=solum_client.build_url(solum_client.ARTICLES_PATH, company, store),
            status_code=status_code, payload=articles, response=body)
    else:
        solum_article = SolumCallResult(is_sent=False, is_success=True, message=SOLUM_ARTICLE_NO_CHANGE)

    # Add data to database
    db.add(ms_stock_model)
    db.commit()
    db.refresh(ms_stock_model)

    # Blink the label LED in the stock status color
    if is_linked:
        solum_led = await blink_stock_led(ms_stock_model, company, store)
    else:
        solum_led = SolumCallResult(is_sent=False, is_success=True, message=SOLUM_ARTICLE_NOT_LINKED)

    # Update Response
    return MsStockUpdateResponse(
        message=MS_STOCK_UPDATE_SUCCESS,
        company=company,
        store=store,
        data=build_stock_response(ms_stock_model),
        solum_article=solum_article,
        solum_led=solum_led,
    )


# Delete MsStock
# Removes the row for good (the Edit Data tab's Delete button); the SOLUM label is left as it is.
# Use active = INACTIVE instead to only hide a row.
def delete_stock(db: db_dependency, item_code: str):
    # Get Selected Data
    ms_stock_model = get_stock_by_code(db, item_code)

    # When data not found
    if ms_stock_model is None:
        raise HTTPException(status_code=404, detail=MS_STOCK_DOES_NOT_EXIST_ERROR)

    # Delete data from database
    db.delete(ms_stock_model)
    db.commit()

    # Delete Response
    return MessageResponse(message=MS_STOCK_DELETE_SUCCESS)
