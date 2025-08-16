from typing import Any, Dict, Optional, cast
from decimal import Decimal
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

# ---------- NUEVO: helpers de casting seguros ----------
def to_int(x: Any, default: int = 0) -> int:
    try:
        if x is None:
            return default
        if isinstance(x, int):
            return x
        if isinstance(x, (float, Decimal)):
            return int(x)
        if isinstance(x, (bytes, bytearray)):
            try:
                return int(x.decode().strip())
            except Exception:
                return default
        s = str(x).strip()
        if not s:
            return default
        # permite "123.0"
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
# -------------------------------------------------------

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
    usuario_id: Optional[int] = None
    try:
        cursor.execute("SELECT id FROM users WHERE username = %s", (usuario.username,))
        row_dict = cast(Optional[Dict[str, Any]], cursor.fetchone())
        if row_dict:
            usuario_id = to_int(row_dict.get("id"))
    except Exception:
        usuario_id = None

    observaciones: str = ""
    usuarios_presentes: str = ",".join([str(u) for u in (toma.usuarios or [])])

    try:
        # Insertar encabezado
        cursor.execute(
            """
            INSERT INTO toma_fisica (usuario_id, fecha, observaciones, usuarios_presentes)
            VALUES (%s, NOW(), %s, %s)
            """,
            (usuario_id, observaciones, usuarios_presentes),
        )

        toma_id = to_int(cursor.lastrowid)

        # Por cada detalle calcular diferencia vs teórico y registrar
        for detalle in toma.detalles:
            cursor.execute(
                """
                SELECT IFNULL(SUM(i.cantidad), 0) AS cantidad_teorica, p.costo
                FROM inventario i
                JOIN productos p ON p.id = i.producto_id
                WHERE i.producto_id = %s
                """,
                (to_int(detalle.producto_id),),
            )
            row2 = cast(Optional[Dict[str, Any]], cursor.fetchone())
            cantidad_teorica = to_int(row2.get("cantidad_teorica") if row2 else 0)
            costo = to_float(row2.get("costo") if row2 else 0.0)

            cantidad_encontrada = to_int(detalle.cantidad_encontrada)
            diferencia_unidades = cantidad_encontrada - cantidad_teorica
            costo_unitario = to_float(costo)
            diferencia_monetaria = costo_unitario * abs(diferencia_unidades)

            cursor.execute(
                """
                INSERT INTO diferencias_inventario (
                    toma_id, producto_id, cantidad_encontrada, cantidad_teorica,
                    diferencia_unidades, costo_unitario, diferencia_monetaria
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    to_int(toma_id),
                    to_int(detalle.producto_id),
                    to_int(cantidad_encontrada),
                    to_int(cantidad_teorica),
                    to_int(diferencia_unidades),
                    to_float(costo_unitario),
                    to_float(diferencia_monetaria),
                ),
            )

        conn.commit()
        return {"mensaje": "Toma física registrada con éxito"}
    except mysql.connector.Error as err:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error en la base de datos: {err}")
    finally:
        cursor.close()
        conn.close()
