from typing import Optional

from fastapi import APIRouter
from resources.strings import SOLUM_PAGE_FLIP_OFF, SOLUM_PAGE_FLIP_RESTARTED
from src.domain.master.solum import service
from src.scheduler.page_flip_scheduler import restart_page_flip_scheduler
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


# Restart Page Flip (the FE calls this each time the web is loaded: labels go back to page 1 and the cycle
# starts over from there)
@router.post("/page-flip/restart", status_code=status.HTTP_200_OK)
async def restart_page_flip():
    restarted = restart_page_flip_scheduler()
    return {"message": SOLUM_PAGE_FLIP_RESTARTED if restarted else SOLUM_PAGE_FLIP_OFF}
