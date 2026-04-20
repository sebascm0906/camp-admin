import axios from "axios";
import { ENV } from "../lib/env";

export const api = axios.create({
  baseURL: ENV.apiUrl,
});

export function setApiToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
}
