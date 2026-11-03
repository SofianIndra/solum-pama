from typing import Optional

from pydantic import BaseModel


# SOLUM Defaults (values from .env the FE starts its forms with; the user can change company/store)
class SolumDefaultsResponse(BaseModel):
    company: str
    store: str
    led_duration: str


# SOLUM Store (one row of the store dropdown)
class SolumStoreResponse(BaseModel):
    store: str
    store_name: Optional[str]


# SOLUM Article (one row of the article dropdown)
class SolumArticleResponse(BaseModel):
    article_id: str
    article_name: Optional[str]
