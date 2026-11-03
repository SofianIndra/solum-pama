import json
import logging
import os
import time
from typing import Optional
from urllib.parse import urlencode

import httpx
from dotenv import load_dotenv

from src.config import SOLUM_SERVER_ON_PREMISE
from src.domain.master.ms_config import service as serviceMsConfig

# Load environment variables from .env
load_dotenv()

# uvicorn only prints its own loggers, so SOLUM traffic is logged through uvicorn.error to show up
# in the console next to the request log (every SOLUM request and reply is logged on purpose)
logger = logging.getLogger('uvicorn.error')

SOLUM_COMPANY = os.getenv('SOLUM_COMPANY') or ''
SOLUM_STORE = os.getenv('SOLUM_STORE') or ''
SOLUM_API_TOKEN = os.getenv('SOLUM_API_TOKEN') or ''
SOLUM_USERNAME = os.getenv('SOLUM_USERNAME') or ''
SOLUM_PASSWORD = os.getenv('SOLUM_PASSWORD') or ''
SOLUM_TOKEN_PATH = os.getenv('SOLUM_TOKEN_PATH') or '/common/api/v2/token'
SOLUM_TIMEOUT_SECONDS = float(os.getenv('SOLUM_TIMEOUT_SECONDS') or '30')
SOLUM_LED_DURATION = os.getenv('SOLUM_LED_DURATION') or '60s'
SOLUM_LED_PATTERN_ID = int(os.getenv('SOLUM_LED_PATTERN_ID') or '0')
SOLUM_LED_MULTI_LED = (os.getenv('SOLUM_LED_MULTI_LED') or 'false').lower() == 'true'
SEARCH_PAGE_SIZE = int(os.getenv('SEARCH_PAGE_SIZE') or '10')

ARTICLES_PATH = '/common/api/v2/common/articles'
ARTICLES_LED_PATH = '/common/api/v2/common/articles/led'
STORES_PATH = '/common/api/v2/common/store'

# On Premise AIMS (Core v4) has its own API: no login, a store is a station (stationCode) and there is
# no company
ON_PREMISE_STATIONS_PATH = '/stations'
ON_PREMISE_ARTICLES_PATH = '/articles'
ON_PREMISE_ARTICLE_PATH = '/articles/article'
ON_PREMISE_ARTICLE_LABELS_PATH = '/labels/article'
ON_PREMISE_LABELS_LED_PATH = '/labels/contents/led'
ON_PREMISE_LABELS_PATH = '/labels'
ON_PREMISE_LABELS_PAGE_PATH = '/labels/contents/page'
ON_PREMISE_LABEL_TYPE_PATH = '/labels/type'

# Labels read per GET /labels request; the label list is paged (X-totalPages header)
ON_PREMISE_LABEL_LIST_SIZE = 100

# On Premise GET /articles has no name filter, so up to this many articles are read and filtered here
ON_PREMISE_ARTICLE_SEARCH_SIZE = 1000

# Refresh a minute early so a token never expires halfway through a request
TOKEN_EXPIRY_MARGIN_SECONDS = 60

# Longest part of a SOLUM reply quoted in an error message
ERROR_BODY_MAX_LENGTH = 300

# Token from the username/password login: {'api_url': str, 'value': str, 'expires_at': epoch seconds}.
# It belongs to the server it was fetched from, so switching server on the Config tab logs in again.
cached_token = None


# One SOLUM API this service calls; name is how error messages tell the user which call failed
class SolumApi:
    def __init__(self, name: str, method: str, path: str):
        self.name = name
        self.method = method
        self.path = path


LOGIN_API = SolumApi('Login (ambil token)', 'POST', SOLUM_TOKEN_PATH)
PUSH_ARTICLES_API = SolumApi('Kirim Data Artikel', 'POST', ARTICLES_PATH)
BLINK_LED_API = SolumApi('Nyalakan LED Label', 'PUT', ARTICLES_LED_PATH)
LIST_STORES_API = SolumApi('Daftar Store', 'GET', STORES_PATH)
LIST_ARTICLES_API = SolumApi('Daftar Artikel', 'GET', ARTICLES_PATH)
ON_PREMISE_LIST_STORES_API = SolumApi('Daftar Store', 'GET', ON_PREMISE_STATIONS_PATH)
ON_PREMISE_LIST_ARTICLES_API = SolumApi('Daftar Artikel', 'GET', ON_PREMISE_ARTICLES_PATH)
ON_PREMISE_GET_ARTICLE_API = SolumApi('Ambil Data Artikel', 'GET', ON_PREMISE_ARTICLE_PATH)
ON_PREMISE_PUSH_ARTICLES_API = SolumApi('Kirim Data Artikel', 'POST', ON_PREMISE_ARTICLES_PATH)
ON_PREMISE_ARTICLE_LABELS_API = SolumApi('Cari Label Artikel', 'GET', ON_PREMISE_ARTICLE_LABELS_PATH)
ON_PREMISE_BLINK_LED_API = SolumApi('Nyalakan LED Label', 'PUT', ON_PREMISE_LABELS_LED_PATH)
ON_PREMISE_LIST_LABELS_API = SolumApi('Daftar Label', 'GET', ON_PREMISE_LABELS_PATH)
ON_PREMISE_LABEL_TYPE_API = SolumApi('Tipe Label', 'GET', ON_PREMISE_LABEL_TYPE_PATH)
ON_PREMISE_CHANGE_PAGE_API = SolumApi('Ganti Halaman Label', 'POST', ON_PREMISE_LABELS_PAGE_PATH)


# Raised for every failed SOLUM call. message names the SOLUM API that failed, its method + URL and the
# reason; status_code and body are SOLUM's reply when there was one.
class SolumError(Exception):
    def __init__(self, message: str, api: SolumApi, url: Optional[str] = None,
                 status_code: Optional[int] = None, body=None):
        super().__init__(message)
        self.message = message
        self.api_name = api.name
        self.method = api.method
        self.url = url
        self.status_code = status_code
        self.body = body


# Build SolumError
# url is None when the API was not called at all (server or credentials not set). required_by names the
# API the user asked for when the failing call is the login made for it.
def build_solum_error(api: SolumApi, url: Optional[str], reason: str, required_by: Optional[SolumApi] = None,
                      status_code: Optional[int] = None, body=None):
    target = f'SOLUM API "{api.name}" ({api.method} {url or api.path})'
    context = f', dibutuhkan untuk SOLUM API "{required_by.name}"' if required_by else ''
    verb = 'gagal' if url else 'tidak dipanggil'
    return SolumError(f'{target} {verb}{context}: {reason}', api, url, status_code, body)


# Base URL of the SOLUM server chosen on the Config tab (On Premise ip:port or SaaS API URL), or the
# .env defaults while the tab has saved nothing
def get_api_url(api: SolumApi):
    api_url = serviceMsConfig.get_solum_api_url()
    if not api_url:
        raise build_solum_error(api, None, 'server SOLUM belum diatur, isi IP + port (On Premise) atau '
                                           'API URL (SaaS) di tab Config')
    return api_url


# True when the Config tab points at an On Premise AIMS server
def is_on_premise():
    return serviceMsConfig.get_solum_server_type() == SOLUM_SERVER_ON_PREMISE


# On Premise has no API for this call yet, so it is not sent instead of hitting a SaaS path there
def raise_on_premise_not_supported(api: SolumApi):
    if is_on_premise():
        raise build_solum_error(api, None, 'belum didukung untuk server On Premise')


# Full SOLUM URL of a call, for logs, error messages and the result shown to the user
def build_full_url(api_url: str, path: str, params: Optional[dict] = None):
    return f'{api_url}{path}?{urlencode(params)}' if params else f'{api_url}{path}'


# Full SOLUM URL of a company/store call
def build_url(path: str, company: str, store: str):
    return build_full_url(serviceMsConfig.get_solum_api_url(), path, {'company': company, 'store': store})


# Body of a SOLUM reply; "no match" searches answer an empty 204
def read_solum_body(response: httpx.Response):
    if not response.content:
        return None
    try:
        return response.json()
    except ValueError:
        return response.text


# SOLUM's own reason from an error reply: its message field when there is one, else the raw body
def describe_solum_body(body):
    if isinstance(body, dict):
        for key in ('responseMessage', 'message', 'error_description', 'error', 'detail'):
            if isinstance(body.get(key), str) and body[key].strip():
                return body[key].strip()
        text = json.dumps(body)
    else:
        text = str(body or '').strip()
    if len(text) > ERROR_BODY_MAX_LENGTH:
        return f'{text[:ERROR_BODY_MAX_LENGTH]}...'
    return text or 'tanpa isi respons'


# Send one request to SOLUM
# Network errors and non-2xx replies become a SolumError naming the API. allowed_statuses are replies the
# caller handles itself (e.g. the store list's 401).
async def send_solum_request(api_url: str, api: SolumApi, required_by: Optional[SolumApi] = None,
                             allowed_statuses: tuple = (), **kwargs):
    url = build_full_url(api_url, api.path, kwargs.get('params'))
    try:
        async with httpx.AsyncClient(base_url=api_url, timeout=SOLUM_TIMEOUT_SECONDS) as client:
            response = await client.request(api.method, api.path, **kwargs)
    except httpx.TimeoutException as error:
        logger.error('[SOLUM] x %s %s timeout: %s', api.method, url, error)
        raise build_solum_error(api, url, f'tidak ada respons dalam {SOLUM_TIMEOUT_SECONDS:g} detik',
                                required_by)
    except httpx.HTTPError as error:
        logger.error('[SOLUM] x %s %s tanpa respons: %s', api.method, url, error)
        raise build_solum_error(api, url, f'server tidak dapat dihubungi ({error or type(error).__name__})',
                                required_by)

    # The login reply carries the token and the label list is large and read every few seconds by the page
    # flip scheduler, so only their status is logged
    reply_text = '' if api in (LOGIN_API, ON_PREMISE_LIST_LABELS_API) else response.text
    logger.info('[SOLUM] <- %s %s HTTP %s %s', api.method, api.path, response.status_code, reply_text)
    if response.is_success or response.status_code in allowed_statuses:
        return response
    body = read_solum_body(response)
    raise build_solum_error(api, url, f'HTTP {response.status_code} - {describe_solum_body(body)}',
                            required_by, response.status_code, body)


# Get Access Token
# SOLUM_API_TOKEN wins when it is set; otherwise log in with SOLUM_USERNAME + SOLUM_PASSWORD and
# keep that token until it is about to expire. required_by is the API the token is for.
async def get_access_token(api_url: str, required_by: SolumApi):
    global cached_token

    # Option 1: a static token from env
    if SOLUM_API_TOKEN:
        return SOLUM_API_TOKEN

    # Option 2: cached login token
    if cached_token and cached_token['api_url'] == api_url and time.time() < cached_token['expires_at']:
        return cached_token['value']

    if not SOLUM_USERNAME or not SOLUM_PASSWORD:
        raise build_solum_error(LOGIN_API, None, 'isi SOLUM_API_TOKEN, atau SOLUM_USERNAME + SOLUM_PASSWORD '
                                                 'di .env', required_by)

    logger.info('[SOLUM] -> POST %s%s (login sebagai %s)', api_url, SOLUM_TOKEN_PATH, SOLUM_USERNAME)
    response = await send_solum_request(api_url, LOGIN_API, required_by,
                                        json={'username': SOLUM_USERNAME, 'password': SOLUM_PASSWORD})

    body = read_solum_body(response)
    message = body.get('responseMessage', body) if isinstance(body, dict) else body
    token = message.get('access_token') if isinstance(message, dict) else None
    if not token:
        raise build_solum_error(LOGIN_API, build_full_url(api_url, SOLUM_TOKEN_PATH),
                                f'access_token tidak ada di respons login: {describe_solum_body(body)}',
                                required_by, response.status_code, body)

    ttl_seconds = float(message.get('expires_in') or 3600)
    cached_token = {'api_url': api_url, 'value': token,
                    'expires_at': time.time() + ttl_seconds - TOKEN_EXPIRY_MARGIN_SECONDS}
    return token


# Push Article Data
# Same endpoint the solum-alfa "Data Artikel" tab uses: POST /common/api/v2/common/articles.
# SOLUM only queues the update; the label changes a moment later. Returns (status_code, body).
async def push_articles(articles: list, company: str, store: str):
    raise_on_premise_not_supported(PUSH_ARTICLES_API)
    api_url = get_api_url(PUSH_ARTICLES_API)
    token = await get_access_token(api_url, PUSH_ARTICLES_API)
    params = {'company': company, 'store': store}

    logger.info('[SOLUM] -> POST %s%s %s %s', api_url, ARTICLES_PATH, params, json.dumps(articles))
    response = await send_solum_request(api_url, PUSH_ARTICLES_API, params=params, json=articles,
                                        headers={'Authorization': f'Bearer {token}'})
    return response.status_code, read_solum_body(response)


# Blink Label LED By Article Id
# PUT /common/api/v2/common/articles/led with {"ledBlinkList": [...]}. Returns (status_code, body).
async def blink_article_led(led_blink_list: list, company: str, store: str):
    api_url = get_api_url(BLINK_LED_API)
    token = await get_access_token(api_url, BLINK_LED_API)
    params = {'company': company, 'store': store}
    body = {'ledBlinkList': led_blink_list}

    logger.info('[SOLUM] -> PUT %s%s %s %s', api_url, ARTICLES_LED_PATH, params, json.dumps(body))
    response = await send_solum_request(api_url, BLINK_LED_API, params=params, json=body,
                                        headers={'Authorization': f'Bearer {token}'})
    return response.status_code, read_solum_body(response)


# List Stores
# One company's stores, at most SEARCH_PAGE_SIZE rows. store_name is SOLUM's case-sensitive "contains"
# match. SOLUM answers 401 (not 404) for a company this account cannot see, so it gets its own message.
async def list_stores(company: str, store_name: Optional[str] = None):
    if is_on_premise():
        return await list_on_premise_stations(store_name)

    api_url = get_api_url(LIST_STORES_API)
    token = await get_access_token(api_url, LIST_STORES_API)
    params = {'company': company, 'size': SEARCH_PAGE_SIZE}
    if store_name:
        params['storeName'] = store_name

    response = await send_solum_request(api_url, LIST_STORES_API, allowed_statuses=(401,), params=params,
                                        headers={'Authorization': f'Bearer {token}'})
    if response.status_code == 401:
        raise build_solum_error(LIST_STORES_API, build_full_url(api_url, STORES_PATH, params),
                                f'HTTP 401 - company {company} tidak ditemukan, atau akun SOLUM tidak punya '
                                'akses ke company ini', None, 401, read_solum_body(response))

    body = read_solum_body(response)
    if not isinstance(body, dict):
        return []
    return body.get('stores') or []


# List Articles
# A store's articles, at most SEARCH_PAGE_SIZE rows. name is a case-insensitive "contains" match.
async def list_articles(company: str, store: str, name: Optional[str] = None):
    if is_on_premise():
        return await list_on_premise_articles(store, name)

    api_url = get_api_url(LIST_ARTICLES_API)
    token = await get_access_token(api_url, LIST_ARTICLES_API)
    params = {'company': company, 'store': store, 'size': SEARCH_PAGE_SIZE}
    if name:
        params['name'] = name

    response = await send_solum_request(api_url, LIST_ARTICLES_API, params=params,
                                        headers={'Authorization': f'Bearer {token}'})

    body = read_solum_body(response)
    if not isinstance(body, dict):
        return []
    return body.get('articleList') or []


# List On Premise Stations
# GET /stations without a token; a station is the store. Rows use the SaaS keys (store, storeName) so
# callers read both servers the same way. store_name is a case-sensitive "contains" match like SaaS.
async def list_on_premise_stations(store_name: Optional[str] = None):
    api_url = get_api_url(ON_PREMISE_LIST_STORES_API)
    response = await send_solum_request(api_url, ON_PREMISE_LIST_STORES_API)

    body = read_solum_body(response)
    if not isinstance(body, list):
        return []
    stations = [{'store': row.get('code'), 'storeName': row.get('name')} for row in body]
    if store_name:
        stations = [row for row in stations if store_name in (row['storeName'] or '')]
    return stations[:SEARCH_PAGE_SIZE]


# List On Premise Articles
# GET /articles?stationCode=... without a token; SOLUM answers an empty 204 for a station with no articles.
# Rows use the SaaS keys (articleId, articleName). name is a case-insensitive "contains" match on the id
# or name, done here because On Premise has no name filter.
async def list_on_premise_articles(store: str, name: Optional[str] = None):
    api_url = get_api_url(ON_PREMISE_LIST_ARTICLES_API)
    params = {'stationCode': store, 'size': ON_PREMISE_ARTICLE_SEARCH_SIZE if name else SEARCH_PAGE_SIZE}
    response = await send_solum_request(api_url, ON_PREMISE_LIST_ARTICLES_API, params=params)

    body = read_solum_body(response)
    if not isinstance(body, list):
        return []
    articles = [{'articleId': row.get('id'), 'articleName': row.get('name')} for row in body]
    if name:
        keyword = name.lower()
        articles = [row for row in articles
                    if keyword in (row['articleId'] or '').lower() or keyword in (row['articleName'] or '').lower()]
    return articles[:SEARCH_PAGE_SIZE]


# Blink On Premise Label LED By Article Id
# On Premise blinks by label, not article: the article's labels are read from GET /labels/article, then
# PUT /labels/contents/led gets one entry per label. Returns (url, payload, status_code, body).
async def blink_on_premise_led(article_id: str, color: str, store: str):
    api_url = get_api_url(ON_PREMISE_BLINK_LED_API)

    label_params = {'stationCode': store, 'articleId': article_id}
    response = await send_solum_request(api_url, ON_PREMISE_ARTICLE_LABELS_API, ON_PREMISE_BLINK_LED_API,
                                        params=label_params)
    labels = read_solum_body(response)
    label_codes = [row.get('labelCode') for row in labels if row.get('labelCode')] \
        if isinstance(labels, list) else []
    if not label_codes:
        raise build_solum_error(ON_PREMISE_ARTICLE_LABELS_API,
                                build_full_url(api_url, ON_PREMISE_ARTICLE_LABELS_PATH, label_params),
                                f'artikel {article_id} belum terhubung ke label di store {store}',
                                ON_PREMISE_BLINK_LED_API, response.status_code, labels)

    payload = [{'color': color, 'duration': SOLUM_LED_DURATION, 'patternId': SOLUM_LED_PATTERN_ID,
                'labelCode': label_code} for label_code in label_codes]
    logger.info('[SOLUM] -> PUT %s%s %s', api_url, ON_PREMISE_LABELS_LED_PATH, json.dumps(payload))
    response = await send_solum_request(api_url, ON_PREMISE_BLINK_LED_API, json=payload)
    return build_full_url(api_url, ON_PREMISE_LABELS_LED_PATH), payload, response.status_code, \
        read_solum_body(response)


# Push On Premise Article Data
# POST /articles with {"dataList": [...]}. The article is read first (GET /articles/article) and only the
# stock keys in data are replaced, so the label's other fields (Part_Number, QR_Code, ...) and the
# article name are kept. An article the station does not have yet (empty 204) is created with
# name as its name. Returns (url, payload, status_code, body).
async def push_on_premise_article(article_id: str, name: str, data: dict, store: str):
    api_url = get_api_url(ON_PREMISE_PUSH_ARTICLES_API)

    response = await send_solum_request(api_url, ON_PREMISE_GET_ARTICLE_API, ON_PREMISE_PUSH_ARTICLES_API,
                                        params={'stationCode': store, 'articleId': article_id})
    article = read_solum_body(response)
    if not isinstance(article, dict):
        article = {}

    payload = {'dataList': [{
        'stationCode': store,
        'id': article_id,
        'name': article.get('name') or name,
        'nfc': article.get('nfc') or '',
        'data': {**(article.get('data') or {}), **data},
    }]}
    logger.info('[SOLUM] -> POST %s%s %s', api_url, ON_PREMISE_ARTICLES_PATH, json.dumps(payload))
    response = await send_solum_request(api_url, ON_PREMISE_PUSH_ARTICLES_API, json=payload)
    return build_full_url(api_url, ON_PREMISE_ARTICLES_PATH), payload, response.status_code, \
        read_solum_body(response)


# List On Premise Labels
# Every label of every station from GET /labels, page by page (page is 0-based, X-totalPages says how
# many there are). An empty 204 means there are no labels.
async def list_on_premise_labels():
    api_url = get_api_url(ON_PREMISE_LIST_LABELS_API)
    labels = []
    page = 0
    total_pages = 1
    while page < total_pages:
        response = await send_solum_request(api_url, ON_PREMISE_LIST_LABELS_API,
                                            params={'page': page, 'size': ON_PREMISE_LABEL_LIST_SIZE})
        body = read_solum_body(response)
        if not isinstance(body, list):
            break
        labels.extend(body)
        total_pages = int(response.headers.get('X-totalPages') or 1)
        page += 1
    return labels


# Get On Premise Label Total Page
# How many pages the label's hardware has (totalPage of GET /labels/type), or None when AIMS does not say.
async def get_on_premise_label_total_page(label_code: str):
    api_url = get_api_url(ON_PREMISE_LABEL_TYPE_API)
    response = await send_solum_request(api_url, ON_PREMISE_LABEL_TYPE_API, params={'code': label_code})
    body = read_solum_body(response)
    total_page = body.get('totalPage') if isinstance(body, dict) else None
    return total_page if isinstance(total_page, int) else None


# Change On Premise Label Page
# One POST /labels/contents/page for all the labels: {"labels": [{"labelCode", "displayPage"}, ...]}.
# Returns (status_code, body).
async def change_on_premise_label_page(label_codes: list, display_page: int):
    api_url = get_api_url(ON_PREMISE_CHANGE_PAGE_API)
    payload = {'labels': [{'labelCode': label_code, 'displayPage': display_page} for label_code in label_codes]}

    logger.info('[SOLUM] -> POST %s%s %s', api_url, ON_PREMISE_LABELS_PAGE_PATH, json.dumps(payload))
    response = await send_solum_request(api_url, ON_PREMISE_CHANGE_PAGE_API, json=payload)
    return response.status_code, read_solum_body(response)
