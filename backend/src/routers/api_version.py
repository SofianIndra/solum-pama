from fastapi import APIRouter
from src.domain.api_version import service
from starlette import status

# Api Router
router = APIRouter(
    prefix='/api-version',
    tags=['api-version'],
    dependencies=[],
    responses={404: {"description": "Not found"}},
)


# Get API Version
@router.get("/", status_code=status.HTTP_200_OK)
async def get_api_version():
    return service.get_api_version()
