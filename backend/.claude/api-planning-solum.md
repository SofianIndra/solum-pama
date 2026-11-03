# API Planning — SOLUM (default & dropdown)

Router `src/routers/solum.py`, service `src/domain/master/solum/service.py`, klien
`src/services/solum_client.py`. Tidak punya tabel.

## GET /solum/defaults

`{ "company": SOLUM_COMPANY, "store": SOLUM_STORE, "led_duration": SOLUM_LED_DURATION }`.
Frontend memakai ini sebagai nilai awal form; user boleh menggantinya.

## GET /solum/stores?company=&store_name=

Meneruskan ke SOLUM `GET /common/api/v2/common/store?company=&size=SEARCH_PAGE_SIZE&storeName=`.
`storeName` dicocokkan SOLUM secara case-sensitive. Respons diurutkan kode store:
`[{ "store": "ST1", "store_name": "Store Satu" }]`. Company tanpa akses (SOLUM `401`) →
`502` dengan pesan "Company X tidak ditemukan, ...".

## GET /solum/articles?company=&store=&name=

Meneruskan ke SOLUM `GET /common/api/v2/common/articles?company=&store=&size=SEARCH_PAGE_SIZE&name=`.
Respons: `[{ "article_id": "B100001", "article_name": "OAP DISPENSER" }]`. Tidak ada hasil
(SOLUM `204`) → `[]`.

## Error

Semua kegagalan SOLUM → `502`, `detail` menyebut API SOLUM yang gagal (`Daftar Store`,
`Daftar Artikel`, atau `Login (ambil token)` yang dibutuhkan untuknya), URL, dan alasannya. Format
lengkap: `konsep-backend.md` → Error SOLUM.
