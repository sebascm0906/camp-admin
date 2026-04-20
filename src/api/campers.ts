import { api } from "./client";

export type Swimband = "red" | "green";
export type CamperWeekType = "daycamp" | "overnight";

export type CamperGroupRef = {
  id: string | null;
  name: string | null;
};

export type CamperCabinRef = {
  id: string | null;
  name: string | null;
};

export type CamperListBase = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  age?: number | null;
  swimband?: Swimband | null;
  week_type: CamperWeekType;
};

export type CamperListDaycamp = CamperListBase & {
  week_type: "daycamp";
  group: CamperGroupRef | null;
};

export type CamperListOvernight = CamperListBase & {
  week_type: "overnight";
  cabin: CamperCabinRef | null;
  on_site: boolean;
};

export type CamperListEntry = CamperListDaycamp | CamperListOvernight;

export type CamperAttendanceDaycamp = {
  type: "daycamp";
  range: { start_date: string; end_date: string };
  days: Record<string, boolean>;
  days_updated_at: Record<string, string | null>;
};

export type CamperAttendanceOvernight = {
  type: "overnight";
};

export type CamperDetail = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  age?: number | null;
  age_group?: string | null;
  swimband?: Swimband | null;
  week_id: string;
  camp_id: string;
  mode: CamperWeekType;
  week_type: CamperWeekType;
  group: CamperGroupRef | null;
  cabin: CamperCabinRef | null;
  registrations_by_period: Record<string, string | null>;
  attendance: CamperAttendanceDaycamp | CamperAttendanceOvernight;
  on_site?: boolean | null;
  on_site_updated_at?: string | null;
  notes?: string | null;
};

export type CamperDirectory = {
  campers: CamperListEntry[];
  camper_details: Record<string, CamperDetail>;
};

export type CamperCreate = {
  first_name?: string;
  last_name?: string;
  age?: number;
  age_group?: string;
  swimband?: Swimband;
  cabin_id?: string | null;
  group_id?: string | null;
  group_name?: string | null;
};

export type CamperUpdate = CamperCreate & {
  notes?: string;
};

export type CamperRead = {
  id: string;
  camp_id: string;
  week_id: string;
  first_name?: string | null;
  last_name?: string | null;
  age?: number | null;
  age_group?: string | null;
  swimband?: Swimband | null;
  cabin_id?: string | null;
  group_id?: string | null;
  group_name?: string | null;
  notes?: string | null;
};

export type CamperImportPayload = {
  csv_text: string;
  replace_existing?: boolean;
  source?: string;
};

export type ImportResult = {
  created_count: number;
  skipped_count: number;
  errors: Array<Record<string, unknown>>;
};

export async function listCampers(campId: string, weekId: string) {
  const { data } = await api.get<CamperDirectory>(
    `/camps/${campId}/weeks/${weekId}/campers`,
    {
      params: { include: "detail" },
    },
  );
  return data;
}

export async function createCamper(
  campId: string,
  weekId: string,
  payload: CamperCreate,
) {
  const { data } = await api.post<CamperRead>(
    `/camps/${campId}/weeks/${weekId}/campers/`,
    payload,
  );
  return data;
}

export async function updateCamper(camperId: string, payload: CamperUpdate) {
  const { data } = await api.patch<CamperRead>(`/campers/${camperId}`, payload);
  return data;
}

export async function importCampers(
  campId: string,
  weekId: string,
  payload: CamperImportPayload,
) {
  const { data } = await api.post<ImportResult>(
    `/camps/${campId}/weeks/${weekId}/campers/import`,
    payload,
    {
      headers: { "Idempotency-Key": crypto.randomUUID() },
    },
  );
  return data;
}
