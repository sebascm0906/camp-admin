import { api } from "./client";

export type CampUserRole = "admin" | "counselor";
export type CampUserStatus = "active" | "inactive" | "removed";

export type CampUser = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  firebase_uid?: string | null;
  is_active: boolean;
  role: string;
  status: string;
};

export type CampUserCreate = {
  email: string;
  first_name?: string;
  last_name?: string;
  role: CampUserRole;
  status: CampUserStatus;
};

export type CampUserUpdate = Partial<CampUserCreate>;

export async function listUsers() {
  const { data } = await api.get<CampUser[]>("/users");
  return data;
}

export async function createUser(payload: CampUserCreate) {
  const { data } = await api.post<CampUser>("/users", payload);
  return data;
}

export async function updateUser(userId: string, payload: CampUserUpdate) {
  const { data } = await api.patch<CampUser>(`/users/${userId}`, payload);
  return data;
}
