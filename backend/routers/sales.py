from fastapi import APIRouter, HTTPException, Depends
from backend.models.sale import SaleCreate, SaleOut
from backend.security import cliente_required, get_current_user, TokenData
import mysql.connector
from datetime import datetime
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

@router.post("/agregar", response_model=dict)
def agregar_venta(data: SaleCreate, current_user: TokenData = Depends(cliente_required)):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT precio_venta FROM products WHERE id = %s", (data.producto_id,))
    producto = cursor.fetchone()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    precio = float(producto["precio_venta"])
    total = precio * data.cantidad

    cursor.execute(
        "INSERT INTO sales (usuario, producto_id, cantidad, precio_unitario, total, fecha) VALUES (%s, %s, %s, %s, %s, %s)",
        (current_user.username, data.producto_id, data.cantidad, precio, total, datetime.now())
    )

    cursor.execute(
        "UPDATE products SET stock = stock - %s WHERE id = %s AND stock >= %s",
        (data.cantidad, data.producto_id, data.cantidad)
    )
    if cursor.rowcount == 0:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail="Stock insuficiente para realizar la venta")

    conn.commit()
    conn.close()
    return {"mensaje": "Venta registrada correctamente"}

@router.get("/mis-ventas", response_model=list[SaleOut])
def ver_mis_ventas(current_user: TokenData = Depends(cliente_required)):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM sales WHERE usuario = %s", (current_user.username,))
    ventas = cursor.fetchall()
    conn.close()
    return ventas

@router.delete("/{venta_id}", response_model=dict)
def eliminar_venta(venta_id: int, current_user: TokenData = Depends(cliente_required)):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM sales WHERE id = %s AND usuario = %s", (venta_id, current_user.username))
    venta = cursor.fetchone()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada o no autorizada")

    cursor.execute("DELETE FROM sales WHERE id = %s", (venta_id,))
    cursor.execute("UPDATE products SET stock = stock + %s WHERE id = %s", (venta["cantidad"], venta["producto_id"]))
    conn.commit()
    conn.close()
    return {"mensaje": "Venta eliminada y stock restaurado"}
