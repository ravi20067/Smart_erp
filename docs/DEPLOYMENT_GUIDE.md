# Production Deployment & Operations Guide
## Infrastructure, Configuration & Runbook

---

## 1. Prerequisites & Runtime Environments

| Component | Minimum Version | Recommended Specs |
|---|---|---|
| **Operating System** | Ubuntu 22.04 LTS / Debian 12 / macOS | 4 vCPU, 8 GB RAM |
| **Java Development Kit** | OpenJDK 21 LTS | - |
| **Python** | Python 3.11.x | Dedicated Virtualenv |
| **Node.js** | Node 20.x LTS / npm 10+ | - |
| **MySQL Database** | MySQL 8.0.x | UTF8MB4 Collation |
| **Redis** | Redis 7.2.x | In-Memory with RDB snapshots |

---

## 2. Configuration & Environment Variables

### A. Spring Boot Backend (`backend/Smart_Erp/src/main/resources/application.properties`)
```properties
# Server
server.port=7777

# MySQL Database
spring.datasource.url=jdbc:mysql://localhost:3306/smart_erp?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=your_secure_password
spring.jpa.hibernate.ddl-auto=update

# Redis Configuration
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.data.redis.timeout=60s

# Python Face AI Microservice URL
face.ai.service.url=http://localhost:8000

# Biometric AES-256 Encryption Key (Base64-encoded 32-byte secret)
biometric.encryption.secret-key=c2VjdXJlX2F0dGVuZGFuY2Vfc2VjcmV0X2tleV8yMDI2IQ==

# Attendance QR HMAC Secret Key
attendance.qr.hmac-secret=a_very_long_cryptographically_secure_hmac_secret_2026
```

### B. Python Face AI Microservice (`smart-erp-face-ai/.env`)
```bash
HOST=0.0.0.0
PORT=8000
DEBUG=False
COSINE_SIMILARITY_THRESHOLD=0.363
MIN_LIVENESS_CONFIDENCE=0.70
```

---

## 3. Production Process Supervisor (Systemd Services)

### 1. Python Face AI Service (`/etc/systemd/system/smart-face-ai.service`)
```ini
[Unit]
Description=Smart College ERP - Python Face AI Microservice
After=network.target

[Service]
Type=simple
User=smart_app
WorkingDirectory=/opt/smart_erp/smart-erp-face-ai
ExecStart=/opt/smart_erp/smart-erp-face-ai/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### 2. Spring Boot Backend Service (`/etc/systemd/system/smart-backend.service`)
```ini
[Unit]
Description=Smart College ERP - Spring Boot Backend
After=network.target mysql.service redis.service smart-face-ai.service

[Service]
Type=simple
User=smart_app
WorkingDirectory=/opt/smart_erp/backend/Smart_Erp
ExecStart=/usr/bin/java -Xms1024m -Xmx2048m -jar target/Smart_Erp-0.0.1-SNAPSHOT.jar
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

## 4. Reverse Proxy & WebSocket Configuration (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name erp.college.edu;

    ssl_certificate /etc/letsencrypt/live/erp.college.edu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/erp.college.edu/privkey.pem;

    # React Frontend Static Assets
    location / {
        root /opt/smart_erp/frontend/Smart_Erp/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Spring Boot REST Endpoints
    location ~ ^/(teacher|student|security-guard|admin|super-admin|auth|api)/ {
        proxy_pass http://127.0.0.1:7777;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # STOMP WebSockets
    location /ws {
        proxy_pass http://127.0.0.1:7777/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600s;
    }
}
```

> **Camera HTTPS Requirement**: Modern mobile web browsers (Safari iOS and Chrome Android) strictly require **HTTPS** (or `localhost`) to access camera devices via `navigator.mediaDevices.getUserMedia()`. Production deployments must enforce HTTPS.
