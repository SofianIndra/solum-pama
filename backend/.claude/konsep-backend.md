# Konsep Solum Panama

Aturan yang berlaku untuk semua endpoint di service ini.

## Autentikasi

Tidak ada. Semua endpoint publik dan tidak membaca header `Authorization` (frontend juga tidak
punya halaman login).

## Bentuk error

Semua error berbentuk `{"detail": "<pesan>"}`. Pesan berasal dari `resources/strings.py`.

| Status | Arti |
|---|---|
| `400` | Validasi bisnis gagal (mis. data sudah ada) |
| `404` | Data tidak ditemukan |
| `502` | SOLUM AIMS menolak request atau tidak dapat dihubungi; `detail` berisi pesan SOLUM |
| `422` | Body/query tidak sesuai skema (dari FastAPI) |

## Status data

Kolom `active` berisi `ACTIVE` atau `INACTIVE`. Endpoint `/filter` default-nya hanya
mengembalikan `ACTIVE`; kirim `active=ALL` untuk semua.

## Pagination

Endpoint `/filter` menerima `page` (mulai 1) dan mengembalikan `LIMIT` baris per halaman:

```json
{ "data": [], "page": 1, "total_items": 0, "total_page": 0 }
```

## Audit kolom

`updated_at` disimpan sebagai string ISO 8601 zona waktu `Asia/Jakarta`. `updated_by` selalu
berisi `GUEST_USER_CODE` dari `.env` (default `GUEST`), karena tidak ada user login.

## SOLUM AIMS

- Server tujuan dipilih di tab Config (`ms_config`): On Premise → `http://<ip>:<port>`, SaaS → API
  URL. Selama belum disimpan, default-nya dari `.env` (`SOLUM_SERVER_TYPE`, `SOLUM_ON_PREMISE_*`,
  `SOLUM_API_URL`). Detail: `api-planning-ms-config.md`.
- Autentikasi (token langsung atau login username/password yang di-cache per server), company dan
  store default dibaca dari `.env` (`SOLUM_*`).
- Company/store yang dikirim user selalu menang; kosong → `SOLUM_COMPANY` / `SOLUM_STORE`.
- Setiap request dan respons SOLUM dicatat di log uvicorn dengan awalan `[SOLUM]` (isi respons
  login tidak dicatat karena berisi token).

## Error SOLUM

Setiap kegagalan memanggil SOLUM menyebut API mana yang gagal, method + URL lengkapnya, dan alasannya:

```
SOLUM API "<nama>" (<METHOD> <URL>) gagal[, dibutuhkan untuk SOLUM API "<nama>"]: <alasan>
SOLUM API "<nama>" (<METHOD> <path>) tidak dipanggil[, dibutuhkan untuk ...]: <alasan>
```

| Nama | Endpoint SOLUM |
|---|---|
| `Login (ambil token)` | `POST /common/api/v2/token` (`SOLUM_TOKEN_PATH`) |
| `Kirim Data Artikel` | `POST /common/api/v2/common/articles` |
| `Nyalakan LED Label` | `PUT /common/api/v2/common/articles/led` |
| `Daftar Store` | `GET /common/api/v2/common/store` |
| `Daftar Artikel` | `GET /common/api/v2/common/articles` |

- Bagian "dibutuhkan untuk" muncul bila yang gagal adalah login yang dilakukan sebelum API itu.
- "tidak dipanggil" = server belum diatur di tab Config, atau kredensial SOLUM kosong di `.env`.
- Alasan: `HTTP <status> - <responseMessage SOLUM>` (body mentah, maks 300 karakter, bila tidak ada
  field pesan), `server tidak dapat dihubungi (...)`, atau `tidak ada respons dalam N detik`
  (`SOLUM_TIMEOUT_SECONDS`).

Contoh: `SOLUM API "Kirim Data Artikel" (POST https://<host>/common/api/v2/common/articles?company=ACS&store=SL001) gagal: HTTP 400 - Store SL001 does not exist`

## Input string

Semua body request di-trim (spasi depan/belakang dibuang) sebelum diproses.
