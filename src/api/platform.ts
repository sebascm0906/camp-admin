import { api } from "./client";

export type PlatformCampCreate = {
  camp_name: string;
  timezone?: string | null;
  owner_email: string;
  owner_first_name?: string | null;
  owner_last_name?: string | null;
  notes?: string | null;
};

export type PlatformCampRead = {
  id: string;
  name: string;
  timezone?: string | null;
};

export type PlatformRootAdminInvitationRead = {
  id: string;
  email: string;
  role?: string;
  status?: string;
};

export type PlatformCampCreateResponse = {
  camp: PlatformCampRead;
  root_admin_invitation: PlatformRootAdminInvitationRead;
  email_status: "sent" | "failed" | "skipped";
  email_error?: string | null;
};

export async function createPlatformCamp(payload: PlatformCampCreate) {
  const { data } = await api.post<PlatformCampCreateResponse>(
    "/platform/camps",
    payload,
  );
  return data;
}

export async function listPlatformCamps() {
  const { data } = await api.get<PlatformCampRead[]>("/platform/camps");
  return data;
}
