import { api } from "./client";

export type InvitationRole = "admin" | "counselor";

export type Invitation = {
  id: string;
  email: string;
  role: string;
  expires_at?: string | null;
  used_at?: string | null;
  created_at: string;
};

export type InvitationCreate = {
  email: string;
  role: InvitationRole;
  expires_at?: string | null;
};

export async function listInvitations() {
  const { data } = await api.get<Invitation[]>("/invitations");
  return data;
}

export async function createInvitation(payload: InvitationCreate) {
  const { data } = await api.post<Invitation>("/invitations", payload);
  return data;
}

export async function revokeInvitation(id: string) {
  await api.delete(`/invitations/${id}`);
}

export async function reissueInvitation(id: string) {
  const { data } = await api.post<Invitation>(`/invitations/${id}/reissue`);
  return data;
}
