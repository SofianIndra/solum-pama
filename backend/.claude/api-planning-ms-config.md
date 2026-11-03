# API Planning — ms_config (server SOLUM)

Router `src/routers/ms_config.py`, service `src/domain/master/ms_config/service.py`, tabel
`ms_config`. Dipakai tab **Config** di frontend untuk memilih server AIMS yang dipanggil backend.

## Aturan

- Satu baris dengan `code = 'SOLUM_SERVER'`. Selama baris itu belum ada, nilainya diambil dari
  `.env`: `SOLUM_SERVER_TYPE` (default `SAAS`), `SOLUM_ON_PREMISE_IP`, `SOLUM_ON_PREMISE_PORT`, dan
  `SOLUM_API_URL` sebagai API URL SaaS. Setelah disimpan pertama kali, nilai di tabel yang dipakai
  dan `.env` hanya menjadi "default".
- URL dasar SOLUM:
  - `ON_PREMISE` → `<SOLUM_ON_PREMISE_SCHEME>://<on_premise_ip>:<on_premise_port>` (scheme default
    `http`; IPv6 diberi kurung siku).
  - `SAAS` → `saas_api_url` apa adanya (garis miring di akhir dibuang).
- `src/services/solum_client.py` membaca URL ini sebelum **setiap** panggilan SOLUM, jadi
  perubahan langsung berlaku tanpa restart. Token login di-cache per URL: pindah server berarti
  login ulang ke server baru dengan `SOLUM_USERNAME` / `SOLUM_PASSWORD` yang sama
  (`SOLUM_API_TOKEN`, kalau diisi, dipakai untuk server mana pun).
- Isian tipe yang tidak dipilih tetap disimpan, supaya tidak perlu diketik ulang saat pindah tipe.

## GET /ms-config/solum-server

```json
{
  "server_type": "SAAS",
  "on_premise_ip": "192.168.1.100",
  "on_premise_port": 9001,
  "saas_api_url": "https://asia.common.solumesl.com",
  "api_url": "https://asia.common.solumesl.com",
  "on_premise_scheme": "http",
  "is_saved": false,
  "updated_at": null,
  "updated_by": null,
  "defaults": {
    "server_type": "SAAS",
    "on_premise_ip": "192.168.1.100",
    "on_premise_port": 9001,
    "saas_api_url": "https://asia.common.solumesl.com"
  }
}
```

- `api_url` = URL yang dipanggil backend saat ini; kosong bila isian tipe terpilih belum lengkap.
- `is_saved: false` → belum pernah disimpan dari tab Config, nilainya dari `.env`.
- `defaults` = nilai `.env`, untuk tombol "Isi dengan Default .env".

## PUT /ms-config/update/solum-server

Body:

```json
{ "server_type": "ON_PREMISE", "on_premise_ip": "192.168.1.100", "on_premise_port": 9001,
  "saas_api_url": "https://asia.common.solumesl.com" }
```

Membuat baris pada simpan pertama, lalu mengubahnya. Respons `{ "message": "ms config update success" }`.

| Kondisi | Status | `detail` |
|---|---|---|
| `server_type` bukan `ON_PREMISE`/`SAAS` | `400` | `server type must be ON_PREMISE or SAAS` |
| `ON_PREMISE` tanpa IP | `400` | `on premise ip is required` |
| `ON_PREMISE` tanpa port | `400` | `on premise port is required` |
| `SAAS` tanpa API URL | `400` | `saas api url is required` |
| IP bukan IP address / host name (mis. `999.1.1.1`, `http://...`) | `400` | `on premise ip is not a valid ip address or host name` |
| Port di luar 1–65535 | `400` | `on premise port must be between 1 and 65535` |
| API URL tidak diawali `http://` / `https://` | `400` | `saas api url must start with http:// or https://` |

Format IP, port, dan URL dicek setiap kali diisi, juga untuk tipe yang tidak dipilih.

## Error saat memanggil SOLUM

Bila isian tipe terpilih kosong, setiap panggilan SOLUM gagal `502` dengan pesan "Server SOLUM
belum diatur ...". Server yang tidak bisa dihubungi → `502` "SOLUM tidak dapat dihubungi (...)".
