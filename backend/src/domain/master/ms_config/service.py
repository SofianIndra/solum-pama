import ipaddress
import os
import re
from typing import Optional
from urllib.parse import urlparse

from dotenv import load_dotenv
from fastapi import HTTPException

from resources.strings import (MS_CONFIG_INVALID_ON_PREMISE_IP_ERROR,
                               MS_CONFIG_INVALID_ON_PREMISE_PORT_ERROR, MS_CONFIG_INVALID_SAAS_API_URL_ERROR,
                               MS_CONFIG_INVALID_SERVER_TYPE_ERROR, MS_CONFIG_ON_PREMISE_IP_REQUIRED_ERROR,
                               MS_CONFIG_ON_PREMISE_PORT_REQUIRED_ERROR, MS_CONFIG_SAAS_API_URL_REQUIRED_ERROR,
                               MS_CONFIG_UPDATE_SUCCESS)
from src.config import (ACTIVE_DATA, GUEST_USER_CODE, SOLUM_SERVER_ON_PREMISE, SOLUM_SERVER_SAAS,
                        VALID_SOLUM_SERVER_TYPES, get_branch_time)
from src.database import SessionLocal, db_dependency
from src.domain.master.ms_config.models import MsConfig
from src.domain.master.ms_config.schemas import (MessageResponse, MsConfigSolumServerResponse,
                                                 MsConfigSolumServerUpdate, MsConfigSolumServerValues)

# Load environment variables from .env
load_dotenv()

# Defaults used until the Config tab saves a row; SOLUM_API_URL is the SaaS URL
SOLUM_SERVER_TYPE = (os.getenv('SOLUM_SERVER_TYPE') or SOLUM_SERVER_SAAS).upper()
SOLUM_ON_PREMISE_IP = os.getenv('SOLUM_ON_PREMISE_IP') or None
SOLUM_ON_PREMISE_PORT = int(os.getenv('SOLUM_ON_PREMISE_PORT') or '0') or None
SOLUM_ON_PREMISE_SCHEME = os.getenv('SOLUM_ON_PREMISE_SCHEME') or 'http'
SOLUM_SAAS_API_URL = (os.getenv('SOLUM_API_URL') or '').rstrip('/') or None

# ms_config.code of the SOLUM server row
SOLUM_SERVER_CODE = 'SOLUM_SERVER'

# One DNS label: letters, digits and inner hyphens
HOST_LABEL_PATTERN = r'[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?'
HOST_NAME_PATTERN = re.compile(rf'^{HOST_LABEL_PATTERN}(\.{HOST_LABEL_PATTERN})*$')


# Get Selected MsConfig
def get_config_by_code(db: db_dependency, code: str):
    return db.query(MsConfig).filter(MsConfig.code == code).first()


# Get SOLUM Server Defaults From Env
def get_solum_server_defaults():
    return MsConfigSolumServerValues(
        server_type=SOLUM_SERVER_TYPE,
        on_premise_ip=SOLUM_ON_PREMISE_IP,
        on_premise_port=SOLUM_ON_PREMISE_PORT,
        saas_api_url=SOLUM_SAAS_API_URL,
    )


# Get SOLUM Server Values (the saved row, or the .env defaults while nothing is saved)
def get_solum_server_values(row: Optional[MsConfig]):
    if row is None:
        return get_solum_server_defaults()
    return MsConfigSolumServerValues(
        server_type=row.server_type,
        on_premise_ip=row.on_premise_ip,
        on_premise_port=row.on_premise_port,
        saas_api_url=row.saas_api_url,
    )


# Build SOLUM API URL
# On Premise -> <SOLUM_ON_PREMISE_SCHEME>://<ip>:<port>, SaaS -> the API URL as is. Empty when the chosen
# type is missing a value, so the SOLUM client can say the server is not set.
def build_api_url(values: MsConfigSolumServerValues):
    if values.server_type == SOLUM_SERVER_ON_PREMISE:
        if not values.on_premise_ip or not values.on_premise_port:
            return ''
        # An IPv6 address needs brackets inside a URL
        host = f'[{values.on_premise_ip}]' if ':' in values.on_premise_ip else values.on_premise_ip
        return f'{SOLUM_ON_PREMISE_SCHEME}://{host}:{values.on_premise_port}'
    return (values.saas_api_url or '').rstrip('/')


# Get SOLUM API URL
# Called by the SOLUM client before every request, so a save on the Config tab applies to the next call
# without a restart. Opens its own session because the SOLUM client has none.
def get_solum_api_url():
    db = SessionLocal()
    try:
        return build_api_url(get_solum_server_values(get_config_by_code(db, SOLUM_SERVER_CODE)))
    finally:
        db.close()


# Get SOLUM Server Type
# ON_PREMISE or SAAS, read before every request like the API URL: the two servers have different APIs.
def get_solum_server_type():
    db = SessionLocal()
    try:
        return get_solum_server_values(get_config_by_code(db, SOLUM_SERVER_CODE)).server_type
    finally:
        db.close()


# Get SOLUM Server Config
def get_solum_server_config(db: db_dependency):
    row = get_config_by_code(db, SOLUM_SERVER_CODE)
    values = get_solum_server_values(row)
    return MsConfigSolumServerResponse(
        **values.dict(),
        api_url=build_api_url(values),
        on_premise_scheme=SOLUM_ON_PREMISE_SCHEME,
        is_saved=row is not None,
        updated_at=row.updated_at if row else None,
        updated_by=row.updated_by if row else None,
        defaults=get_solum_server_defaults(),
    )


# Is Valid Host (an IP address, or a host name that is not a malformed dotted number like 999.1.1.1)
def is_valid_host(host: str):
    try:
        ipaddress.ip_address(host)
        return True
    except ValueError:
        pass
    if re.fullmatch(r'[\d.]+', host):
        return False
    return len(host) <= 253 and HOST_NAME_PATTERN.match(host) is not None


# Is Valid HTTP URL
def is_valid_http_url(url: str):
    parsed = urlparse(url)
    return parsed.scheme in ('http', 'https') and bool(parsed.netloc)


# Validate SOLUM Server Config
# The chosen type's fields are required; the other type's fields are optional but still checked when
# sent, since they are stored for when the user switches back.
def validate_solum_server(request: MsConfigSolumServerUpdate):
    if request.server_type not in VALID_SOLUM_SERVER_TYPES:
        raise HTTPException(status_code=400, detail=MS_CONFIG_INVALID_SERVER_TYPE_ERROR)

    if request.server_type == SOLUM_SERVER_ON_PREMISE:
        if not request.on_premise_ip:
            raise HTTPException(status_code=400, detail=MS_CONFIG_ON_PREMISE_IP_REQUIRED_ERROR)
        if request.on_premise_port is None:
            raise HTTPException(status_code=400, detail=MS_CONFIG_ON_PREMISE_PORT_REQUIRED_ERROR)
    if request.server_type == SOLUM_SERVER_SAAS and not request.saas_api_url:
        raise HTTPException(status_code=400, detail=MS_CONFIG_SAAS_API_URL_REQUIRED_ERROR)

    if request.on_premise_ip and not is_valid_host(request.on_premise_ip):
        raise HTTPException(status_code=400, detail=MS_CONFIG_INVALID_ON_PREMISE_IP_ERROR)
    if request.on_premise_port is not None and not 1 <= request.on_premise_port <= 65535:
        raise HTTPException(status_code=400, detail=MS_CONFIG_INVALID_ON_PREMISE_PORT_ERROR)
    if request.saas_api_url and not is_valid_http_url(request.saas_api_url):
        raise HTTPException(status_code=400, detail=MS_CONFIG_INVALID_SAAS_API_URL_ERROR)


# Update SOLUM Server Config (creates the row on the first save)
def update_solum_server_config(db: db_dependency, request: MsConfigSolumServerUpdate):
    validate_solum_server(request)

    # Get Selected Data
    ms_config_model = get_config_by_code(db, SOLUM_SERVER_CODE)
    if ms_config_model is None:
        ms_config_model = MsConfig(code=SOLUM_SERVER_CODE, active=ACTIVE_DATA)

    # Variable that want to update
    ms_config_model.server_type = request.server_type
    ms_config_model.on_premise_ip = request.on_premise_ip or None
    ms_config_model.on_premise_port = request.on_premise_port
    ms_config_model.saas_api_url = (request.saas_api_url or '').rstrip('/') or None
    ms_config_model.updated_by = GUEST_USER_CODE
    ms_config_model.updated_at = get_branch_time(None)

    # Add data to database
    db.add(ms_config_model)
    db.commit()

    # Update Response
    return MessageResponse(message=MS_CONFIG_UPDATE_SUCCESS)
