from typing import Optional

from fastapi import APIRouter, HTTPException
from resources.strings import MS_STOCK_DOES_NOT_EXIST_ERROR
from src.config import ACTIVE_DATA
from src.database import db_dependency
from src.domain.master.ms_stock import schemas, service
from starlette import status

# Api Router
router = APIRouter(
    prefix='/ms-stock',
    tags=['ms-stock'],
    dependencies=[],
    responses={404: {"description": "Not found"}},
)


# Get All MsStock By Filter
@router.get("/filter", status_code=status.HTTP_200_OK)
async def get_stock_by_filter(
    db: db_dependency,
    search: Optional[str] = None,
    item_code: Optional[str] = None,
    article_id: Optional[str] = None,
    item_name: Optional[str] = None,
    mnemonic: Optional[str] = None,
    storage_bin: Optional[str] = None,
    stock_status: Optional[str] = None,
    active: Optional[str] = ACTIVE_DATA,
    page: Optional[int] = 1
):
    return service.get_stock_by_filter(db, search, item_code, article_id, item_name, mnemonic, storage_bin,
                                       stock_status, active, page)


# Get Selected MsStock Data
@router.get("/{item_code:path}", status_code=status.HTTP_200_OK)
async def get_selected_stock(db: db_dependency, item_code: str):
    # Get Selected Data
    ms_stock_model = service.get_stock_by_code(db, item_code)

    # When Data Not Found
    if ms_stock_model is not None:
        return ms_stock_model
    raise HTTPException(status_code=404, detail=MS_STOCK_DOES_NOT_EXIST_ERROR)


# Create New MsStock Data
@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_stock(db: db_dependency,
                       stock_request: schemas.MsStockCreate):
    # Create Data
    return service.create_stock(db, stock_request)


# Update MsStock Data (also pushes the changed data and blinks the LED in SOLUM)
@router.put('/update/{item_code:path}', status_code=status.HTTP_200_OK)
async def update_stock(db: db_dependency,
                       stock_request: schemas.MsStockUpdate, item_code: str):
    # Update Data
    return await service.update_stock(db, stock_request, item_code)


# Delete MsStock Data (database only; the SOLUM label is not changed)
@router.delete('/delete/{item_code:path}', status_code=status.HTTP_200_OK)
async def delete_stock(db: db_dependency, item_code: str):
    # Delete Data
    return service.delete_stock(db, item_code)
