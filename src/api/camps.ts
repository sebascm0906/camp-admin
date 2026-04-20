import { api } from "./client";

export type Camp = {
  id: string;
  name: string;
};

export type CampSettings = {
  camp_id: string;
  timezone?: string | null;
  address?: string | null;
  map_image_url?: string | null;
  staff_resources_url?: string | null;
};

export async function listCamps() {
  const { data } = await api.get<Camp[]>("/camps");
  return data;
}

export async function getCampSettings() {
  const { data } = await api.get<CampSettings>("/camps/settings");
  return data;
}
