from pydantic import BaseModel


# API Version Model
class ApiVersion(BaseModel):
    version: str
