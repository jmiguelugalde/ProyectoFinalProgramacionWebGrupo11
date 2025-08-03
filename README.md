# ProyectoPuntoDeVenta

Aplicación web para administrar un punto de venta de una pulpería, desarrollada como proyecto final del curso de Programación Web.

## 🎯 Funcionalidades

- Creación y gestión de usuarios con roles: cliente, contador y administrador
- Registro y edición de productos
- Registro de entradas por compras de inventario
- Registro de ventas por cliente (escaneo de productos)
- Toma física de inventario con análisis de diferencias
- Módulo para aplicar cobros por parte del contador
- Estadísticas de productos más vendidos y pronóstico de demanda

## 🛠 Tecnologías utilizadas

- **Backend**: Python 3.10 + FastAPI
- **Base de datos**: MySQL 8
- **Frontend**: HTML5 + CSS3
- **Autenticación**: JWT con roles
- **Contenedores**: Docker + Docker Compose
- **Orquestación ETL**: Prefect (pipeline de respaldo y limpieza)
- **DevOps**: GitHub Actions (estructura preparada para CI/CD)

## 📦 Estructura de carpetas

```
ProyectoPuntoDeVenta/
├── backend/           # FastAPI + modelos + rutas
├── frontend/          # HTMLs para cada módulo
├── pipeline/          # ETL con Prefect, backups y logs
├── sql/               # Scripts SQL para creación de base de datos
├── .env               # Variables de entorno
├── Dockerfile         # Imagen del backend
├── docker-compose.yml # Orquesta backend + MySQL
├── requirements.txt   # Dependencias Python
├── README.md          # Documentación
└── .github/           # Workflows de CI
```

## 🚀 Ejecución local con Docker

```bash
docker-compose up --build
```

Accesos:
- API: http://localhost:8000
- Documentación Swagger: http://localhost:8000/docs
- MySQL: puerto `3307`

## 🔐 Roles y permisos

| Rol       | Acceso permitido                                                                 |
|-----------|-----------------------------------------------------------------------------------|
| Cliente   | Escanear productos, ver total adeudado                                           |
| Contador  | Registrar compras, aplicar cobros, toma física, ver reportes                     |
| Admin     | Acceso completo a todos los módulos (incluye creación de usuarios y productos)   |

## 📄 Créditos

Proyecto realizado por el Grupo 11 como parte del curso **Programación Web**.
