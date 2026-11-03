from typing import Optional

from fastapi import APIRouter
from src.domain.master.solum import service
from starlette import status

# Api Router
router = APIRouter(
    prefix='/solum',
    tags=['solum'],
    dependencies=[],
    responses={404: {"description": "Not found"}},
)


# Get SOLUM Defaults From Env
@router.get("/defaults", status_code=status.HTTP_200_OK)
async def get_solum_defaults():
    return service.get_defaults()


# Get SOLUM Stores (store dropdown)
@router.get("/stores", status_code=status.HTTP_200_OK)
async def get_solum_stores(company: str, store_name: Optional[str] = None):
    return await service.get_stores(company, store_name)


# Get SOLUM Articles (article dropdown)
@router.get("/articles", status_code=status.HTTP_200_OK)
async def get_solum_articles(company: str, store: str,
                             name: Optional[str] = None):
    return await service.get_articles(company, store, name)
