from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Dict, Optional

from dotenv import load_dotenv

load_dotenv()


def _env_bool(name: str, default: str = "false") -> bool:
  return os.environ.get(name, default).lower() in {"1", "true", "on", "yes"}


@dataclass(frozen=True)
class Settings:
  """Centraliza configuración sensible para el backend FastAPI."""

  database_url: Optional[str] = None
  cloud_sql_instance_connection_name: Optional[str] = None
  cloud_sql_db_user: Optional[str] = None
  cloud_sql_db_password: Optional[str] = None
  cloud_sql_db_name: Optional[str] = None
  cloud_sql_enable_iam_auth: bool = False
  cloud_sql_ip_type: str = "PUBLIC"
  db_schema: str = "campConnect"
  default_page_size: int = 25
  max_page_size: int = 200
  use_mock_data: bool = False
  migration_database_url: Optional[str] = None
  expected_db_role: Optional[str] = None
  resource_table_map: Dict[str, str] = field(
    default_factory=lambda: {
      "activities": "activities",
      "activity_week_notes": "activity_week_notes",
      "attendance_activity": "attendance_activity",
      "attendance_daycamp": "attendance_daycamp",
      "attendance_overall": "attendance_overall",
      "audit_logs": "audit_logs",
      "behavior_reports": "behavior_reports",
      "cabin_activities": "cabin_activities",
      "cabins": "cabins",
      "calendar_recurrences": "calendar_recurrences",
      "calendar_week_metadata": "calendar_week_metadata",
      "camp_memberships": "camp_memberships",
      "campers": "campers",
      "camps": "camps",
      "daycamp_groups": "daycamp_groups",
      "food_ratings": "food_ratings",
      "forms": "forms",
      "import_idempotency_keys": "import_idempotency_keys",
      "maintenance_requests": "maintenance_requests",
      "registrations": "registrations",
      "shout_outs": "shout_outs",
      "slots": "slots",
      "staff_activity_roles": "staff_activity_roles",
      "staff_assignments": "staff_assignments",
      "trip_signups": "trip_signups",
      "user_camp_preferences": "user_camp_preferences",
      "user_invitations": "user_invitations",
      "users": "users",
      "weeks": "weeks",
    }
  )


@lru_cache
def get_settings() -> Settings:
  """Lee variables de entorno una sola vez."""

  use_mock_data = _env_bool("USE_MOCK_DATA", "false")
  database_url = os.environ.get("DATABASE_URL")
  cloud_sql_instance_connection_name = os.environ.get("CLOUD_SQL_INSTANCE_CONNECTION_NAME")
  cloud_sql_db_user = os.environ.get("CLOUD_SQL_DB_USER")
  cloud_sql_db_password = os.environ.get("CLOUD_SQL_DB_PASSWORD")
  cloud_sql_db_name = os.environ.get("CLOUD_SQL_DB_NAME")
  cloud_sql_enable_iam_auth = _env_bool("CLOUD_SQL_ENABLE_IAM_AUTH", "false")
  cloud_sql_ip_type = os.environ.get("CLOUD_SQL_IP_TYPE", "PUBLIC").upper()

  if not database_url and not cloud_sql_instance_connection_name and not use_mock_data:
    raise RuntimeError(
      "Debes configurar DATABASE_URL o CLOUD_SQL_INSTANCE_CONNECTION_NAME cuando USE_MOCK_DATA=false."
    )

  if cloud_sql_instance_connection_name:
    if not cloud_sql_db_user or not cloud_sql_db_name:
      raise RuntimeError(
        "CLOUD_SQL_DB_USER y CLOUD_SQL_DB_NAME son obligatorias cuando usas CLOUD_SQL_INSTANCE_CONNECTION_NAME."
      )
    if not cloud_sql_enable_iam_auth and not cloud_sql_db_password:
      raise RuntimeError(
        "CLOUD_SQL_DB_PASSWORD es obligatoria cuando CLOUD_SQL_ENABLE_IAM_AUTH=false."
      )

  schema = os.environ.get("DB_SCHEMA") or os.environ.get("SUPABASE_SCHEMA", "campConnect")
  default_page_size = int(os.environ.get("API_DEFAULT_PAGE_SIZE", "25"))
  max_page_size = int(os.environ.get("API_MAX_PAGE_SIZE", "200"))
  migration_database_url = os.environ.get("MIGRATION_DATABASE_URL")
  expected_db_role = os.environ.get("EXPECTED_DB_ROLE")

  return Settings(
    database_url=database_url,
    cloud_sql_instance_connection_name=cloud_sql_instance_connection_name,
    cloud_sql_db_user=cloud_sql_db_user,
    cloud_sql_db_password=cloud_sql_db_password,
    cloud_sql_db_name=cloud_sql_db_name,
    cloud_sql_enable_iam_auth=cloud_sql_enable_iam_auth,
    cloud_sql_ip_type=cloud_sql_ip_type,
    db_schema=schema,
    default_page_size=default_page_size,
    max_page_size=max_page_size,
    use_mock_data=use_mock_data,
    migration_database_url=migration_database_url,
    expected_db_role=expected_db_role,
  )


__all__ = ["Settings", "get_settings"]
