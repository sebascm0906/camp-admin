import { api } from "./client";

export type FormRecord = {
  id: string;
  type: string;
  camp_id: string;
  week_id?: string | null;
  user_id: string;
  camper_id?: string | null;
  cabin_id?: string | null;
  shoutout_to?: string | null;
  location_name?: string | null;
  is_favorited: boolean;
  json_data?: Record<string, unknown> | null;
  content?: string | null;
  rating?: number | null;
};

export type FormUpdate = {
  content?: string;
  rating?: number;
  is_favorited?: boolean;
  json_data?: Record<string, unknown> | null;
};

export type FormSubmissionType = "maintenance" | "behavior" | "food" | "shoutout";

export type FormSubmission = {
  id: string;
  form_type: FormSubmissionType;
  created_at: string;
  submitted_by: { id: string; name: string };
  summary: string;
  details: Record<string, unknown>;
};

export async function listForms(params: {
  type?: string;
  weekId?: string | null;
  isFavorited?: boolean;
}) {
  const { data } = await api.get<FormRecord[]>("/forms", {
    params: {
      type: params.type,
      week_id: params.weekId,
      is_favorited: params.isFavorited,
    },
  });
  return data;
}

export async function getForm(formId: string) {
  const { data } = await api.get<FormRecord>(`/forms/${formId}`);
  return data;
}

export async function updateForm(formId: string, payload: FormUpdate) {
  const { data } = await api.patch<FormRecord>(`/forms/${formId}`, payload);
  return data;
}

export async function listFormSubmissions(
  weekId: string,
  type?: FormSubmissionType,
) {
  const { data } = await api.get<FormSubmission[]>("/form-submissions/", {
    params: {
      week_id: weekId,
      type,
    },
  });
  return data;
}
