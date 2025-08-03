from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import mysql.connector
from mysql.connector import Error

from backend.routers import auth, products, inventory, sales, audit, payment, dashboard

# Cargar variables de entorno desde .env
load_dotenv()

app = FastAPI(title="Proyecto Punto de Venta - Grupo 11")

# Permitir CORS para desarrollo local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Verificar conexión a la base de datos al iniciar
@app.on_event("startup")
def startup_db_check():
    try:
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME")
        )
        if conn.is_connected():
            print("✅ Conectado a la base de datos MySQL exitosamente")
            conn.close()
    except Error as e:
        print(f"❌ Error de conexión a MySQL: {e}")

# Incluir routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(inventory.router)
app.include_router(sales.router)
app.include_router(audit.router)
app.include_router(payment.router)
app.include_router(dashboard.router)

@app.get("/")
def read_root():
    return {"mensaje": "Bienvenido al sistema Punto de Venta"}
