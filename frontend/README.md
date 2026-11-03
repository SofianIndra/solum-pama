# SOLUM ESL Stock (frontend)

Web Next.js untuk mengelola stok artikel (`ms_stock`) yang tampil di label ESL SOLUM AIMS.
Tampilan mengikuti solum-alfa. Semua data dan panggilan SOLUM lewat backend FastAPI
(`../backend`); web ini tidak memanggil SOLUM langsung.

## Cara menjalankan

```bash
npm install
cp .env.example .env   # lalu isi NEXT_PUBLIC_API_URL
npm run dev
```

Buka http://localhost:3000 (buka lewat `localhost`, bukan `127.0.0.1`, supaya `next dev` tidak
memblokir resource-nya). Backend harus sudah berjalan.

## Konfigurasi (`.env`)

| Variable | Isi |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL backend, mis. `http://localhost:8000` |
| `NEXT_PUBLIC_SEARCH_DEBOUNCE_MS` | Jeda (ms) sebelum dropdown Store/Article memanggil API lagi |

Company, Store, dan durasi LED default diambil dari `.env` **backend** (`GET /solum/defaults`).
Keduanya `NEXT_PUBLIC_`, jadi ditanam saat build: restart `npm run dev` setelah diubah.

## Tab

| Tab | Isi |
|---|---|
| **Used Stock** (`/used-stock`) | Container 1: pilih Company, Store, Article. Container 2: info stok yang terhubung ke article itu + isi Jumlah (kosong = 1) lalu tombol Kurangi/Tambah Own Stock. Setiap klik langsung disimpan, dikirim ke label SOLUM, dan LED menyala sesuai status |
| **Edit Data** (`/edit-data`) | Tabel stok (cari + halaman), pilih Edit, ubah field termasuk **Item Code** dan **Article** (dipilih dari SOLUM di container Artikel & Tujuan SOLUM), simpan. Item code / article yang sudah dipakai data lain ditolak backend dan ditampilkan sebagai dialog. Tombol **Hapus Data Stok** meminta konfirmasi dulu, lalu menghapus baris dari database (label SOLUM tidak diubah) |
| **Create Data** (`/create-data`) | Container 1: pilih Company, Store, Article SOLUM yang dihubungkan (`article_id`; article yang sudah terhubung ke item lain ditolak). Container 2: Item Code (diketik sendiri, langsung dicek) + data stok. Disimpan ke database, belum dikirim ke SOLUM |
| **Config** (`/config`) | Pilih server SOLUM yang dipanggil backend: On Premise (IP + port) atau SaaS (API URL). Default dari `.env` backend; setelah disimpan langsung berlaku |

Bila panggilan SOLUM gagal (Used Stock / Edit Data, dropdown Store / Article), pesan error menyebut API
SOLUM yang gagal, URL-nya, dan alasannya: muncul sebagai toast dan tetap tampil di bawah form.

Status stok & warna LED: `AMAN` → GREEN, `OVER MAX` → RED, `UNDER MIN` → YELLOW, `KOSONG` → WHITE.

## Build image (podman)

```bash
podman build -f df -t solum-panama-frontend --build-arg NEXT_PUBLIC_API_URL=https://<backend-host> .
```

## Struktur

```
src/
├── app/(pages)/{used-stock,edit-data,create-data,config}/page.jsx   Page (hanya wrapper)
├── layouts/                         Logic layar per tab: state, validasi, submit
├── components/core/                 UI umum (disalin dari solum-alfa)
├── components/features/solum/       StoreSelect, ArticleSelect, Company+Store, gate default SOLUM
├── components/features/stock/       Field stok, panel ringkasan, badge status, hasil panggilan SOLUM
├── components/features/usedStock/   Container Pilih Artikel & Informasi Stok
├── components/features/editData/    Tabel stok
├── components/features/config/      Pilihan tipe server + panel Server Aktif
├── services/PanamaApi/              axios ke backend: solumService, stockService, configService
├── constants/stock.js               Status stok + warna LED
├── utils/stockForm.js               Form stok: validasi, payload, pratinjau status
└── utils/configForm.js              Form config: validasi, payload, pratinjau URL
```
