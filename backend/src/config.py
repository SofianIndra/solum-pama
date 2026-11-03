import os
from datetime import datetime

import pytz
from dotenv import load_dotenv

load_dotenv()

###
# Properties configurations
###

LIMIT = int(os.getenv('LIMIT') or 30)

# AUDIT USER (every endpoint is public, so updated_by is this code instead of a logged-in user;
# with no user branch, updated_at uses Asia/Jakarta)
GUEST_USER_CODE = os.getenv('GUEST_USER_CODE') or 'GUEST'

# ACTIVE STATUS
ALL_DATA = 'ALL'
ACTIVE_DATA = 'ACTIVE'
INACTIVE_DATA = 'INACTIVE'

# BRANCH CODE
BALI_BRANCH_CODE = '19'

# STOCK STATUS VALUES (ms_stock.stock_status, computed from own_stock against min_stock / max_stock)
STOCK_STATUS_EMPTY = 'KOSONG'
STOCK_STATUS_UNDER_MIN = 'UNDER MIN'
STOCK_STATUS_SAFE = 'AMAN'
STOCK_STATUS_OVER_MAX = 'OVER MAX'

# LED COLOR PER STOCK STATUS (the ESL label blinks this color after every ms_stock update)
STOCK_STATUS_LED_COLORS = {
    STOCK_STATUS_EMPTY: 'WHITE',
    STOCK_STATUS_UNDER_MIN: 'YELLOW',
    STOCK_STATUS_SAFE: 'GREEN',
    STOCK_STATUS_OVER_MAX: 'RED',
}

# SOLUM SERVER TYPE VALUES (ms_config.server_type: which AIMS server every SOLUM call goes to)
SOLUM_SERVER_ON_PREMISE = 'ON_PREMISE'
SOLUM_SERVER_SAAS = 'SAAS'
VALID_SOLUM_SERVER_TYPES = (SOLUM_SERVER_ON_PREMISE, SOLUM_SERVER_SAAS)

# VALID LED DURATION VALUES (accepted by SOLUM PUT /common/api/v2/common/articles/led)
VALID_LED_DURATIONS = ('0s', '10s', '30s', '60s', '1m', '90s', '120s', '2m', '150s', '300s', '5m',
                       '600s', '10m', '900s', '15m', '1200s', '20m', '1800s', '30m', '3600s', '60m')

# MS_STOCK COLUMN -> SOLUM ARTICLE DATA KEY (sent to SOLUM when one of these columns changes)
STOCK_SOLUM_DATA_KEYS = {
    'item_name': 'Mat_Desc',
    'mnemonic': 'Mnemonic',
    'own_stock': 'Own_Stock',
    'storage_bin': 'Storage_Bin',
    'min_stock': 'MinStock',
    'max_stock': 'MaxStock',
    'stock_on_hand': 'StockOnHand',
    'stock_on_hand_rfid': 'StockOnHandRFID',
}


# BRANCH TIME IN ISOFORMAT
def get_branch_time(branch_code: str):
    if branch_code == BALI_BRANCH_CODE:
        return datetime.now(pytz.timezone('Asia/Makassar')).isoformat()
    else:
        return datetime.now(pytz.timezone('Asia/Jakarta')).isoformat()


# BRANCH TIME IS DATETIME FORMAT
def get_branch_date(branch_code: str):
    if branch_code == BALI_BRANCH_CODE:
        return datetime.now(pytz.timezone('Asia/Makassar'))
    else:
        return datetime.now(pytz.timezone('Asia/Jakarta'))
