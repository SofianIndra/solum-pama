from typing import Any, List, Optional

from pydantic import BaseModel

from src.domain.request_schema import TrimmedRequest


# Create New MsStock (stock_status is computed, so it is not part of the body)
# article_id is the SOLUM article picked on the Create tab; item_code is typed by the user.
class MsStockCreate(TrimmedRequest):
    item_code: str
    article_id: str
    item_name: str
    mnemonic: Optional[str] = None
    own_stock: int
    min_stock: int
    max_stock: int
    storage_bin: Optional[str] = None
    stock_on_hand: Optional[int] = None
    stock_on_hand_rfid: Optional[int] = None


# Update MsStock (the path item_code picks the row; item_code in the body renames it)
# Every column is optional: a field left out keeps its current value, so the Used Stock tab can send
# own_stock alone. item_code and article_id must stay unique. company/store pick the SOLUM store to
# update; empty means SOLUM_COMPANY/SOLUM_STORE.
class MsStockUpdate(TrimmedRequest):
    item_code: Optional[str] = None
    article_id: Optional[str] = None
    item_name: Optional[str] = None
    mnemonic: Optional[str] = None
    own_stock: Optional[int] = None
    min_stock: Optional[int] = None
    max_stock: Optional[int] = None
    storage_bin: Optional[str] = None
    stock_on_hand: Optional[int] = None
    stock_on_hand_rfid: Optional[int] = None
    active: Optional[str] = None
    company: Optional[str] = None
    store: Optional[str] = None


# MsStock Response (one row)
class MsStockResponse(BaseModel):
    id: int
    item_code: str
    article_id: Optional[str]
    item_name: Optional[str]
    mnemonic: Optional[str]
    own_stock: Optional[int]
    min_stock: Optional[int]
    max_stock: Optional[int]
    storage_bin: Optional[str]
    stock_on_hand: Optional[int]
    stock_on_hand_rfid: Optional[int]
    stock_status: Optional[str]
    active: Optional[str]
    updated_at: Optional[str]
    updated_by: Optional[str]


# MsStock Filter Response (one page of rows + totals across all pages for the same filter)
class MsStockFilterResponse(BaseModel):
    data: List[MsStockResponse]
    page: int
    total_items: int
    total_page: int


# One SOLUM call made by the update: what was sent and what SOLUM answered
class SolumCallResult(BaseModel):
    is_sent: bool
    is_success: bool
    message: str
    method: Optional[str]
    url: Optional[str]
    status_code: Optional[int]
    payload: Optional[Any]
    response: Optional[Any]


# MsStock Update Response (the saved row plus both SOLUM calls, so the FE can show the result)
class MsStockUpdateResponse(BaseModel):
    message: str
    company: str
    store: str
    data: MsStockResponse
    solum_article: SolumCallResult
    solum_led: SolumCallResult


# Message Response
class MessageResponse(BaseModel):
    message: str
