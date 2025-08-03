from fastapi import APIRouter, Depends, HTTPException
from backend.models.audit import TomaFisicaCreate, DiferenciaInventario
from backend.security import contador_required
import mysql.connector
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()
router = APIRouter(prefix="/auditorias", tags=["auditorias"])

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

@router.post("/toma-fisica", response_model=dict)
def registrar_toma_fisica(data: TomaFisicaCreate, _=Depends(contador_required)):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO inventory_audits (fecha, usuarios) VALUES (%s, %s)",
        (datetime.now(), ",".join(data.usuarios))
    )
    audit_id = cursor.lastrowid

    for detalle in data.detalles:
        cursor.execute(
            "SELECT stock, costo, descripcion FROM products WHERE id = %s",
            (detalle.producto_id,)
        )
        producto = cursor.fetchone()
        if not producto:
            continue

        cantidad_teorica = producto[0] or 0
        costo = producto[1]
        cursor.execute(
            "INSERT INTO inventory_audit_details (audit_id, producto_id, cantidad_encontrada, cantidad_teorica, costo_unitario) VALUES (%s, %s, %s, %s, %s)",
            (audit_id, detalle.producto_id, detalle.cantidad_encontrada, cantidad_teorica, costo)
        )

    conn.commit()
    conn.close()
    return {"mensaje": "Toma física registrada correctamente"}

@router.get("/diferencias/{audit_id}", response_model=list[DiferenciaInventario])
def obtener_diferencias(audit_id: int, _=Depends(contador_required)):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.descripcion, p.marca, p.codigo_barras,
               d.cantidad_encontrada, d.cantidad_teorica,
               (d.cantidad_encontrada - d.cantidad_teorica) AS diferencia_unidades,
               ROUND((d.cantidad_encontrada - d.cantidad_teorica) * d.costo_unitario, 2) AS diferencia_monetaria
        FROM inventory_audit_details d
        JOIN products p ON d.producto_id = p.id
        WHERE d.audit_id = %s
    """, (audit_id,))
    resultados = cursor.fetchall()
    conn.close()
    return resultados
