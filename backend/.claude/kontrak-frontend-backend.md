# Kontrak Frontend Solum Panama

## 1. Endpoint yang hidup

| Method | Path | Keterangan |
|---|---|---|
| GET | `/` | Versi API |
| GET | `/api-version/` | Versi API |
| GET | `/solum/defaults` | Company, store, dan durasi LED default dari `.env` |
| GET | `/solum/stores?company=&store_name=` | Daftar store SOLUM (dropdown Store) |
| GET | `/solum/articles?company=&store=&name=` | Daftar article SOLUM (dropdown Article) |
| GET | `/ms-config/solum-server` | Server SOLUM yang dipakai sekarang + default `.env` (tab Config) |
| PUT | `/ms-config/update/solum-server` | Simpan server SOLUM (On Premise IP + port / SaaS API URL) |
| GET | `/ms-stock/filter?search=&item_code=&item_name=&mnemonic=&storage_bin=&stock_status=&active=&page=` | Daftar stok berhalaman |
| GET | `/ms-stock/{item_code}` | Satu baris stok |
| POST | `/ms-stock/create` | Buat data stok (`201`) |
| PUT | `/ms-stock/update/{item_code}` | Ubah data stok (termasuk item code & article ID) + kirim ke SOLUM + nyalakan LED |
| DELETE | `/ms-stock/delete/{item_code}` | Hapus data stok permanen (label SOLUM tidak diubah) |

Detail request/response: `api-planning-ms-stock.md`, `api-planning-solum.md`, dan
`api-planning-ms-config.md`.

Semua endpoint publik: tidak perlu header `Authorization`.

## 2. Penanganan error

Baca `detail` dari body error. Bila `detail` berupa string, tampilkan apa adanya; bila berupa
list (`422` validasi skema), gabungkan `loc` terakhir + `msg` tiap item.

- `404` dari `GET /ms-stock/{item_code}` adalah kondisi normal (article belum punya data stok).
- `502` = panggilan SOLUM gagal; `detail` menyebut API SOLUM yang gagal + URL + alasan (format di
  `konsep-backend.md` → Error SOLUM). Dari update berarti **tidak ada yang tersimpan**.
- `400 article <id> is already linked to item code <x>` dari create = article sudah dipakai baris lain.
  Cek lebih dulu dengan `GET /ms-stock/filter?article_id=<id>&active=ALL`.
- `400 ms stock item code already exist` dari create / update = item code sudah dipakai. Tab Edit Data
  menampilkan duplikat item code / article sebagai dialog pesan (FE mengecek ulang dengan
  `GET /ms-stock/{item_code}` dan `GET /ms-stock/filter?article_id=` untuk tahu mana yang duplikat). FE juga bisa
  mengecek lebih dulu dengan `GET /ms-stock/{item_code}` (`404` = belum dipakai).
- Kegagalan LED **tidak** menjadi error HTTP; cek `solum_led.is_success` di respons update.
  `solum_led.is_sent: false` = baris belum punya `article_id`, SOLUM tidak dipanggil.
