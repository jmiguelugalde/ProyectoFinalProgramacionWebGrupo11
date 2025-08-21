from fastapi import APIRouter, HTTPException, Depends
from backend.models.inventory import InventoryEntryCreate, InventoryEntryOut
from backend.security import contador_required
import mysql.connector
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()
router = APIRouter(prefix="/inventario", tags=["inventario"])


def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )


@router.post("/entrada", response_model=dict)
def registrar_entrada(
    data: InventoryEntryCreate, 
    _=Depends(contador_required)
):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Verificar existencia del producto
    cursor.execute("SELECT id FROM products WHERE id = %s", (data.producto_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Insertar entrada
    cursor.execute(
        "INSERT INTO inventory_entries (producto_id, cantidad, costo_unitario, fecha) VALUES (%s, %s, %s, %s)",
        (data.producto_id, data.cantidad, data.costo_unitario, datetime.now())
    )

    # Actualizar stock y precio
    cursor.execute(
        """
        UPDATE products
        SET costo = %s,
            precio_venta = ROUND(%s * (1 + margen_utilidad / 100), 2),
            stock = COALESCE(stock, 0) + %s
        WHERE id = %s
        """,
        (data.costo_unitario, data.costo_unitario, data.cantidad, data.producto_id)
    )

    conn.commit()
    conn.close()
    return {"mensaje": "Entrada de inventario registrada y stock actualizado correctamente"}


@router.get("/entradas", response_model=list[InventoryEntryOut])
def listar_entradas(
    _=Depends(contador_required)
):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM inventory_entries")
    entradas = cursor.fetchall()
    conn.close()
    return entradas
