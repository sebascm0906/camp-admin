# Camp Admin API (FastAPI + PostgreSQL / Google Cloud SQL)

Este backend expone los endpoints `/admin/*` para listar, editar, borrar e importar/exportar datos contra PostgreSQL.  
Está preparado para conectarse a Google Cloud SQL (PostgreSQL) con:
- `DATABASE_URL` (por ejemplo con Cloud SQL Auth Proxy)
- o Cloud SQL Python Connector (`CLOUD_SQL_*`)

## Requisitos

- Python 3.11+
- Variables de entorno:
  - `DATABASE_URL`: conexión runtime al Postgres (opción A)
  - `CLOUD_SQL_INSTANCE_CONNECTION_NAME` (opción B)
  - `CLOUD_SQL_DB_USER` (opción B)
  - `CLOUD_SQL_DB_PASSWORD` (opción B, no necesaria con IAM)
  - `CLOUD_SQL_DB_NAME` (opción B)
  - `CLOUD_SQL_ENABLE_IAM_AUTH` (opcional, default `false`)
  - `CLOUD_SQL_IP_TYPE` (opcional: `PUBLIC`, `PRIVATE`, `PSC`; default `PUBLIC`)
  - `DB_SCHEMA` (opcional, default `campConnect`)
  - `USE_MOCK_DATA` (opcional, default `false`)
  - `API_DEFAULT_PAGE_SIZE` (opcional, default `25`)
  - `API_MAX_PAGE_SIZE` (opcional, default `200`)
  - `MIGRATION_DATABASE_URL` (opcional, para tareas admin/migraciones)
  - `EXPECTED_DB_ROLE` (opcional, para validaciones operativas)

Puedes crear un `.env` dentro de `backend/` y cargarlo con:

```bash
python -m dotenv run -- uvicorn app.main:app --reload
```

## Instalación

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Ejecución local

```bash
uvicorn app.main:app --reload
```

La API queda disponible en `http://localhost:8000`.  
El panel (`camp-admin` en Vite) debe apuntar a esa URL vía `VITE_API_URL`.

## Google Cloud SQL Connector (sin proxy)

1. Instala dependencias:

```bash
pip install -r requirements.txt
```

2. Configura en `backend/.env`:

```dotenv
DATABASE_URL=
CLOUD_SQL_INSTANCE_CONNECTION_NAME=tu-proyecto:us-central1:tu-instancia
CLOUD_SQL_DB_USER=tu_usuario
CLOUD_SQL_DB_PASSWORD=tu_password
CLOUD_SQL_DB_NAME=tu_base
CLOUD_SQL_ENABLE_IAM_AUTH=false
CLOUD_SQL_IP_TYPE=PUBLIC
```

3. Si usas IAM DB Auth, activa:

```dotenv
CLOUD_SQL_ENABLE_IAM_AUTH=true
```

En ese caso puedes omitir `CLOUD_SQL_DB_PASSWORD`.

## Modo mock (sin DB real)

Si solo quieres avanzar UI/flujo, activa:

```dotenv
USE_MOCK_DATA=true
```

Con eso, `/admin/*` responderá con datos de ejemplo en memoria.

## Recursos configurados

Los endpoints actuales asumen las tablas dentro del schema configurado (`DB_SCHEMA`, por defecto `campConnect`):

| Recurso UI        | Tabla PostgreSQL  |
|-------------------|-------------------|
| campers           | campers           |
| weeks             | weeks             |
| camps             | camps             |
| activities        | activities        |
| cabins            | cabins            |
| cabin_activities  | cabin_activities  |
| slots             | slots             |
| forms             | forms             |
| staff             | staff             |
| counselors        | counselors        |

Cada tabla debe tener una columna `id` para que `PATCH/DELETE/import (upsert)` funcionen.
