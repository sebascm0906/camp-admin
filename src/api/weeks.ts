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

export type CalendarWeekCreatePayload = {
  overnight_start_date: string;
  overnight_end_date: string;
  display_name?: string;
};

export type CalendarWeekCreateResult = {
  calendar_week_key: string;
  overnight_week: Week;
  daycamp_week: Week;
  template_result?: {
    staff_assignments_copied: number;
    staff_roles_copied: number;
    slots_copied: number;
    notes_copied: number;
  } | null;
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

export async function createCalendarWeek(
  campId: string,
  payload: CalendarWeekCreatePayload,
) {
  const { data } = await api.post<CalendarWeekCreateResult>(
    `/camps/${campId}/calendar-weeks`,
    payload,
  );
  return data;
}
