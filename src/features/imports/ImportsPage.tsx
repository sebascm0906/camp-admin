import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useState, type ChangeEvent } from "react";
import {
  runBulkImport,
  type BulkImportTarget,
  type BulkImportType,
} from "../../api/imports";
import type { ImportResult } from "../../api/campers";
import { useCampContext } from "../../app/context/useCampContext";
import { getErrorMessage } from "../../lib/http";

type ImportOption = {
  type: BulkImportType;
  label: string;
  summary: string;
  requiresDaycamp: boolean;
  requiresOvernight: boolean;
  supportsReplace: boolean;
  template: string;
};

const IMPORT_OPTIONS: ImportOption[] = [
  {
    type: "daycamp-campers",
    label: "Daycamp Campers",
    summary: "Imports campers into the active daycamp week.",
    requiresDaycamp: true,
    requiresOvernight: false,
    supportsReplace: true,
    template: "Name,Age,Group,Swim Band\nJane Doe,7,Lazer 1,Red\n",
  },
  {
    type: "overnight-campers",
    label: "Overnight Campers",
    summary: "Imports campers into the active overnight week.",
    requiresDaycamp: false,
    requiresOvernight: true,
    supportsReplace: true,
    template: "Name,Age,Cabin,Swim Band\nJohn Smith,11,P1A,Green\n",
  },
  {
    type: "mixed-campers",
    label: "Mixed Campers",
    summary: "Imports one CSV into both active camper weeks.",
    requiresDaycamp: true,
    requiresOvernight: true,
    supportsReplace: true,
    template: "Name,Age,Cabin,Group,Swim Band\nJane Doe,7,,Lazer 1,Red\nJohn Smith,11,P1A,,Green\n",
  },
  {
    type: "slots",
    label: "Activity Slots",
    summary: "Imports slots into the active overnight week.",
    requiresDaycamp: false,
    requiresOvernight: true,
    supportsReplace: true,
    template: "activity_code,period,capacity\nSUP,1,10\n",
  },
  {
    type: "staff-daycamp",
    label: "Staff - Daycamp",
    summary: "Imports staff assignments into the active daycamp week.",
    requiresDaycamp: true,
    requiresOvernight: false,
    supportsReplace: false,
    template: "Name,Email,Group,Morning Act,Short Break,Long Break\nAlex Lee,alex@example.com,Lazer 1,Archery,10:00,14:00\n",
  },
  {
    type: "staff-overnight",
    label: "Staff - Overnight",
    summary: "Imports staff assignments into the active overnight week.",
    requiresDaycamp: false,
    requiresOvernight: true,
    supportsReplace: false,
    template: "Name,Email,Cabin,Morning Act,Short Break,Long Break\nAlex Lee,alex@example.com,P1A,Archery,10:00,14:00\n",
  },
  {
    type: "staff-both",
    label: "Staff - Both Weeks",
    summary: "Runs the same staff CSV into active overnight and daycamp weeks.",
    requiresDaycamp: true,
    requiresOvernight: true,
    supportsReplace: false,
    template: "Name,Email,Group,Cabin,Morning Act\nAlex Lee,alex@example.com,Lazer 1,P1A,Archery\n",
  },
  {
    type: "cabin-activities-daycamp",
    label: "Cabin Activities - Daycamp",
    summary: "Imports cabin/group schedule rows into the active daycamp week.",
    requiresDaycamp: true,
    requiresOvernight: false,
    supportsReplace: false,
    template: "cabin,day,start time,end time,activity\nLazer 1,Monday,14:00,15:00,Free Swim\n",
  },
  {
    type: "cabin-activities-overnight",
    label: "Cabin Activities - Overnight",
    summary: "Imports cabin schedule rows into the active overnight week.",
    requiresDaycamp: false,
    requiresOvernight: true,
    supportsReplace: false,
    template: "cabin,day,start time,end time,activity\nP1A,Monday,14:00,15:00,Free Swim\n",
  },
];

function readCsvFile(file: File) {
  if (typeof file.text === "function") {
    return file.text();
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function formatWeekLabel(
  weeks: ReturnType<typeof useCampContext>["weeks"],
  weekId: string | null,
) {
  if (!weekId) return "not selected";
  const week = weeks.find((candidate) => candidate.id === weekId);
  if (!week) return weekId;
  return week.calendar_week_display_name ?? `${week.start_date} to ${week.end_date}`;
}

function normalizeCsv(csvText: string) {
  return csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function buildIdempotencyKey(type: BulkImportType, csvText: string) {
  return `camp-admin:${type}:${csvText.length}:${Date.now()}`;
}

function targetForSelection({
  selectedType,
  selectedDaycampWeekId,
  selectedOvernightWeekId,
}: {
  selectedType: BulkImportType;
  selectedDaycampWeekId: string | null;
  selectedOvernightWeekId: string | null;
}): BulkImportTarget | null {
  if (selectedType === "daycamp-campers" && selectedDaycampWeekId) {
    return { type: selectedType, weekId: selectedDaycampWeekId };
  }
  if (
    (selectedType === "overnight-campers" || selectedType === "slots") &&
    selectedOvernightWeekId
  ) {
    return { type: selectedType, weekId: selectedOvernightWeekId };
  }
  if (
    selectedType === "mixed-campers" &&
    selectedDaycampWeekId &&
    selectedOvernightWeekId
  ) {
    return {
      type: selectedType,
      daycampWeekId: selectedDaycampWeekId,
      overnightWeekId: selectedOvernightWeekId,
    };
  }
  if (selectedType === "staff-daycamp" && selectedDaycampWeekId) {
    return { type: selectedType, weekId: selectedDaycampWeekId };
  }
  if (selectedType === "staff-overnight" && selectedOvernightWeekId) {
    return { type: selectedType, weekId: selectedOvernightWeekId };
  }
  if (
    selectedType === "staff-both" &&
    selectedDaycampWeekId &&
    selectedOvernightWeekId
  ) {
    return {
      type: selectedType,
      daycampWeekId: selectedDaycampWeekId,
      overnightWeekId: selectedOvernightWeekId,
    };
  }
  if (selectedType === "cabin-activities-daycamp" && selectedDaycampWeekId) {
    return { type: selectedType, weekId: selectedDaycampWeekId };
  }
  if (selectedType === "cabin-activities-overnight" && selectedOvernightWeekId) {
    return { type: selectedType, weekId: selectedOvernightWeekId };
  }
  return null;
}

export function ImportsPage() {
  const {
    currentCamp,
    weeks,
    selectedDaycampWeekId,
    selectedOvernightWeekId,
  } = useCampContext();
  const [selectedType, setSelectedType] = useState<BulkImportType>("daycamp-campers");
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [replaceConfirmation, setReplaceConfirmation] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [lastIdempotencyKey, setLastIdempotencyKey] = useState<string | null>(null);

  const selectedOption = useMemo(
    () => IMPORT_OPTIONS.find((option) => option.type === selectedType) ?? IMPORT_OPTIONS[0],
    [selectedType],
  );

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!currentCamp) throw new Error("No camp loaded");
      const normalizedCsv = normalizeCsv(csvText);
      if (!normalizedCsv.trim()) {
        throw new Error("Paste CSV text or choose a CSV file.");
      }
      if (selectedOption.supportsReplace && replaceExisting && replaceConfirmation !== "REPLACE") {
        throw new Error("Type REPLACE to confirm destructive import.");
      }
      const target = targetForSelection({
        selectedType,
        selectedDaycampWeekId,
        selectedOvernightWeekId,
      });
      if (!target) {
        throw new Error("Select the required active week context before importing.");
      }
      const idempotencyKey = buildIdempotencyKey(selectedType, normalizedCsv);
      setLastIdempotencyKey(idempotencyKey);
      return runBulkImport({
        campId: currentCamp.id,
        target,
        csvText: normalizedCsv,
        idempotencyKey,
        replaceExisting: selectedOption.supportsReplace ? replaceExisting : false,
        source: "camp-admin",
      });
    },
    onMutate: () => setFormError(null),
    onError: (error) => {
      setFormError(getErrorMessage(error, "Unable to import CSV."));
    },
  });

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;
    try {
      setCsvText(normalizeCsv(await readCsvFile(file)));
      setFileName(file.name);
      setFormError(null);
    } catch {
      setFormError("Unable to read CSV file.");
    }
  }

  const result = importMutation.data as ImportResult | undefined;

  if (!currentCamp) {
    return (
      <Stack spacing={3}>
        <Typography variant="h4" fontWeight={700}>
          Bulk Imports
        </Typography>
        <Alert severity="info">No camp loaded.</Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h4" fontWeight={700}>
          Bulk Imports
        </Typography>
        <Typography color="text.secondary">
          Import CSV files into the active camp weeks for admin and mobile E2E testing.
        </Typography>
      </Stack>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={1}>
          <Typography fontWeight={700}>Active targets</Typography>
          <Typography color="text.secondary">
            Daycamp: {formatWeekLabel(weeks, selectedDaycampWeekId)}
          </Typography>
          <Typography color="text.secondary">
            Overnight: {formatWeekLabel(weeks, selectedOvernightWeekId)}
          </Typography>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          {formError ? <Alert severity="error">{formError}</Alert> : null}
          <TextField
            select
            label="Import type"
            value={selectedType}
            onChange={(event) => {
              const nextType = event.target.value as BulkImportType;
              const nextOption =
                IMPORT_OPTIONS.find((option) => option.type === nextType) ?? IMPORT_OPTIONS[0];
              setSelectedType(nextType);
              setReplaceExisting(false);
              setReplaceConfirmation("");
              setCsvText(nextOption.template);
              setFileName(null);
              setFormError(null);
            }}
            SelectProps={{ native: true }}
            fullWidth
          >
            {IMPORT_OPTIONS.map((option) => (
              <option key={option.type} value={option.type}>
                {option.label}
              </option>
            ))}
          </TextField>
          <Typography color="text.secondary">{selectedOption.summary}</Typography>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <Button variant="outlined" component="label">
              Choose CSV file
              <input
                aria-label="CSV file"
                type="file"
                accept=".csv,text/csv"
                hidden
                onChange={(event) => void handleFile(event)}
              />
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setCsvText(selectedOption.template);
                setFileName(null);
                setFormError(null);
              }}
            >
              Use template
            </Button>
          </Stack>
          {fileName ? (
            <Typography color="text.secondary">Loaded {fileName}</Typography>
          ) : null}

          <TextField
            label="CSV"
            value={csvText}
            onChange={(event) => setCsvText(event.target.value)}
            multiline
            minRows={10}
            fullWidth
          />

          {selectedOption.supportsReplace ? (
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={replaceExisting}
                    onChange={(event) => {
                      setReplaceExisting(event.target.checked);
                      if (!event.target.checked) setReplaceConfirmation("");
                    }}
                  />
                }
                label="Replace existing data for this target"
              />
              {replaceExisting ? (
                <TextField
                  label="Confirm replace"
                  value={replaceConfirmation}
                  onChange={(event) => setReplaceConfirmation(event.target.value)}
                  fullWidth
                />
              ) : null}
            </Stack>
          ) : null}

          {lastIdempotencyKey ? (
            <Typography color="text.secondary">
              Last idempotency key: {lastIdempotencyKey}
            </Typography>
          ) : null}

          {result ? (
            <Alert severity={result.errors.length ? "warning" : "success"}>
              Created {result.created_count}; skipped {result.skipped_count}; errors{" "}
              {result.errors.length}.
            </Alert>
          ) : null}

          {result?.errors.length ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Row</TableCell>
                  <TableCell>Error</TableCell>
                  <TableCell>Message</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.errors.map((error, index) => (
                  <TableRow key={index}>
                    <TableCell>{String(error.row ?? error.row_number ?? "-")}</TableCell>
                    <TableCell>{String(error.error ?? error.code ?? "-")}</TableCell>
                    <TableCell>{String(error.message ?? error.detail ?? JSON.stringify(error))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}

          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="contained"
              disabled={importMutation.isPending}
              onClick={() => importMutation.mutate()}
            >
              {importMutation.isPending ? "Importing..." : "Import"}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
