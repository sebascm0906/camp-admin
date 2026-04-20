import { api } from "./client";

export type SlotRead = {
  id: string;
  week_id: string;
  activity_id: string;
  period: number | null;
  start_time?: string | null;
  end_time?: string | null;
  capacity: number;
};

export type GenerateActivitySlotsPayload = {
  periods: number[];
  capacity: number;
  replace_existing?: boolean;
};

export type GenerateActivitySlotsResponse = {
  created_count: number;
  skipped_count: number;
};

export async function listSlots(campId: string, weekId: string) {
  const { data } = await api.get<SlotRead[]>(`/camps/${campId}/weeks/${weekId}/slots/`);
  return data;
}

export async function generateActivitySlots(
  campId: string,
  weekId: string,
  activityId: string,
  payload: GenerateActivitySlotsPayload,
) {
  const { data } = await api.post<GenerateActivitySlotsResponse>(
    `/camps/${campId}/weeks/${weekId}/slots/activity/${activityId}/generate`,
    payload,
  );
  return data;
}
