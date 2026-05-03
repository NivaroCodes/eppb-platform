FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend source
COPY backend/ .

# Copy the root engine package (required by backend)
COPY engine/ /app/engine/

# Copy seed data so the DB is populated on startup
COPY seed_data/ /seed_data/

EXPOSE 8000
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]