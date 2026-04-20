# Google Cloud SQL Preparation Checklist (camp-admin)

Este proyecto usa un frontend Vite + React y un backend FastAPI que actúa como API CRUD.  
La base de datos ahora es PostgreSQL en Google Cloud SQL.

## 1. Provisionar Cloud SQL (PostgreSQL)

1. Crea (o reutiliza) una instancia Cloud SQL PostgreSQL.
2. Crea base de datos y usuario de aplicación (`campconnect_app` recomendado).
3. Define conectividad:
   - Desarrollo local: Cloud SQL Auth Proxy (`127.0.0.1:5432`) o IP pública autorizada.
   - Producción: Private IP o conector según tu entorno.
4. Carga el schema/tablas (`campConnect.*`) y valida permisos de `SELECT/INSERT/UPDATE/DELETE`.

## 2. Plantillas de entorno

### Backend (`backend/.env.example`)

```dotenv
DATABASE_URL=postgresql+psycopg2://campconnect_app:CHANGE_ME@127.0.0.1:5432/postgres
DB_SCHEMA=campConnect
USE_MOCK_DATA=false
API_DEFAULT_PAGE_SIZE=25
API_MAX_PAGE_SIZE=200
MIGRATION_DATABASE_URL=postgresql+psycopg2://postgres:CHANGE_ME@127.0.0.1:5432/postgres
EXPECTED_DB_ROLE=campconnect_app
```

### Frontend (`.env.example`)

```dotenv
VITE_API_URL=http://localhost:8000
```

## 3. Validar configuración en código

1. `backend/app/config.py` debe leer `DATABASE_URL` y `DB_SCHEMA`.
2. `backend/app/routers/admin.py` debe operar con SQL parametrizado y mapear recursos desde `resource_table_map`.
3. El frontend solo necesita `VITE_API_URL`.

Verifica con:

```bash
rg -n "supabase|SUPABASE" backend src docs
```

## 4. Handoff para operadores

1. Copiar `backend/.env.example` -> `backend/.env` y rellenar credenciales reales.
2. Copiar `.env.example` -> `.env.local` y confirmar `VITE_API_URL`.
3. Levantar backend:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```
4. Levantar frontend:
   ```bash
   npm run dev
   ```

## 5. Checklist final

- [x] Backend desacoplado de Supabase SDK.
- [x] `DATABASE_URL` es la fuente de verdad para runtime.
- [x] Plantillas `.env.example` sin secretos reales.
- [x] Docs actualizadas a Cloud SQL.
