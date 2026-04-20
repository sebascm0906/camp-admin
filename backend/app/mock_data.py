from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict, List

from fastapi import HTTPException

MOCK_DATA: Dict[str, List[Dict[str, Any]]] = {
  "campers": [
    {
      "id": "cam_001",
      "first_name": "Luna",
      "last_name": "Gómez",
      "age": 11,
      "cabin": "Colibrí",
      "attendance": "on_site",
      "allergies": "Nueces",
    },
    {
      "id": "cam_002",
      "first_name": "Mateo",
      "last_name": "Ruiz",
      "age": 10,
      "cabin": "Jaguar",
      "attendance": "off_site",
      "allergies": "",
    },
  ],
  "weeks": [
    {"id": "week_30", "label": "Semana 30", "starts_on": "2025-07-21", "camp": "Península"},
    {"id": "week_31", "label": "Semana 31", "starts_on": "2025-07-28", "camp": "Montaña"},
  ],
  "camps": [
    {
      "id": "camp_carrizal",
      "name": "Campamento Carrizal",
      "address": "Km 12 carretera estatal 45, Carrizal",
      "timezone": "America/Mexico_City",
      "map_image_url": "https://cdn.camp.local/maps/carrizal.png",
      "staff_resources_url": "https://notion.so/camp/carrizal",
      "created_at": "2025-01-02T16:21:00Z",
      "updated_at": "2025-01-10T09:15:00Z",
    },
    {
      "id": "camp_sierra_sur",
      "name": "Campamento Sierra Sur",
      "address": "Rancho El Pinar s/n, Oaxaca",
      "timezone": "America/Mexico_City",
      "map_image_url": None,
      "staff_resources_url": None,
      "created_at": "2025-02-01T12:00:00Z",
      "updated_at": "2025-02-05T12:00:00Z",
    },
  ],
  "activities": [
    {"id": "act_swim", "name": "Natación", "capacity": 24, "location": "Lago Norte"},
    {"id": "act_art", "name": "Arte y Manualidades", "capacity": 18, "location": "Studio 2"},
  ],
  "cabins": [
    {
      "id": "cabin_colibri",
      "camp_id": "camp_carrizal",
      "name": "Colibrí",
      "created_via_import": False,
      "created_at": "2025-01-15T08:00:00Z",
      "updated_at": "2025-01-15T08:00:00Z",
    },
    {
      "id": "cabin_jaguar",
      "camp_id": "camp_carrizal",
      "name": "Jaguar",
      "created_via_import": False,
      "created_at": "2025-01-15T08:15:00Z",
      "updated_at": "2025-01-15T08:15:00Z",
    },
  ],
  "cabin_activities": [
    {
      "id": "cab_act_01",
      "camp_id": "camp_carrizal",
      "cabin_id": "cabin_colibri",
      "week_id": "week_30",
      "weekday": "monday",
      "start_time": "09:00",
      "end_time": "10:00",
      "activity_name": "Natación",
      "emoji": "🏊",
      "daycamp_group_id": None,
      "created_at": "2025-01-20T09:00:00Z",
      "updated_at": "2025-01-20T09:00:00Z",
    },
    {
      "id": "cab_act_02",
      "camp_id": "camp_carrizal",
      "cabin_id": "cabin_jaguar",
      "week_id": "week_30",
      "weekday": "tuesday",
      "start_time": "11:00",
      "end_time": "12:00",
      "activity_name": "Arte y Manualidades",
      "emoji": "🎨",
      "daycamp_group_id": None,
      "created_at": "2025-01-21T09:00:00Z",
      "updated_at": "2025-01-21T09:30:00Z",
    },
  ],
  "slots": [
    {"id": "slot_1", "week_id": "week_30", "activity_id": "act_swim", "time": "09:00"},
    {"id": "slot_2", "week_id": "week_30", "activity_id": "act_art", "time": "11:00"},
  ],
  "forms": [
    {"id": "form_health", "name": "Salud 2025", "status": "published"},
    {"id": "form_pickup", "name": "Autorizaciones Pick-up", "status": "draft"},
  ],
  "staff": [
    {"id": "staff_01", "full_name": "Carla Méndez", "role": "Coordinadora", "week_id": "week_30"},
    {"id": "staff_02", "full_name": "Iván Torres", "role": "Coach Deportes", "week_id": "week_31"},
  ],
  "counselors": [
    {"id": "coun_01", "full_name": "Jazmín Flores", "cabin": "Colibrí"},
    {"id": "coun_02", "full_name": "Sebas Cabrera", "cabin": "Jaguar"},
  ],
}


def _require_resource(resource: str) -> List[Dict[str, Any]]:
  if resource not in MOCK_DATA:
    raise HTTPException(status_code=404, detail=f"Resource '{resource}' no tiene mock data.")
  return MOCK_DATA[resource]


def list_mock(resource: str, page: int, page_size: int):
  rows = _require_resource(resource)
  total = len(rows)
  start = (page - 1) * page_size
  end = start + page_size
  return {"items": deepcopy(rows[start:end]), "total": total}


def patch_mock(resource: str, item_id: str, payload: Dict[str, Any]):
  rows = _require_resource(resource)
  for row in rows:
    if str(row.get("id")) == str(item_id):
      row.update(payload)
      return deepcopy(row)
  raise HTTPException(status_code=404, detail=f"{resource}::{item_id} no encontrado en mock data.")


def delete_mock(resource: str, item_id: str):
  rows = _require_resource(resource)
  for idx, row in enumerate(rows):
    if str(row.get("id")) == str(item_id):
      del rows[idx]
      return {"deleted": 1}
  raise HTTPException(status_code=404, detail=f"{resource}::{item_id} no encontrado en mock data.")


def create_mock(resource: str, payload: Dict[str, Any]):
  rows = _require_resource(resource)
  row = {**payload}
  row_id = str(row.get("id") or f"{resource}_{len(rows)+1}")
  row["id"] = row_id
  rows.append(row)
  return deepcopy(row)


def export_mock(resource: str) -> List[Dict[str, Any]]:
  rows = _require_resource(resource)
  return deepcopy(rows)


def import_mock(resource: str, rows: List[Dict[str, Any]]):
  if not rows:
    raise HTTPException(status_code=400, detail="CSV vacío.")
  store = _require_resource(resource)
  existing = {str(row.get("id")): row for row in store}
  for row in rows:
    row_id = str(row.get("id") or f"{resource}_{len(store)+1}")
    row["id"] = row_id
    if row_id in existing:
      existing[row_id].update(row)
    else:
      store.append(row)
      existing[row_id] = row
  return {"rows_processed": len(rows)}
