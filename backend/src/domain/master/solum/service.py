from typing import Optional

from fastapi import HTTPException

from resources.strings import (SOLUM_COMPANY_REQUIRED_ERROR, SOLUM_INVALID_LED_DURATION_ERROR,
                               SOLUM_STORE_REQUIRED_ERROR)
from src.config import VALID_LED_DURATIONS
from src.domain.master.solum.schemas import (SolumArticleResponse, SolumDefaultsResponse,
                                             SolumStoreResponse)
from src.services import solum_client
from src.services.solum_client import SolumError


# Get SOLUM Defaults
def get_defaults():
    return SolumDefaultsResponse(
        company=solum_client.SOLUM_COMPANY,
        store=solum_client.SOLUM_STORE,
        led_duration=solum_client.SOLUM_LED_DURATION,
    )


# Resolve SOLUM Target
# company/store sent by the user win; empty falls back to SOLUM_COMPANY/SOLUM_STORE. Both are required
# because the LED call needs the store. Returns (company, store).
def resolve_target(company: Optional[str], store: Optional[str]):
    company = company or solum_client.SOLUM_COMPANY
    store = store or solum_client.SOLUM_STORE
    if not company:
        raise HTTPException(status_code=400, detail=SOLUM_COMPANY_REQUIRED_ERROR)
    if not store:
        raise HTTPException(status_code=400, detail=SOLUM_STORE_REQUIRED_ERROR)
    return company, store


# Validate LED Duration (SOLUM rejects any value outside its list)
def validate_led_duration():
    if solum_client.SOLUM_LED_DURATION not in VALID_LED_DURATIONS:
        raise HTTPException(status_code=400, detail=SOLUM_INVALID_LED_DURATION_ERROR)


# Get SOLUM Stores, sorted by store code
async def get_stores(company: str, store_name: Optional[str] = None):
    try:
        stores = await solum_client.list_stores(company, store_name)
    except SolumError as error:
        raise HTTPException(status_code=502, detail=error.message)

    data = [
        SolumStoreResponse(store=row.get('store'), store_name=row.get('storeName'))
        for row in stores if row.get('store')
    ]
    return sorted(data, key=lambda row: row.store)


# Get SOLUM Articles
async def get_articles(company: str, store: str, name: Optional[str] = None):
    try:
        articles = await solum_client.list_articles(company, store, name)
    except SolumError as error:
        raise HTTPException(status_code=502, detail=error.message)

    return [
        SolumArticleResponse(article_id=row.get('articleId'), article_name=row.get('articleName'))
        for row in articles if row.get('articleId')
    ]
