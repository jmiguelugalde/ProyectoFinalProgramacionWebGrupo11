from typing import Any, Dict, List, cast
from decimal import Decimal

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

# --- Helpers para normalizar tipos numéricos ---
def to_int(x: Any, default: int = 0) -> int:
    try:
        if x is None:
            return default
        if isinstance(x, int):
            return x
        if isinstance(x, (float, Decimal)):
            return int(x)
        s = str(x).strip()
        if not s:
            return default
        return int(float(s))
    except Exception:
        return default

def to_float(x: Any, default: float = 0.0) -> float:
    try:
        if x is None:
            return default
        if isinstance(x, (float, int)):
            return float(x)
        if isinstance(x, Decimal):
            return float(x)
        s = str(x).strip()
        if not s:
            return default
        return float(s)
    except Exception:
        return default
# ------------------------------------------------

@router.get("/mas-vendidos", response_model=list[ProductoMasVendido])
def productos_mas_vendidos(_=Depends(contador_required)):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT p.id AS producto_id, p.descripcion, 
                   COALESCE(SUM(s.cantidad), 0) AS unidades_vendidas, 
                   COALESCE(SUM(s.total), 0) AS total_recaudado
            FROM ventas s
            JOIN products p ON s.producto_id = p.id
            GROUP BY p.id, p.descripcion
            ORDER BY unidades_vendidas DESC
            LIMIT 10
        """)
        rows = cast(List[Dict[str, Any]], cursor.fetchall() or [])
        # Normalizar tipos para cumplir el response_model
        resultados: List[Dict[str, Any]] = []
        for r in rows:
            resultados.append({
                "producto_id": to_int(r.get("producto_id")),
                "descripcion": str(r.get("descripcion") or ""),
                "unidades_vendidas": to_int(r.get("unidades_vendidas")),
                "total_recaudado": to_float(r.get("total_recaudado")),
            })
        return resultados
    finally:
        try:
            cursor.close()
        finally:
            conn.close()

@router.get("/pronostico", response_model=list[PronosticoDemanda])
def pronostico_ventas(_=Depends(contador_required)):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT p.id AS producto_id, p.descripcion,
                   ROUND(AVG(s.cantidad), 0) AS unidades_estimadas
            FROM ventas s
            JOIN products p ON s.producto_id = p.id
            GROUP BY p.id, p.descripcion
        """)
        rows = cast(List[Dict[str, Any]], cursor.fetchall() or [])
        # Construir salida tipada y agregar "periodo"
        datos: List[Dict[str, Any]] = []
        for r in rows:
            datos.append({
                "producto_id": to_int(r.get("producto_id")),
                "descripcion": str(r.get("descripcion") or ""),
                "unidades_estimadas": to_int(r.get("unidades_estimadas")),
                "periodo": "próximo mes",
            })
        return datos
    finally:
        try:
            cursor.close()
        finally:
            conn.close()
