from fastapi import APIRouter, HTTPException, Depends
from backend.schemas import ProductCreate, ProductUpdate, ProductOut
from backend.security import admin_required
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()
router = APIRouter(prefix="/productos", tags=["productos"])

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

@router.post("/", response_model=dict)
def crear_producto(producto: ProductCreate, _=Depends(admin_required)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""INSERT INTO products 
        (descripcion, marca, presentacion, codigo_barras, costo, margen_utilidad, precio_venta)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (
        producto.descripcion,
        producto.marca,
        producto.presentacion,
        producto.codigo_barras,
        producto.costo,
        producto.margen_utilidad,
        producto.precio_venta
    ))
    conn.commit()
    conn.close()
    return {"mensaje": "Producto creado correctamente"}

@router.get("/", response_model=list[ProductOut])
def listar_productos():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM products")
    productos = cursor.fetchall()
    conn.close()
    return productos

@router.put("/{producto_id}", response_model=dict)
def actualizar_producto(producto_id: int, datos: ProductUpdate, _=Depends(admin_required)):
    conn = get_db_connection()
    cursor = conn.cursor()
    campos = []
    valores = []
    for campo, valor in datos.dict(exclude_unset=True).items():
        campos.append(f"{campo} = %s")
        valores.append(valor)
    if not campos:
        raise HTTPException(status_code=400, detail="Ningún campo válido para actualizar")
    valores.append(producto_id)
    cursor.execute(f"UPDATE products SET {', '.join(campos)} WHERE id = %s", tuple(valores))
    conn.commit()
    conn.close()
    return {"mensaje": "Producto actualizado correctamente"}
