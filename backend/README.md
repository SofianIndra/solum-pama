# Solum Panama

Backend FastAPI untuk Solum Panama: data stok per artikel (`ms_stock`) yang disinkronkan ke
label ESL SOLUM AIMS, termasuk menyalakan LED label sesuai status stok. Semua panggilan SOLUM
dilakukan di sini (frontend tidak memanggil SOLUM langsung).

## Menjalankan di lokal

```bash
python3 -m venv venv
source ./venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # lalu isi nilainya
uvicorn main:app --port 8000 --reload
```

Swagger: http://127.0.0.1:8000/docs

Aplikasi butuh PostgreSQL yang bisa dijangkau saat start (`Base.metadata.create_all`). Untuk On Premise
tanpa PostgreSQL, isi `DATABASE_URL=sqlite:///./data/solum-panama.db` (file SQLite, dibuat otomatis,
jalankan uvicorn dari folder `backend`).

Supaya web bisa dibuka dari jaringan yang sama dengan SOLUM gateway, jalankan dengan
`uvicorn main:app --host 0.0.0.0 --port 8000 --reload`.

Isi minimal `.env`: `DATABASE_URL`, `SOLUM_API_URL`, `SOLUM_COMPANY`, `SOLUM_STORE`, dan
`SOLUM_API_TOKEN` atau `SOLUM_USERNAME` + `SOLUM_PASSWORD`. Durasi LED: `SOLUM_LED_DURATION`
(default `60s`).

Server SOLUM (On Premise IP + port atau SaaS API URL) dipilih di tab Config frontend dan disimpan di
tabel `ms_config`. Selama belum disimpan, default-nya dari `SOLUM_SERVER_TYPE`, `SOLUM_ON_PREMISE_IP`,
`SOLUM_ON_PREMISE_PORT`, `SOLUM_ON_PREMISE_SCHEME`, dan `SOLUM_API_URL` (SaaS).

## Docker

```bash
docker build -t backend .
docker run --env-file .env -p 8000:8000 backend
```

Nilai di env file untuk Docker Compose ditulis tanpa tanda kutip.

Dokumentasi fitur ada di [.claude/README.md](.claude/README.md).
