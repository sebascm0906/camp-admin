import { api } from "./client";
import type { ImportResult } from "./campers";

export type BulkImportType =
  | "daycamp-campers"
  | "overnight-campers"
  | "mixed-campers"
  | "slots"
  | "staff-daycamp"
  | "staff-overnight"
  | "staff-both"
  | "cabin-activities-daycamp"
  | "cabin-activities-overnight";

export type BulkImportTarget =
  | {
      type: "daycamp-campers" | "overnight-campers" | "slots";
      weekId: string;
    }
  | {
      type: "mixed-campers";
      daycampWeekId: string;
      overnightWeekId: string;
    }
  | {
      type: "staff-daycamp" | "staff-overnight";
      weekId: string;
    }
  | {
      type: "staff-both";
      daycampWeekId: string;
      overnightWeekId: string;
    }
  | {
      type: "cabin-activities-daycamp" | "cabin-activities-overnight";
      weekId: string;
    };

export type RunBulkImportArgs = {
  campId: string;
  target: BulkImportTarget;
  csvText: string;
  idempotencyKey: string;
  replaceExisting: boolean;
  source: string;
};

type StaffImportResult = ImportResult & {
  invite_created_count?: number;
  invite_skipped_count?: number;
  invite_warnings?: Array<Record<string, unknown>>;
};

function headers(idempotencyKey: string) {
  return { "Idempotency-Key": idempotencyKey };
}

function mergeResults(left: StaffImportResult, right: StaffImportResult): StaffImportResult {
  return {
    created_count: left.created_count + right.created_count,
    skipped_count: left.skipped_count + right.skipped_count,
    errors: [...left.errors, ...right.errors],
    invite_created_count:
      (left.invite_created_count ?? 0) + (right.invite_created_count ?? 0),
    invite_skipped_count:
      (left.invite_skipped_count ?? 0) + (right.invite_skipped_count ?? 0),
    invite_warnings: [
      ...(left.invite_warnings ?? []),
      ...(right.invite_warnings ?? []),
    ],
  };
}

export async function runBulkImport({
  campId,
  target,
  csvText,
  idempotencyKey,
  replaceExisting,
  source,
}: RunBulkImportArgs): Promise<ImportResult | StaffImportResult> {
  if (target.type === "mixed-campers") {
    const { data } = await api.post<ImportResult>(
      `/camps/${campId}/campers/import-mixed`,
      {
        csv_text: csvText,
        daycamp_week_id: target.daycampWeekId,
        overnight_week_id: target.overnightWeekId,
        replace_existing: replaceExisting,
        source,
      },
      { headers: headers(idempotencyKey) },
    );
    return data;
  }

  if (target.type === "slots") {
    const { data } = await api.post<ImportResult>(
      `/camps/${campId}/weeks/${target.weekId}/slots/import`,
      {
        csv_text: csvText,
        replace_existing: replaceExisting,
        source,
      },
      { headers: headers(idempotencyKey) },
    );
    return data;
  }

  if (target.type === "staff-both") {
    const overnight = await api.post<StaffImportResult>(
      `/camps/${campId}/weeks/${target.overnightWeekId}/staff-assignments/import`,
      { csv_text: csvText, source },
      {
        headers: headers(`both:overnight:${idempotencyKey}`),
        params: { allow_mixed: true },
      },
    );
    const daycamp = await api.post<StaffImportResult>(
      `/camps/${campId}/weeks/${target.daycampWeekId}/staff-assignments/import`,
      { csv_text: csvText, source },
      {
        headers: headers(`both:daycamp:${idempotencyKey}`),
        params: { allow_mixed: true },
      },
    );
    return mergeResults(overnight.data, daycamp.data);
  }

  if (target.type === "staff-daycamp" || target.type === "staff-overnight") {
    const { data } = await api.post<StaffImportResult>(
      `/camps/${campId}/weeks/${target.weekId}/staff-assignments/import`,
      { csv_text: csvText, source },
      {
        headers: headers(idempotencyKey),
        params: { allow_mixed: true },
      },
    );
    return data;
  }

  if (
    target.type === "cabin-activities-daycamp" ||
    target.type === "cabin-activities-overnight"
  ) {
    const { data } = await api.post<ImportResult>(
      `/camps/${campId}/weeks/${target.weekId}/cabin-activities/import`,
      { csv_text: csvText, source },
      { headers: headers(idempotencyKey) },
    );
    return data;
  }

  const { data } = await api.post<ImportResult>(
    `/camps/${campId}/weeks/${target.weekId}/campers/import`,
    {
      csv_text: csvText,
      replace_existing: replaceExisting,
      source,
    },
    { headers: headers(idempotencyKey) },
  );
  return data;
}
