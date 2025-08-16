FROM python:3.10-slim

WORKDIR /app

# Dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el paquete manteniendo la carpeta 'backend'
COPY ./backend /app/backend

# (opcional) si quieres tener el sql en la imagen:
# COPY ./sql /app/sql

ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
