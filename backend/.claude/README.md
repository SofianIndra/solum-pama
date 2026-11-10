# Dokumentasi Solum Pama

Dokumen di folder ini adalah **ketetapan kondisi saat ini** — bukan catatan perubahan. Kalau
perilaku backend berubah, file di sini ikut diperbarui di task yang sama, bukan ditambahi
"sebelumnya begini, sekarang begitu".

| File | Isi |
|---|---|
| `konsep-backend.md` | Aturan yang berlaku lintas-endpoint: autentikasi, bentuk error, status ACTIVE/INACTIVE, pagination, audit kolom. **Baca ini dulu** |
| `kontrak-frontend-backend.md` | Yang perlu diketahui FE: daftar endpoint yang hidup, penanganan error |
| `skema-tabel-backend.md` | Struktur tabel di database `solum-pama` |
| `api-planning-ms-stock.md` | Data stok per artikel: create, filter, detail, update + sinkronisasi SOLUM dan LED |
| `api-planning-solum.md` | Default SOLUM dari `.env`, dropdown Store dan Article dari SOLUM AIMS |
| `api-planning-ms-config.md` | Tab Config: pilih server SOLUM On Premise (IP + port) atau SaaS (API URL) |

Catatan cepat:

- Route yang tidak ada di `kontrak-frontend-backend.md` **tidak hidup**.
- Tidak memakai alembic: tabel baru dibuat oleh `Base.metadata.create_all` saat start, perubahan
  kolom pada tabel yang sudah ada ditulis manual di `resources/ddl/`.
- Semua panggilan ke SOLUM AIMS ada di `src/services/solum_client.py`; URL servernya dari
  `ms_config` (tab Config), atau `.env` selama belum disimpan.
