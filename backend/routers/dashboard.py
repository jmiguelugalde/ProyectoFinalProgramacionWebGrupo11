from fastapi import APIRouter, Depends
from backend.models.dashboard import ProductoMasVendido, PronosticoDemanda
from backend.security import contador_required
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()
router = APIRouter(prefix="/dashboard", tags=["dashboard"])

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

@router.get("/mas-vendidos", response_model=list[ProductoMasVendido])
def productos_mas_vendidos(_=Depends(contador_required)):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.id AS producto_id, p.descripcion, 
               SUM(s.cantidad) AS unidades_vendidas, 
               SUM(s.total) AS total_recaudado
        FROM sales s
        JOIN products p ON s.producto_id = p.id
        GROUP BY p.id, p.descripcion
        ORDER BY unidades_vendidas DESC
        LIMIT 10
    """)
    resultados = cursor.fetchall()
    conn.close()
    return resultados

@router.get("/pronostico", response_model=list[PronosticoDemanda])
def pronostico_ventas(_=Depends(contador_required)):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.id AS producto_id, p.descripcion,
               ROUND(AVG(s.cantidad), 0) AS unidades_estimadas
        FROM sales s
        JOIN products p ON s.producto_id = p.id
        GROUP BY p.id, p.descripcion
    """)
    datos = cursor.fetchall()
    conn.close()
    for item in datos:
        item["periodo"] = "próximo mes"
    return datos
