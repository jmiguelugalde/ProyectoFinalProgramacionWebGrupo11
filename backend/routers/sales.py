from typing import Any, Dict, List, Optional, cast
from decimal import Decimal
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends
from backend.models.sale import SaleCreate, SaleOut
from backend.security import cliente_required, TokenData
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()
router = APIRouter(prefix="/ventas", tags=["ventas"])

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

# ---------- Helpers de casting seguros ----------
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
                return int(float(x.decode().strip()))
            except Exception:
                return default
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
# ------------------------------------------------

@router.post("/agregar", response_model=dict)
def agregar_venta(data: SaleCreate, current_user: TokenData = Depends(cliente_required)):
    # Validaciones básicas
    cantidad = to_int(data.cantidad)
    if cantidad <= 0:
        raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a cero.")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Traer precio y stock del producto
        cursor.execute(
            "SELECT precio_venta, stock FROM products WHERE id = %s",
            (to_int(data.producto_id),)
        )
        producto = cast(Optional[Dict[str, Any]], cursor.fetchone())
        if not producto:
            raise HTTPException(status_code=404, detail="Producto no encontrado")

        precio = to_float(producto.get("precio_venta"))
        stock_actual = to_int(producto.get("stock"))

        if stock_actual < cantidad:
            raise HTTPException(status_code=400, detail="Stock insuficiente para realizar la venta")

        total = float(precio * cantidad)

        # Actualizar stock (condicional)
        cursor.execute(
            "UPDATE products SET stock = stock - %s WHERE id = %s AND stock >= %s",
            (cantidad, to_int(data.producto_id), cantidad)
        )
        if cursor.rowcount == 0:
            # Otro proceso podría haber consumido el stock entre la lectura y la actualización
            conn.rollback()
            raise HTTPException(status_code=400, detail="Stock insuficiente para realizar la venta")

        # Insertar la venta
        cursor.execute(
            """
            INSERT INTO sales (usuario, producto_id, cantidad, precio_unitario, total, fecha)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                str(current_user.username),
                to_int(data.producto_id),
                cantidad,
                float(precio),
                total,
                datetime.now(),
            ),
        )

        conn.commit()
        return {"mensaje": "Venta registrada correctamente"}
    except mysql.connector.Error as err:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error en la base de datos: {err}")
    finally:
        try:
            cursor.close()
        finally:
            conn.close()

@router.get("/mis-ventas", response_model=list[SaleOut])
def ver_mis_ventas(current_user: TokenData = Depends(cliente_required)):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT * FROM sales WHERE usuario = %s",
            (str(current_user.username),)
        )
        ventas = cast(List[Dict[str, Any]], cursor.fetchall() or [])
        # (Opcional) normalizar tipos por si el modelo es estricto
        for v in ventas:
            v["producto_id"] = to_int(v.get("producto_id"))
            v["cantidad"] = to_int(v.get("cantidad"))
            v["precio_unitario"] = to_float(v.get("precio_unitario"))
            v["total"] = to_float(v.get("total"))
        return ventas
    finally:
        try:
            cursor.close()
        finally:
            conn.close()

@router.delete("/{venta_id}", response_model=dict)
def eliminar_venta(venta_id: int, current_user: TokenData = Depends(cliente_required)):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id, usuario, cantidad, producto_id FROM sales WHERE id = %s AND usuario = %s",
            (to_int(venta_id), str(current_user.username))
        )
        venta = cast(Optional[Dict[str, Any]], cursor.fetchone())
        if not venta:
            raise HTTPException(status_code=404, detail="Venta no encontrada o no autorizada")

        cantidad = to_int(venta.get("cantidad"))
        producto_id = to_int(venta.get("producto_id"))

        cursor.execute("DELETE FROM sales WHERE id = %s", (to_int(venta_id),))
        cursor.execute(
            "UPDATE products SET stock = stock + %s WHERE id = %s",
            (cantidad, producto_id)
        )

        conn.commit()
        return {"mensaje": "Venta eliminada y stock restaurado"}
    except mysql.connector.Error as err:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error en la base de datos: {err}")
    finally:
        try:
            cursor.close()
        finally:
            conn.close()
