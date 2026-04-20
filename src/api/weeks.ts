import { api } from "./client";

export type Week = {
  id: string;
  camp_id: string;
  start_date: string;
  end_date: string;
  week_type: "daycamp" | "overnight";
  calendar_week_display_name?: string | null;
};

export type CampContextState = {
  active_daycamp_week_id?: string | null;
  active_overnight_week_id?: string | null;
};

export function sortWeeksInTimelineOrder(weeks: Week[]) {
  return [...weeks].sort((left, right) => {
    const startCompare = left.start_date.localeCompare(right.start_date);
    if (startCompare !== 0) return startCompare;

    const endCompare = left.end_date.localeCompare(right.end_date);
    if (endCompare !== 0) return endCompare;

    return left.id.localeCompare(right.id);
  });
}

export async function listWeeks(campId: string) {
  const { data } = await api.get<Week[]>(`/camps/${campId}/weeks`);
  return data;
}

export async function getContext() {
  const { data } = await api.get<CampContextState>("/context");
  return data;
}

export async function selectWeek(weekId: string) {
  const { data } = await api.post<CampContextState>(`/weeks/${weekId}/select`);
  return data;
}
