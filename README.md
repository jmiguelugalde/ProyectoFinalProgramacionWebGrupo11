# ProyectoPuntoDeVenta

Sistema web para la administración de una pulpería, desarrollado como proyecto final del curso de Programación Web.

## 🚀 Tecnologías usadas

- Backend: FastAPI + Python 3.10
- Base de datos: MySQL 8
- Contenedores: Docker + Docker Compose
- Autenticación: JWT
- Orquestación de datos: Prefect
- Frontend: HTML + CSS + JS

## 📦 Estructura del proyecto

```bash
ProyectoPuntoDeVenta/
├── backend/              # Código del backend en FastAPI
├── frontend/             # Interfaz web
├── pipeline/             # ETL con Prefect
├── sql/                  # Script de base de datos
├── .env                  # Variables de entorno (no versionar)
├── Dockerfile            # Contenedor backend
├── docker-compose.yml    # Orquestador de servicios
├── requirements.txt      # Dependencias Python
├── README.md             # Documentación
```

## 🧪 Ejecución local con Docker

```bash
docker-compose up --build
```

- FastAPI: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- MySQL: puerto 3307

## 🔒 Roles de usuario

| Rol        | Acceso                                                                 |
|------------|------------------------------------------------------------------------|
| Cliente    | Solo escanear y ver su cuenta                                          |
| Contador   | Compras, ventas, toma física, cobros, dashboard                        |
| Admin      | Acceso completo a todos los módulos del sistema                        |

## 📄 Notas

Este proyecto es académico y se desarrolla en el marco del curso de Programación Web (Grupo 11).
