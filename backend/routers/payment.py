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

@router.get("/", response_model=list[EstadoCuentaUsuario])
def listar_cuentas_pendientes(_=Depends(contador_required)):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT usuario, SUM(total) AS total_pendiente
        FROM sales
        GROUP BY usuario
        HAVING total_pendiente > 0
    """)
    cuentas = cursor.fetchall()
    conn.close()
    return cuentas

@router.post("/pagar", response_model=dict)
def aplicar_pago(data: Pago, _=Depends(contador_required)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT SUM(total) FROM sales WHERE usuario = %s", (data.usuario,))
    deuda = cursor.fetchone()[0] or 0.0

    if deuda == 0:
        conn.close()
        raise HTTPException(status_code=400, detail="El usuario no tiene deudas pendientes.")

    if data.monto < deuda:
        conn.close()
        raise HTTPException(status_code=400, detail="El monto no cubre la deuda total.")

    cursor.execute("DELETE FROM sales WHERE usuario = %s", (data.usuario,))
    conn.commit()
    conn.close()
    return {"mensaje": f"Cuenta de {data.usuario} saldada correctamente."}
