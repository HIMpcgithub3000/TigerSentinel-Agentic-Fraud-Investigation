# 🐳 Docker Quickstart & Evaluator Guide

This project includes a complete, zero-friction Docker setup so evaluators can run and test **CaseGuard / GraphSentinel** in 1 command without configuring Python environments, Node.js, or local dependencies.

---

## ⚡ Option 1: One-Command Startup (Docker Compose - Recommended)

```bash
docker compose up --build
```

That's it! 
- The container builds the backend, mounts the pre-built React Operations Console, and initializes the platform.
- **Analyst Operations Console (UI):** Open [http://localhost:8787](http://localhost:8787)
- **API Swagger Documentation:** Open [http://localhost:8787/docs](http://localhost:8787/docs)
- **API Health Endpoint:** [http://localhost:8787/api/health](http://localhost:8787/api/health)

To stop the container:
```bash
docker compose down
```

---

## 🛠️ Option 2: Standard Docker CLI Commands

### 1. Build the Docker Image
```bash
docker build -t caseguard-fraud-agent .
```

### 2. Run the Container
```bash
docker run -d -p 8787:8787 --name caseguard caseguard-fraud-agent
```
Open [http://localhost:8787](http://localhost:8787) in your browser.

To stop and remove:
```bash
docker stop caseguard && docker rm caseguard
```

---

## 🧪 Option 3: Run Validation & Tests Inside Docker

Evaluators can run the full automated verification test suite inside the container:

### Validate All 20 Benchmark Cases (Contract Conformance)
```bash
docker run --rm caseguard-fraud-agent python3 scripts/validate_submission.py
```
*Expected output: `★ SUCCESS: All 20 benchmark case files strictly conform to the challenge contract!`*

### Run Pytest Test Suite
```bash
docker run --rm caseguard-fraud-agent pytest tests/test_submission.py
```
*Expected output: `22 passed in 0.02s`*

### Run Architecture & Policy Security Tests
```bash
docker run --rm caseguard-fraud-agent pytest tests/test_hardened_architecture.py
```
*Expected output: `24 passed in 0.05s`*

### Run Savanna Cloud Connectivity Check (Live Cluster)
```bash
docker run --rm caseguard-fraud-agent python3 scripts/deploy_savanna.py --check
```
*Expected output: `Connected successfully to TigerGraph version: 4.2.5`*

---

## ⚙️ Configuration Notes
- Default execution mode is deterministic (`USE_LOCAL_GRAPH_ENGINE=true`), ensuring tests run instantaneously without network latency.
- Live TigerGraph Savanna Cloud credentials are automatically injected from `.env` (`TG_HOST=https://tg-353ba193-b5b7-44fe-9828-47b6f5f2c8f7.tg-3452941248.i.tgcloud.io`).
