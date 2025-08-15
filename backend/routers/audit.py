from fastapi import APIRouter, Depends, HTTPException
from backend.models.audit import TomaFisicaCreate, TomaFisicaDetalle
from backend.security import admin_required, get_current_user, TokenData
import os
from dotenv import load_dotenv
load_dotenv()
import mysql.connector

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

router = APIRouter(prefix="/auditoria", tags=["auditoria"])

@router.post("/toma-fisica")
def registrar_toma_fisica(
    toma: TomaFisicaCreate,
    usuario: TokenData = Depends(get_current_user)
):
    # Valida rol
    if usuario.role not in ["contador", "admin"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para registrar toma física")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Resolver usuario_id a partir del username del token
    usuario_id = None
    try:
        cursor.execute("SELECT id FROM users WHERE username = %s", (usuario.username,))
        row = cursor.fetchone()
        if row and 'id' in row:
            usuario_id = row['id']
    except Exception:
        usuario_id = None

    try:
        # Insertar encabezado (observaciones='', usuarios_presentes=','.join(toma.usuarios))
        cursor.execute("""
            INSERT INTO toma_fisica (usuario_id, fecha, observaciones, usuarios_presentes)
            VALUES (%s, NOW(), %s, %s)
        """, (usuario_id, '', ','.join(toma.usuarios)))

        toma_id = cursor.lastrowid

        # Por cada detalle calcular diferencia vs teórico y registrar
        for detalle in toma.detalles:
            cursor.execute("""
                SELECT IFNULL(SUM(i.cantidad), 0) AS cantidad_teorica, p.costo
                FROM inventario i
                JOIN productos p ON p.id = i.producto_id
                WHERE i.producto_id = %s
            """, (detalle.producto_id,))
            row = cursor.fetchone() or {}
            cantidad_teorica = row.get("cantidad_teorica", 0)
            costo = row.get("costo", 0.0)

            cursor.execute("""
                INSERT INTO diferencias_inventario (
                    toma_id, producto_id, cantidad_encontrada, cantidad_teorica,
                    diferencia_unidades, costo_unitario, diferencia_monetaria
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                toma_id,
                detalle.producto_id,
                detalle.cantidad_encontrada,
                cantidad_teorica,
                detalle.cantidad_encontrada - cantidad_teorica,
                costo,
                costo * abs(detalle.cantidad_encontrada - cantidad_teorica)
            ))

        conn.commit()
        return {"mensaje": "Toma física registrada con éxito"}
    except mysql.connector.Error as err:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error en la base de datos: {err}")
    finally:
        cursor.close()
        conn.close()
