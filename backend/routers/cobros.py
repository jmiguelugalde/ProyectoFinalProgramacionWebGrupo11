# backend/routers/cobros.py
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Dict, List, cast
from datetime import datetime, date
import os
import mysql.connector
from dotenv import load_dotenv

# 🔹 Ajuste del import (asegurando ruta absoluta al decorador de seguridad)
from backend.security import contador_required

load_dotenv()

router = APIRouter(prefix="/cobros", tags=["cobros"])


def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
    )


# ---------- Modelos de respuesta ----------

class CuentaPendiente(BaseModel):
    usuario: str
    total_pendiente: float = Field(0, description="Suma de ventas.total por usuario")


class LineaDetalle(BaseModel):
    venta_id: int
    fecha: str                  # ISO 8601 (YYYY-MM-DDTHH:MM:SS)
    producto: str
    cantidad: int
    precio: float               # precio_unitario
    total: float


class ResumenUsuario(BaseModel):
    usuario: str
    ventas: int
    total: float


class Mensaje(BaseModel):
    mensaje: str


# ---------- Helpers seguros ----------

def _as_float(v: Any) -> float:
    if v is None:
        return 0.0
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, (datetime, date)):
        return 0.0
    try:
        return float(str(v))  # DECIMAL/str
    except Exception:
        return 0.0


def _as_int(v: Any) -> int:
    if v is None:
        return 0
    if isinstance(v, int):
        return v
    if isinstance(v, (datetime, date)):
        return 0
    try:
        return int(str(v))
    except Exception:
        return 0


def _as_iso(dt: Any) -> str:
    if isinstance(dt, datetime):
        return dt.isoformat(timespec="seconds")
    if isinstance(dt, date):
        return dt.isoformat()
    return str(dt) if dt is not None else ""


# ====================================================
#                   ENDPOINTS
# ====================================================

@router.get("/", response_model=List[CuentaPendiente])
def listar_cuentas_pendientes(_=Depends(contador_required)):
    """
    Totales por usuario (ventas.total).
    """
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute(
            """
            SELECT usuario, SUM(total) AS total_pendiente
            FROM ventas
            GROUP BY usuario
            HAVING total_pendiente > 0
            """
        )
        rows = cast(List[Dict[str, Any]], cur.fetchall() or [])
        res: List[CuentaPendiente] = []
        for r in rows:
            usuario = str(r.get("usuario", "") or "")
            total_pend = _as_float(r.get("total_pendiente"))
            res.append(CuentaPendiente(usuario=usuario, total_pendiente=total_pend))
        return res
    finally:
        try:
            cur.close()
        finally:
            conn.close()


@router.get("/detalle/{usuario}", response_model=List[LineaDetalle])
def detalle_usuario(usuario: str, _=Depends(contador_required)):
    """
    Detalle de ventas de un usuario: fecha, producto, cantidad, precio, total.
    """
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute(
            """
            SELECT s.id AS venta_id, s.fecha, p.descripcion AS producto,
                   s.cantidad, s.precio_unitario, s.total
            FROM ventas s
            JOIN products p ON s.producto_id = p.id
            WHERE s.usuario = %s
            ORDER BY s.fecha DESC, s.id DESC
            """,
            (usuario,),
        )
        rows = cast(List[Dict[str, Any]], cur.fetchall() or [])
        res: List[LineaDetalle] = []
        for r in rows:
            res.append(
                LineaDetalle(
                    venta_id=_as_int(r.get("venta_id")),
                    fecha=_as_iso(r.get("fecha")),
                    producto=str(r.get("producto", "") or ""),
                    cantidad=_as_int(r.get("cantidad")),
                    precio=_as_float(r.get("precio_unitario")),
                    total=_as_float(r.get("total")),
                )
            )
        return res
    finally:
        try:
            cur.close()
        finally:
            conn.close()


@router.get("/resumen-quincena", response_model=List[ResumenUsuario])
def resumen_quincena(_=Depends(contador_required)):
    """
    Resumen global por usuario: #ventas y total a rebajar (ventas actuales en 'ventas').
    """
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute(
            """
            SELECT usuario,
                   COUNT(*) AS ventas,
                   SUM(total) AS total
            FROM ventas
            GROUP BY usuario
            HAVING total > 0
            ORDER BY total DESC
            """
        )
        rows = cast(List[Dict[str, Any]], cur.fetchall() or [])
        res: List[ResumenUsuario] = []
        for r in rows:
            res.append(
                ResumenUsuario(
                    usuario=str(r.get("usuario", "") or ""),
                    ventas=_as_int(r.get("ventas")),
                    total=_as_float(r.get("total")),
                )
            )
        return res
    finally:
        try:
            cur.close()
        finally:
            conn.close()


@router.post("/liquidar/{usuario}", response_model=Mensaje)
def liquidar_usuario(usuario: str, _=Depends(contador_required)):
    """
    'Cierra' la cuenta del usuario moviendo sus ventas a una tabla histórica
    y eliminándolas de la tabla actual.
    """
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    try:
        # Validar existencia del usuario
        cur.execute("SELECT COUNT(*) AS existe FROM ventas WHERE usuario = %s", (usuario,))
        row = cast(Dict[str, Any], cur.fetchone() or {})
        existe = _as_int(row.get("existe"))

        if existe == 0:
            raise HTTPException(status_code=404, detail="El usuario no existe en ventas.")

        # Calcular deuda
        cur.execute("SELECT SUM(total) AS deuda FROM ventas WHERE usuario = %s", (usuario,))
        row = cast(Dict[str, Any], cur.fetchone() or {})
        deuda = _as_float(row.get("deuda"))

        if deuda <= 0.0:
            raise HTTPException(
                status_code=400,
                detail="El usuario existe pero no tiene deudas pendientes."
            )

        # Mover registros a tabla histórica
        cur.execute(
            """
            INSERT INTO ventas_hist (id, usuario, producto_id, cantidad, precio_unitario, total, fecha, fecha_liquidacion)
            SELECT id, usuario, producto_id, cantidad, precio_unitario, total, fecha, %s
            FROM ventas
            WHERE usuario = %s
            """,
            (datetime.utcnow(), usuario),
        )

        # Eliminar de la tabla actual
        cur.execute("DELETE FROM ventas WHERE usuario = %s", (usuario,))
        conn.commit()
        return Mensaje(mensaje=f"Cuenta de {usuario} liquidada por ₡{deuda:.2f}. Movida a historial.")
    finally:
        try:
            cur.close()
        finally:
            conn.close()
