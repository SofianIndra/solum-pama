from fastapi import APIRouter
from src.domain.api_version import service
from src.routers import api_version, ms_config, ms_stock, solum

router = APIRouter()


# Define the root route (Get API Version)
@router.get("/")
def root():
    return service.get_api_version()


def include_api_routes():
    ''' Include to router all api rest routes with version prefix '''
    router.include_router(api_version.router)
    router.include_router(ms_config.router)
    router.include_router(ms_stock.router)
    router.include_router(solum.router)


include_api_routes()
