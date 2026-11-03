# Skema Tabel Solum Panama

Database: `solum-panama` (PostgreSQL).

## ms_config

Pengaturan dari tab Config, satu baris per `code`. Saat ini hanya `SOLUM_SERVER`.

| Kolom | Tipe | Arti |
|---|---|---|
| `id` | Integer PK | Auto increment |
| `code` | String (index) | `SOLUM_SERVER` |
| `server_type` | String | `ON_PREMISE` / `SAAS` |
| `on_premise_ip` | String | IP address / host name server AIMS On Premise |
| `on_premise_port` | Integer | Port server AIMS On Premise |
| `saas_api_url` | String | API URL AIMS SaaS, tanpa garis miring di akhir |
| `active` | String | `ACTIVE` |
| `updated_at` | String | ISO 8601 |
| `updated_by` | String | `GUEST_USER_CODE` dari `.env` |

## ms_stock

Satu baris per item code. `item_code` diketik user saat create; `article_id` menghubungkan baris ke
article SOLUM AIMS (label yang data stok dan LED-nya diperbarui). Kolom `article_id` ditambahkan
lewat `resources/ddl/migration_add_ms_stock_article_id.sql`.

| Kolom | Tipe | Arti |
|---|---|---|
| `id` | Integer PK | Auto increment |
| `item_code` | String (index) | Kode barang dari user, unik per baris (dicek di service) |
| `article_id` | String (index) | `articleId` SOLUM yang dihubungkan, unik per baris (dicek di service). Kosong → update tidak mengirim apa pun ke SOLUM |
| `item_name` | String | Nama barang → SOLUM `Material_Description` |
| `mnemonic` | String | → SOLUM `Mnemonic` |
| `own_stock` | Integer | Stok sendiri → SOLUM `Own_Stock` |
| `min_stock` | Integer | Batas bawah → SOLUM `Min_Inventory` |
| `max_stock` | Integer | Batas atas → SOLUM `Max_Inventory` |
| `storage_bin` | String | Lokasi simpan → SOLUM `Storage_Bin` |
| `stock_on_hand` | Integer | → SOLUM `StockOnHand` |
| `stock_on_hand_rfid` | Integer | → SOLUM `StockRFID` |
| `stock_status` | String | `KOSONG` / `UNDER MIN` / `AMAN` / `OVER MAX`, selalu dihitung backend |
| `active` | String | `ACTIVE` / `INACTIVE` |
| `updated_at` | String | ISO 8601 |
| `updated_by` | String | `GUEST_USER_CODE` dari `.env` |
