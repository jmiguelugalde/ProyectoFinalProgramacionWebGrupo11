from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InventoryEntryBase(BaseModel):
    producto_id: int
    cantidad: int
    costo_unitario: float

class InventoryEntryCreate(InventoryEntryBase):
    pass

class InventoryEntryOut(InventoryEntryBase):
    id: int
    fecha: datetime
