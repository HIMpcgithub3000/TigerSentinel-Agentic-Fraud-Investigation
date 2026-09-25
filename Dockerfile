# ==============================================================================
# CaseGuard / GraphSentinel: TigerGraph Agentic Fraud Investigation Platform
# Multi-Stage Zero-Friction Production Dockerfile
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build React 19 Frontend
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /web

# Install frontend dependencies
COPY web/package*.json ./
RUN npm ci --silent || npm install --silent

# Build optimized production bundle
COPY web/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Python Backend & Unified Web Console
# ------------------------------------------------------------------------------
FROM python:3.11-slim
WORKDIR /app

# Install minimal OS dependencies for healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first for optimal build cache
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend codebase, benchmark outputs, schemas, and test suites
COPY src/ ./src/
COPY data/ ./data/
COPY output/ ./output/
COPY tigergraph/ ./tigergraph/
COPY scripts/ ./scripts/
COPY tests/ ./tests/
COPY .env ./
COPY pyproject.toml ./

# Copy compiled frontend from Stage 1 into the location expected by FastAPI
COPY --from=frontend-builder /web/dist ./web/dist

# Set runtime environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH="/app/src:/app" \
    APP_HOST="0.0.0.0" \
    APP_PORT=8787 \
    USE_LOCAL_GRAPH_ENGINE="true"

# Expose unified platform port (serves both React UI and REST API)
EXPOSE 8787

# Built-in container health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8787/api/health || exit 1

# Launch the unified CaseGuard Platform
CMD ["python3", "-m", "uvicorn", "src.fraud_agent.api.main:app", "--host", "0.0.0.0", "--port", "8787"]
