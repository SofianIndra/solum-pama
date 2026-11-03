from sqlalchemy import Column, Integer, String

from src.database import Base


# Create MsConfig Table -- app settings chosen on the Config tab, one row per code (e.g. SOLUM_SERVER)
class MsConfig(Base):
    __tablename__ = 'ms_config'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    code = Column(String, index=True)
    # ON_PREMISE / SAAS; the other type's fields are kept so switching back does not retype them
    server_type = Column(String)
    on_premise_ip = Column(String)
    on_premise_port = Column(Integer)
    saas_api_url = Column(String)
    active = Column(String)
    updated_at = Column(String)
    updated_by = Column(String)
