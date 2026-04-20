from __future__ import annotations

import csv
import io
from uuid import uuid4
from typing import Any, Dict, List, Optional, Set

from fastapi import (
  APIRouter,
  Body,
  Depends,
  File,
  HTTPException,
  Path,
  Query,
  UploadFile,
)
from fastapi.responses import StreamingResponse
from psycopg2 import DatabaseError, sql
from psycopg2.extensions import connection as DbConnection
from psycopg2.extras import RealDictCursor

from ..config import Settings, get_settings
from ..db_client import get_db_connection
from ..mock_data import create_mock, delete_mock, export_mock, import_mock, list_mock, patch_mock

router = APIRouter(prefix="/admin", tags=["Admin"])


def _resolve_table(resource: str, settings: Settings) -> str:
  table = settings.resource_table_map.get(resource)
  if not table:
    raise HTTPException(status_code=404, detail=f"Resource '{resource}' no está registrado.")
  return table


def _table_ref(schema: str, table: str) -> sql.Composed:
  return sql.SQL("{}.{}").format(sql.Identifier(schema), sql.Identifier(table))


def _db_error(exc: DatabaseError) -> HTTPException:
  detail = str(exc).strip().splitlines()[0] if str(exc).strip() else "Error de base de datos."
  return HTTPException(status_code=400, detail=detail)


def _table_columns(conn: DbConnection, schema: str, table: str) -> List[str]:
  query = """
    select column_name
    from information_schema.columns
    where table_schema = %s and table_name = %s
    order by ordinal_position
  """
  with conn.cursor() as cur:
    cur.execute(query, (schema, table))
    columns = [row[0] for row in cur.fetchall()]

  if not columns:
    raise HTTPException(
      status_code=400,
      detail=f"No se encontraron columnas para {schema}.{table}. Revisa schema/permisos.",
    )

  return columns


def _validate_payload(payload: Dict[str, Any], allowed_columns: Set[str]) -> Dict[str, Any]:
  unknown = [key for key in payload.keys() if key not in allowed_columns]
  if unknown:
    unknown_cols = ", ".join(sorted(unknown))
    raise HTTPException(status_code=400, detail=f"Columnas inválidas: {unknown_cols}")
  return payload


def _coerce_csv_value(value: Any) -> Any:
  if isinstance(value, str):
    value = value.strip()
    return None if value == "" else value
  return value


@router.get("/{resource}")
def list_resource(
  resource: str,
  page: int = Query(1, ge=1),
  limit: int | None = Query(None, ge=1),
  db: Optional[DbConnection] = Depends(get_db_connection),
  settings: Settings = Depends(get_settings),
):
  page_size = min(limit or settings.default_page_size, settings.max_page_size)
  if settings.use_mock_data:
    return list_mock(resource, page, page_size)

  if db is None:
    raise HTTPException(status_code=500, detail="PostgreSQL no está configurado.")

  table = _resolve_table(resource, settings)
  table_sql = _table_ref(settings.db_schema, table)
  start = (page - 1) * page_size

  try:
    with db.cursor(cursor_factory=RealDictCursor) as cur:
      cur.execute(sql.SQL("SELECT COUNT(*) AS total FROM {}").format(table_sql))
      total = int(cur.fetchone()["total"])

      cur.execute(
        sql.SQL("SELECT * FROM {} ORDER BY id ASC OFFSET %s LIMIT %s").format(table_sql),
        (start, page_size),
      )
      rows = [dict(row) for row in cur.fetchall()]
  except DatabaseError as exc:
    raise _db_error(exc) from exc

  return {"items": rows, "total": total}


@router.patch("/{resource}/{item_id}")
def patch_resource(
  resource: str,
  item_id: str = Path(..., description="Identificador único de la fila"),
  payload: Dict[str, Any] = Body(...),
  db: Optional[DbConnection] = Depends(get_db_connection),
  settings: Settings = Depends(get_settings),
):
  if not payload:
    raise HTTPException(status_code=400, detail="Payload vacío.")

  if settings.use_mock_data:
    return patch_mock(resource, item_id, payload)

  if db is None:
    raise HTTPException(status_code=500, detail="PostgreSQL no está configurado.")

  table = _resolve_table(resource, settings)
  table_sql = _table_ref(settings.db_schema, table)

  try:
    columns = _table_columns(db, settings.db_schema, table)
    allowed = set(columns)
    mutable_payload = dict(payload)
    mutable_payload.pop("id", None)
    mutable_payload = _validate_payload(mutable_payload, allowed)

    if not mutable_payload:
      raise HTTPException(status_code=400, detail="No hay campos para actualizar.")

    assignments = []
    values: List[Any] = []
    for key, value in mutable_payload.items():
      assignments.append(sql.SQL("{} = {}").format(sql.Identifier(key), sql.Placeholder()))
      values.append(value)

    if "updated_at" in allowed and "updated_at" not in mutable_payload:
      assignments.append(sql.SQL("{} = NOW()").format(sql.Identifier("updated_at")))

    query = sql.SQL("UPDATE {} SET {} WHERE id = %s RETURNING *").format(
      table_sql,
      sql.SQL(", ").join(assignments),
    )

    values.append(item_id)
    with db.cursor(cursor_factory=RealDictCursor) as cur:
      cur.execute(query, values)
      updated = cur.fetchone()

    if not updated:
      db.rollback()
      raise HTTPException(status_code=404, detail=f"Fila {item_id} no encontrada.")

    db.commit()
    return dict(updated)
  except HTTPException:
    raise
  except DatabaseError as exc:
    db.rollback()
    raise _db_error(exc) from exc


@router.post("/{resource}")
def create_resource(
  resource: str,
  payload: Dict[str, Any] = Body(...),
  db: Optional[DbConnection] = Depends(get_db_connection),
  settings: Settings = Depends(get_settings),
):
  if not payload:
    raise HTTPException(status_code=400, detail="Payload vacío.")

  if settings.use_mock_data:
    return create_mock(resource, payload)

  if db is None:
    raise HTTPException(status_code=500, detail="PostgreSQL no está configurado.")

  table = _resolve_table(resource, settings)
  table_sql = _table_ref(settings.db_schema, table)

  try:
    columns = _table_columns(db, settings.db_schema, table)
    allowed = set(columns)
    sanitized = _validate_payload(dict(payload), allowed)

    if "id" in allowed and not sanitized.get("id"):
      sanitized["id"] = str(uuid4())

    col_names = list(sanitized.keys())
    if not col_names:
      raise HTTPException(status_code=400, detail="No hay columnas válidas para insertar.")

    values = [sanitized[col] for col in col_names]
    query = sql.SQL("INSERT INTO {} ({}) VALUES ({}) RETURNING *").format(
      table_sql,
      sql.SQL(", ").join(sql.Identifier(col) for col in col_names),
      sql.SQL(", ").join([sql.Placeholder()] * len(col_names)),
    )

    with db.cursor(cursor_factory=RealDictCursor) as cur:
      cur.execute(query, values)
      created = cur.fetchone()

    db.commit()
    return dict(created)
  except HTTPException:
    raise
  except DatabaseError as exc:
    db.rollback()
    raise _db_error(exc) from exc


@router.delete("/{resource}/{item_id}")
def delete_resource(
  resource: str,
  item_id: str,
  db: Optional[DbConnection] = Depends(get_db_connection),
  settings: Settings = Depends(get_settings),
):
  if settings.use_mock_data:
    return delete_mock(resource, item_id)

  if db is None:
    raise HTTPException(status_code=500, detail="PostgreSQL no está configurado.")

  table = _resolve_table(resource, settings)
  table_sql = _table_ref(settings.db_schema, table)

  try:
    with db.cursor() as cur:
      cur.execute(
        sql.SQL("DELETE FROM {} WHERE id = %s RETURNING id").format(table_sql),
        (item_id,),
      )
      deleted_row = cur.fetchone()

    if not deleted_row:
      db.rollback()
      raise HTTPException(status_code=404, detail=f"Fila {item_id} no encontrada.")

    db.commit()
    return {"deleted": 1}
  except HTTPException:
    raise
  except DatabaseError as exc:
    db.rollback()
    raise _db_error(exc) from exc


@router.get("/{resource}/export")
def export_resource(
  resource: str,
  db: Optional[DbConnection] = Depends(get_db_connection),
  settings: Settings = Depends(get_settings),
):
  if settings.use_mock_data:
    rows = export_mock(resource)
  else:
    if db is None:
      raise HTTPException(status_code=500, detail="PostgreSQL no está configurado.")

    table = _resolve_table(resource, settings)
    table_sql = _table_ref(settings.db_schema, table)

    try:
      with db.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql.SQL("SELECT * FROM {} ORDER BY id ASC").format(table_sql))
        rows = [dict(row) for row in cur.fetchall()]
    except DatabaseError as exc:
      raise _db_error(exc) from exc

  if not rows:
    csv_buffer = io.StringIO()
    csv_buffer.write("")
  else:
    fieldnames = rows[0].keys()
    csv_buffer = io.StringIO()
    writer = csv.DictWriter(csv_buffer, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

  csv_buffer.seek(0)
  filename = f"{resource}.csv"
  return StreamingResponse(
    iter([csv_buffer.getvalue()]),
    media_type="text/csv",
    headers={"Content-Disposition": f'attachment; filename="{filename}"'},
  )


@router.post("/{resource}/import")
async def import_resource(
  resource: str,
  file: UploadFile = File(...),
  db: Optional[DbConnection] = Depends(get_db_connection),
  settings: Settings = Depends(get_settings),
):
  if file.content_type not in ("text/csv", "application/vnd.ms-excel"):
    raise HTTPException(status_code=400, detail="Solo se aceptan archivos CSV.")

  content = (await file.read()).decode("utf-8-sig")
  rows = list(csv.DictReader(io.StringIO(content)))

  if not rows:
    raise HTTPException(status_code=400, detail="El CSV no contiene filas.")

  if settings.use_mock_data:
    return import_mock(resource, rows)

  if db is None:
    raise HTTPException(status_code=500, detail="PostgreSQL no está configurado.")

  table = _resolve_table(resource, settings)
  table_sql = _table_ref(settings.db_schema, table)

  try:
    columns = _table_columns(db, settings.db_schema, table)
    allowed = set(columns)
    if "id" not in allowed:
      raise HTTPException(status_code=400, detail=f"{resource} no tiene columna 'id' para upsert.")

    processed = 0
    with db.cursor() as cur:
      for raw_row in rows:
        normalized = {
          key: _coerce_csv_value(value)
          for key, value in raw_row.items()
          if key is not None
        }
        normalized = _validate_payload(normalized, allowed)

        if not normalized.get("id"):
          normalized["id"] = str(uuid4())

        col_names = list(normalized.keys())
        values = [normalized[col] for col in col_names]
        update_cols = [col for col in col_names if col != "id"]

        insert_query = sql.SQL("INSERT INTO {} ({}) VALUES ({})").format(
          table_sql,
          sql.SQL(", ").join(sql.Identifier(col) for col in col_names),
          sql.SQL(", ").join([sql.Placeholder()] * len(col_names)),
        )

        if update_cols:
          conflict_query = sql.SQL(" ON CONFLICT ({}) DO UPDATE SET {}").format(
            sql.Identifier("id"),
            sql.SQL(", ").join(
              sql.SQL("{} = EXCLUDED.{}").format(sql.Identifier(col), sql.Identifier(col))
              for col in update_cols
            ),
          )
        else:
          conflict_query = sql.SQL(" ON CONFLICT ({}) DO NOTHING").format(sql.Identifier("id"))

        cur.execute(insert_query + conflict_query, values)
        processed += 1

    db.commit()
    return {"rows_processed": processed}
  except HTTPException:
    raise
  except DatabaseError as exc:
    db.rollback()
    raise _db_error(exc) from exc


__all__ = ["router"]
