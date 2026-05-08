import axios from "axios";
import { ENV } from "../lib/env";

type ApiSupportContext = {
  campId: string | null;
  editMode: boolean;
  reason: string | null;
};

let supportContext: ApiSupportContext = {
  campId: null,
  editMode: false,
  reason: null,
};

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

api.interceptors.request.use((config) => {
  if (!supportContext.campId) {
    delete config.headers["X-Support-Camp-Id"];
    delete config.headers["X-Support-Edit-Mode"];
    delete config.headers["X-Support-Reason"];
    return config;
  }

  config.headers["X-Support-Camp-Id"] = supportContext.campId;

  if (supportContext.editMode) {
    config.headers["X-Support-Edit-Mode"] = "true";
    config.headers["X-Support-Reason"] = supportContext.reason ?? "";
  } else {
    delete config.headers["X-Support-Edit-Mode"];
    delete config.headers["X-Support-Reason"];
  }

  return config;
});

export function setApiToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
}

export function setApiSupportContext(nextContext: ApiSupportContext) {
  supportContext = nextContext;
}
