# API Planning — ms_stock

Data stok per item code. Router `src/routers/ms_stock.py`, service
`src/domain/master/ms_stock/service.py`. `item_code` diketik user di tab Create; `article_id` adalah
article SOLUM yang dipilih di tab Create dan menjadi `articleId` saat data artikel dan LED dikirim ke
SOLUM. Satu article hanya boleh terhubung ke satu baris. Path `{item_code}` memakai `:path`, jadi
item code boleh berisi `/` (FE mengirimnya ter-encode).

## Aturan stock_status

Dihitung dari `own_stock` terhadap `min_stock` dan `max_stock`, dicek berurutan:

| Kondisi | stock_status | Warna LED |
|---|---|---|
| `own_stock == 0` | `KOSONG` | `WHITE` |
| `own_stock < min_stock` | `UNDER MIN` | `YELLOW` |
| `own_stock > max_stock` | `OVER MAX` | `RED` |
| selain itu (`min ≤ own ≤ max`) | `AMAN` | `GREEN` |

Client tidak pernah mengirim `stock_status`.

## Validasi (create & update)

- `item_name` wajib; `own_stock`, `min_stock`, `max_stock` wajib.
- Semua angka stok ≥ 0 → `400 stock values cannot be negative`.
- `min_stock > max_stock` → `400 min stock cannot be greater than max stock`.

## GET /ms-stock/filter

Query: `search` (cocok ke `item_code`, `article_id`, **atau** `item_name`, ilike), `item_code`,
`article_id` (sama persis; dipakai tab Used Stock untuk mencari baris dari article yang dipilih), `item_name`,
`mnemonic`, `storage_bin` (ilike), `stock_status` (sama persis), `active` (default `ACTIVE`,
`ALL` untuk semua), `page`. Urut `item_code` naik.

Respons: `{ data: [MsStockResponse], page, total_items, total_page }`.

## GET /ms-stock/{item_code}

Satu baris, atau `404 ms stock does not exist`.

## POST /ms-stock/create

```json
{ "item_code": "B100001", "article_id": "A100001", "item_name": "OAP DISPENSER", "mnemonic": "OAP", "own_stock": 5,
  "min_stock": 3, "max_stock": 10, "storage_bin": "A-01", "stock_on_hand": 5, "stock_on_hand_rfid": 4 }
```

`item_code` kosong → `400 item code is required`; sudah ada (sama persis) → `400 ms stock item code already exist`.
`article_id` tidak dikirim → `422`; kosong → `400 article id is required`; sudah terhubung ke baris lain →
`400 article <id> is already linked to item code <item_code>`. Sukses → `201`
`{ "message": "create ms stock success" }`. Create **tidak** mengirim apa pun ke SOLUM.

## PUT /ms-stock/update/{item_code}

Semua field opsional; field yang tidak dikirim tidak berubah. `{item_code}` di path memilih baris;
`item_code` dan `article_id` di body mengganti nilainya (tab Edit Data). Keduanya tetap harus unik:

| Kondisi | Status | `detail` |
|---|---|---|
| `item_code` baru kosong | `400` | `item code is required` |
| `item_code` baru sudah dipakai baris lain | `400` | `ms stock item code already exist` |
| `article_id` baru kosong | `400` | `article id is required` |
| `article_id` baru sudah terhubung ke baris lain | `400` | `article <id> is already linked to item code <x>` |

Nilai yang sama dengan milik baris itu sendiri bukan duplikat. Saat `article_id` diganti, data
artikel selalu dikirim ke article baru (semua key, lihat tabel di bawah) dan LED article baru
dinyalakan; label article lama tidak diubah. `company`/`store` memilih store
SOLUM; kosong → `SOLUM_COMPANY` / `SOLUM_STORE` (keduanya wajib ada, kalau tidak `400`).

```json
{ "own_stock": 2, "company": "ABC", "store": "ST00943" }
{ "item_code": "B100002", "article_id": "A100002", "item_name": "...", "company": "ABC", "store": "ST00943" }
```

Urutan proses:

1. Cari baris (`404` bila tidak ada), tentukan company/store, cek `SOLUM_LED_DURATION` valid.
   Baris tanpa `article_id` hanya disimpan: `solum_article` dan `solum_led` berisi `is_sent: false`,
   `message: "item has no article id, solum label not updated"`.
2. Gabungkan nilai lama + body, validasi, hitung ulang `stock_status`.
3. Bila `article_id` berubah, atau salah satu kolom berikut berubah, kirim data artikel ke SOLUM
   `POST /common/api/v2/common/articles?company=&store=` (endpoint yang sama dengan tab Data
   Artikel di solum-alfa):

   | Kolom | Key SOLUM |
   |---|---|
   | `item_name` | `Mat_Desc` |
   | `mnemonic` | `Mnemonic` |
   | `own_stock` | `Own_Stock` |
   | `storage_bin` | `Storage_Bin` |
   | `min_stock` | `MinStock` |
   | `max_stock` | `MaxStock` |
   | `stock_on_hand` | `StockOnHand` |
   | `stock_on_hand_rfid` | `StockOnHandRFID` |

   Yang dikirim selalu **kedelapan key** (nilai string, kolom kosong → `""`) plus
   `articleName = item_name`, supaya label tetap lengkap walau AIMS mengganti seluruh data
   artikel (`articleId = article_id`). SOLUM menolak / tidak bisa dihubungi → rollback, `502`, tidak ada yang tersimpan;
   `detail` menyebut API SOLUM yang gagal (lihat `konsep-backend.md` → Error SOLUM).
4. Commit.
5. Selalu kirim LED `PUT /common/api/v2/common/articles/led?company=&store=`:

   ```json
   { "ledBlinkList": [{ "articleId": "A100001", "color": "YELLOW", "duration": "60s",
                        "patternId": 0, "multiLed": false }] }
   ```

   `color` dari tabel stock_status, `duration`/`patternId`/`multiLed` dari `SOLUM_LED_DURATION`,
   `SOLUM_LED_PATTERN_ID`, `SOLUM_LED_MULTI_LED`. Gagal → data tetap tersimpan, kegagalan
   dilaporkan di `solum_led` (`is_success: false`, `message` dengan format Error SOLUM).

Respons `200`:

```json
{
  "message": "ms stock update success",
  "company": "ABC",
  "store": "ST00943",
  "data": { "...": "MsStockResponse" },
  "solum_article": { "is_sent": true, "is_success": true, "message": "article data sent to solum",
                     "method": "POST", "url": "...", "status_code": 200, "payload": [], "response": {} },
  "solum_led": { "is_sent": true, "is_success": true, "message": "led blink sent to solum",
                 "method": "PUT", "url": "...", "status_code": 200, "payload": {}, "response": {} }
}
```

`solum_article.is_sent = false` berarti tidak ada kolom SOLUM yang berubah.

## DELETE /ms-stock/delete/{item_code}

Menghapus baris secara permanen (tombol Hapus di tab Edit Data). Label di SOLUM **tidak** diubah.
Untuk sekadar menyembunyikan baris, pakai update `active = INACTIVE`.

Tidak ada → `404 ms stock does not exist`. Sukses → `200 { "message": "ms stock delete success" }`.
