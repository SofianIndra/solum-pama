from typing import Optional

from pydantic import BaseModel

from src.domain.request_schema import TrimmedRequest


# Update SOLUM Server Config (only the fields of the chosen server_type are required)
class MsConfigSolumServerUpdate(TrimmedRequest):
    server_type: str
    on_premise_ip: Optional[str] = None
    on_premise_port: Optional[int] = None
    saas_api_url: Optional[str] = None


# SOLUM Server Values (the .env defaults, or the saved row)
class MsConfigSolumServerValues(BaseModel):
    server_type: str
    on_premise_ip: Optional[str]
    on_premise_port: Optional[int]
    saas_api_url: Optional[str]


# SOLUM Server Config Response
# api_url is the base URL every SOLUM call goes to now; on_premise_scheme (SOLUM_ON_PREMISE_SCHEME) lets the
# FE preview the On Premise URL. is_saved is false while nothing was saved from the Config tab yet, so the
# values are the .env defaults.
class MsConfigSolumServerResponse(MsConfigSolumServerValues):
    api_url: str
    on_premise_scheme: str
    is_saved: bool
    updated_at: Optional[str]
    updated_by: Optional[str]
    defaults: MsConfigSolumServerValues


# Message Response
class MessageResponse(BaseModel):
    message: str
