from pydantic import BaseModel
from typing import List
from datetime import datetime

class TomaFisicaDetalle(BaseModel):
    producto_id: int
    cantidad_encontrada: int

class TomaFisicaCreate(BaseModel):
    usuarios: List[str]
    detalles: List[TomaFisicaDetalle]

class DiferenciaInventario(BaseModel):
    descripcion: str
    marca: str
    codigo_barras: str
    cantidad_encontrada: int
    cantidad_teorica: int
    diferencia_unidades: int
    diferencia_monetaria: float
