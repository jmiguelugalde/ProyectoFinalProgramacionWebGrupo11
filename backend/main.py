# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import logging
import mysql.connector
from mysql.connector import Error
from backend.routers import cobros

from backend.routers import auth, products, inventory, ventas, audit, payment, dashboard

# Cargar variables de entorno (.env o variables del sistema)
load_dotenv()

app = FastAPI(title="Proyecto Punto de Venta - Grupo 11", version="0.1.0")

# ---- CORS (habilitar frontend local) ----
# Puedes sobreescribir con FRONTEND_URL o CORS_EXTRA_ORIGINS en el entorno
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
EXTRA_ORIGINS = os.getenv("CORS_EXTRA_ORIGINS", "")
_origins = [o.strip() for o in (FRONTEND_URL + "," + EXTRA_ORIGINS).split(",") if o.strip()]
if not _origins:
    _origins = ["http://localhost:5173", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger = logging.getLogger("uvicorn")

# ---- Verificar conexión a la base de datos al iniciar ----
@app.on_event("startup")
def startup_db_check():
    try:
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST", "mysql"),
            port=int(os.getenv("DB_PORT", "3306")),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "pulperia"),
        )
        if conn.is_connected():
            logger.info(
                "✅ Conectado a MySQL como %s@%s:%s DB=%s",
                os.getenv("DB_USER", "root"),
                os.getenv("DB_HOST", "mysql"),
                os.getenv("DB_PORT", "3306"),
                os.getenv("DB_NAME", "pulperia"),
            )
            conn.close()
    except Error as e:
        logger.error("❌ Error de conexión a MySQL: %s", e)

# ---- Incluir routers ----
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(inventory.router)
app.include_router(ventas.router)
app.include_router(audit.router)
app.include_router(payment.router)
app.include_router(dashboard.router)

# ---- Rutas base/health ----
@app.get("/")
def read_root():
    return {"mensaje": "Bienvenido al sistema Punto de Venta"}

@app.get("/health")
def health():
    return {"ok": True}

app.include_router(cobros.router)
