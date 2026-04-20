import type {
  AuthStatusResponse,
  AuthenticatedUser,
} from "../app/session/sessionTypes";
import { api } from "./client";

export async function getAuthStatus() {
  const { data } = await api.get<AuthStatusResponse>("/auth/status");
  return data;
}

export async function getMe() {
  const { data } = await api.get<AuthenticatedUser>("/auth/me");
  return data;
}

export async function claimInvitation() {
  const { data } = await api.post<AuthenticatedUser>("/auth/claim");
  return data;
}
