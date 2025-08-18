# backend/routers/__init__.py
from . import auth, products, inventory, ventas, audit, payment, dashboard, cobros

# Lista de routers disponibles en el proyecto
all_routers = [
    auth.router,
    products.router,
    inventory.router,
    ventas.router,
    audit.router,
    payment.router,
    dashboard.router,
    cobros.router,
]
