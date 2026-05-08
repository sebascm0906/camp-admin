import axios from "axios";
import { ENV } from "../lib/env";

function resolveApiUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const isHttpsPage =
    typeof window !== "undefined" && window.location.protocol === "https:";

  if (isHttpsPage && url.protocol === "http:" && url.hostname.endsWith(".run.app")) {
    url.protocol = "https:";
  }

  return url.toString().replace(/\/$/, "");
}

export const api = axios.create({
  baseURL: resolveApiUrl(ENV.apiUrl),
});

export function setApiToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
}
