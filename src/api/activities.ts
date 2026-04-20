import { api } from "./client";

export type ActivityRead = {
  id: string;
  camp_id: string;
  name: string;
  description?: string | null;
  duration_slots?: number | null;
  requires_green_band?: boolean;
  min_age?: number | null;
  image_url?: string | null;
};

export type ActivityCreate = {
  name: string;
  description?: string;
  duration_slots?: number;
  requires_green_band?: boolean;
  min_age?: number;
  image_url?: string;
};

export type ActivityUpdate = Partial<ActivityCreate>;

export async function listActivities(campId: string) {
  const { data } = await api.get<ActivityRead[]>(`/camps/${campId}/activities`);
  return data;
}

export async function createActivity(campId: string, payload: ActivityCreate) {
  const { data } = await api.post<ActivityRead>(`/camps/${campId}/activities`, payload);
  return data;
}

export async function updateActivity(activityId: string, payload: ActivityUpdate) {
  const { data } = await api.patch<ActivityRead>(`/activities/${activityId}`, payload);
  return data;
}
