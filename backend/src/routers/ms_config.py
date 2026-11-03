from fastapi import APIRouter
from src.database import db_dependency
from src.domain.master.ms_config import schemas, service
from starlette import status

# Api Router
router = APIRouter(
    prefix='/ms-config',
    tags=['ms-config'],
    dependencies=[],
    responses={404: {"description": "Not found"}},
)


# Get SOLUM Server Config (the saved row, or the .env defaults)
@router.get("/solum-server", status_code=status.HTTP_200_OK)
async def get_solum_server_config(db: db_dependency):
    return service.get_solum_server_config(db)


# Update SOLUM Server Config (the next SOLUM call goes to the new server)
@router.put('/update/solum-server', status_code=status.HTTP_200_OK)
async def update_solum_server_config(db: db_dependency,
                                     config_request: schemas.MsConfigSolumServerUpdate):
    # Update Data
    return service.update_solum_server_config(db, config_request)
