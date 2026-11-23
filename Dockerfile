FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 SALESPILOT_DATA_DIR=/data
WORKDIR /srv/app
COPY backend/requirements.txt /srv/app/backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt && useradd --uid 10001 --create-home salespilot && mkdir -p /data && chown salespilot:salespilot /data
COPY --chown=salespilot:salespilot . /srv/app
USER salespilot
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "backend.app:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000", "--no-access-log"]
