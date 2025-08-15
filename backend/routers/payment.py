from typing import Any, Dict, Optional, cast
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from backend.models.payment import EstadoCuentaUsuario, Pago
from backend.security import contador_required
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()
router = APIRouter(prefix="/cobros", tags=["cobros"])

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

# -------- Helpers de casting seguros --------
def to_float(x: Any, default: float = 0.0) -> float:
    try:
        if x is None:
            return default
        if isinstance(x, (float, int)):
            return float(x)
        if isinstance(x, Decimal):
            return float(x)
        if isinstance(x, (bytes, bytearray)):
            try:
                return float(x.decode().strip())
            except Exception:
                return default
        s = str(x).strip()
        if not s:
            return default
        return float(s)
    except Exception:
        return default
# --------------------------------------------

@router.get("/", response_model=list[EstadoCuentaUsuario])
def listar_cuentas_pendientes(_=Depends(contador_required)):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT usuario, COALESCE(SUM(total), 0) AS total_pendiente
            FROM sales
            GROUP BY usuario
            HAVING total_pendiente > 0
        """)
        cuentas = cast(list[Dict[str, Any]], cursor.fetchall() or [])
        # Normalizar a float para evitar unions molestos (Decimal/None)
        for c in cuentas:
            c["total_pendiente"] = to_float(c.get("total_pendiente"))
        return cuentas
    finally:
        try:
            cursor.close()
        finally:
            conn.close()

@router.post("/pagar", response_model=dict)
def aplicar_pago(data: Pago, _=Depends(contador_required)):
    conn = get_db_connection()
    # Usamos dictionary=True para acceder por clave en lugar de [0]
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT COALESCE(SUM(total), 0) AS deuda FROM sales WHERE usuario = %s",
            (data.usuario,)
        )
        row = cast(Optional[Dict[str, Any]], cursor.fetchone())
        deuda = to_float(row["deuda"]) if row and "deuda" in row else 0.0

        if deuda <= 0.0:
            raise HTTPException(status_code=400, detail="El usuario no tiene deudas pendientes.")

        monto = to_float(data.monto)

        # Comparación entre floats (evita problemas de tipos con Pylance)
        if monto < deuda:
            raise HTTPException(status_code=400, detail="El monto no cubre la deuda total.")

        cursor.execute("DELETE FROM sales WHERE usuario = %s", (data.usuario,))
        conn.commit()
        return {"mensaje": f"Cuenta de {data.usuario} saldada correctamente."}
    finally:
        try:
            cursor.close()
        finally:
            conn.close()
