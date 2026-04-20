import { isAxiosError } from "axios";

type ApiErrorPayload = {
  detail?: string | { detail?: string } | Array<{ msg?: string }>;
};

export function getErrorMessage(
  error: unknown,
  fallback = "Unable to complete this request.",
) {
  if (isAxiosError<ApiErrorPayload>(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }

    if (Array.isArray(detail)) {
      const firstMessage = detail.find((item) => item?.msg)?.msg;

      if (firstMessage) {
        return firstMessage;
      }
    }

    if (detail && typeof detail === "object" && "detail" in detail) {
      const nestedDetail = detail.detail;

      if (typeof nestedDetail === "string" && nestedDetail.trim()) {
        return nestedDetail;
      }
    }

    if (typeof error.message === "string" && error.message.trim()) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
