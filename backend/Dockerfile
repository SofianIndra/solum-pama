FROM python:3.11.1-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade -r requirements.txt

COPY . .

# The container sits behind host nginx (TLS) on a podman network, so proxy headers must be
# trusted from any source IP, otherwise redirects come back as http://
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
