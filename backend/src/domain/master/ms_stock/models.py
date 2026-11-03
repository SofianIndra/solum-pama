from sqlalchemy import Column, Integer, String

from src.database import Base


# Create MsStock Table -- stock per item; article_id links the row to its SOLUM article (label)
class MsStock(Base):
    __tablename__ = 'ms_stock'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    item_code = Column(String, index=True)
    # SOLUM articleId the article data and LED are sent to; one ms_stock row per article
    article_id = Column(String, index=True)
    item_name = Column(String)
    mnemonic = Column(String)
    own_stock = Column(Integer)
    min_stock = Column(Integer)
    max_stock = Column(Integer)
    storage_bin = Column(String)
    stock_on_hand = Column(Integer)
    stock_on_hand_rfid = Column(Integer)
    # KOSONG / UNDER MIN / AMAN / OVER MAX, always computed by the service, never sent by the client
    stock_status = Column(String)
    active = Column(String)
    updated_at = Column(String)
    updated_by = Column(String)
