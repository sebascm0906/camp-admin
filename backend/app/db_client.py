from __future__ import annotations

from functools import lru_cache
from typing import Generator, Optional

try:
  from google.cloud.sql.connector import Connector, IPTypes
except ImportError:  # pragma: no cover - depende de extras instalados en runtime
  Connector = None
  IPTypes = None

from psycopg2 import DatabaseError
from psycopg2.extensions import connection as DbConnection
from psycopg2.pool import ThreadedConnectionPool

from .config import get_settings


def _normalize_db_url(database_url: str) -> str:
  """psycopg2 espera el esquema postgresql:// sin sufijo del driver."""

  if database_url.startswith("postgresql+psycopg2://"):
    return database_url.replace("postgresql+psycopg2://", "postgresql://", 1)
  return database_url


@lru_cache
def _get_cloud_sql_connector():
  if Connector is None:
    raise RuntimeError(
      "Falta instalar cloud-sql-python-connector[psycopg2] para usar CLOUD_SQL_INSTANCE_CONNECTION_NAME."
    )
  return Connector()


def _cloud_sql_ip_type(value: str):
  if IPTypes is None:
    raise RuntimeError("No se pudo cargar google.cloud.sql.connector.IPTypes.")

  mapping = {
    "PUBLIC": IPTypes.PUBLIC,
    "PRIVATE": IPTypes.PRIVATE,
    "PSC": IPTypes.PSC,
  }
  selected = mapping.get(value.upper())
  if not selected:
    allowed = ", ".join(mapping.keys())
    raise RuntimeError(f"CLOUD_SQL_IP_TYPE inválido: '{value}'. Usa: {allowed}.")
  return selected


def _connect_cloud_sql() -> DbConnection:
  settings = get_settings()
  if not settings.cloud_sql_instance_connection_name:
    raise RuntimeError("CLOUD_SQL_INSTANCE_CONNECTION_NAME no está configurada.")
  if not settings.cloud_sql_db_user or not settings.cloud_sql_db_name:
    raise RuntimeError("CLOUD_SQL_DB_USER y CLOUD_SQL_DB_NAME son obligatorias.")

  connector = _get_cloud_sql_connector()

  connect_kwargs = {
    "user": settings.cloud_sql_db_user,
    "db": settings.cloud_sql_db_name,
    "ip_type": _cloud_sql_ip_type(settings.cloud_sql_ip_type),
  }

  if settings.cloud_sql_enable_iam_auth:
    connect_kwargs["enable_iam_auth"] = True
  elif settings.cloud_sql_db_password:
    connect_kwargs["password"] = settings.cloud_sql_db_password

  return connector.connect(
    settings.cloud_sql_instance_connection_name,
    "psycopg2",
    **connect_kwargs,
  )


@lru_cache
def _build_pool() -> ThreadedConnectionPool:
  settings = get_settings()
  if not settings.database_url:
    raise RuntimeError("DATABASE_URL no está configurada.")

  return ThreadedConnectionPool(
    minconn=1,
    maxconn=10,
    dsn=_normalize_db_url(settings.database_url),
  )


def get_db_connection() -> Generator[Optional[DbConnection], None, None]:
  """Entrega una conexión de PostgreSQL por request (o None en modo mock)."""

  settings = get_settings()
  if settings.use_mock_data:
    yield None
    return

  if settings.cloud_sql_instance_connection_name:
    conn = _connect_cloud_sql()
    conn.autocommit = False
    try:
      yield conn
    except DatabaseError:
      conn.rollback()
      raise
    finally:
      conn.close()
    return

  pool = _build_pool()
  conn = pool.getconn()
  conn.autocommit = False
  try:
    yield conn
  except DatabaseError:
    conn.rollback()
    raise
  finally:
    pool.putconn(conn)


def close_db_pool() -> None:
  if _build_pool.cache_info().currsize > 0:
    pool = _build_pool()
    pool.closeall()
    _build_pool.cache_clear()

  if _get_cloud_sql_connector.cache_info().currsize > 0:
    connector = _get_cloud_sql_connector()
    connector.close()
    _get_cloud_sql_connector.cache_clear()


__all__ = ["get_db_connection", "close_db_pool"]
