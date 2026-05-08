import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  createCamper,
  importCampers,
  listCampers,
  updateCamper,
  type CamperCreate,
  type CamperDetail,
  type CamperListEntry,
  type CamperUpdate,
} from "../../api/campers";
import { useCampContext } from "../../app/context/useCampContext";
import { getErrorMessage } from "../../lib/http";
import { WeekScopedLayout, type WeekScope } from "../../components/WeekScopedLayout";
import { CamperDialog } from "./CamperDialog";

function formatCamperName(camper: CamperListEntry) {
  const name = `${camper.first_name ?? ""} ${camper.last_name ?? ""}`.trim();
  return name || "No name";
}

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

function WeekCampersView({
  campId,
  scope,
}: {
  campId: string;
  scope: WeekScope;
}) {
  const queryClient = useQueryClient();
  const [dialogCamper, setDialogCamper] = useState<CamperDetail | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importCsv, setImportCsv] = useState("");
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(false);

  const activeWeek = scope.activeWeek;
  const queryKey = ["campers", campId, activeWeek?.id];

  const campersQuery = useQuery({
    queryKey,
    queryFn: () => listCampers(campId, activeWeek!.id),
    enabled: Boolean(activeWeek),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CamperCreate) =>
      createCamper(campId, activeWeek!.id, payload),
    onSuccess: async () => {
      setFormError(null);
      setIsDialogOpen(false);
      setDialogCamper(null);
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      setFormError(getErrorMessage(error, "Unable to create camper."));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      camperId,
      payload,
    }: {
      camperId: string;
      payload: CamperUpdate;
    }) => updateCamper(camperId, payload),
    onSuccess: async () => {
      setFormError(null);
      setIsDialogOpen(false);
      setDialogCamper(null);
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      setFormError(getErrorMessage(error, "Unable to update camper."));
    },
  });

  const importMutation = useMutation({
    mutationFn: () =>
      importCampers(campId, activeWeek!.id, {
        csv_text: importCsv,
        replace_existing: replaceExisting,
        source: "camp-admin",
      }),
    onSuccess: async () => {
      setImportError(null);
      setIsImportDialogOpen(false);
      setImportCsv("");
      setImportFileName(null);
      setReplaceExisting(false);
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      setImportError(getErrorMessage(error, "Unable to import campers."));
    },
  });

  const directory = campersQuery.data;
  const campers = directory?.campers ?? [];
  const camperDetails = directory?.camper_details ?? {};
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const summaryLabel =
    activeWeek?.week_type === "daycamp" ? "Group" : "Cabin";

  async function handleSubmit(payload: CamperCreate | CamperUpdate) {
    if (dialogCamper) {
      await updateMutation.mutateAsync({
        camperId: dialogCamper.id,
        payload: payload as CamperUpdate,
      });
      return;
    }

    await createMutation.mutateAsync(payload as CamperCreate);
  }

  async function handleImportFile(file: File | null) {
    if (!file) {
      return;
    }

    try {
      const csvText = await readCsvFile(file);
      setImportCsv(csvText);
      setImportFileName(file.name);
      setImportError(null);
    } catch {
      setImportError("Unable to read CSV file.");
    }
  }

  const tableRows = useMemo(
    () =>
      campers.map((camper) => ({
        camper,
        detail: camperDetails[camper.id] ?? null,
      })),
    [camperDetails, campers],
  );

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        spacing={2}
      >
        <Typography color="text.secondary">
          {campers.length} campers loaded for this week.
        </Typography>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <Button
            variant="outlined"
            onClick={() => {
              setImportError(null);
              setIsImportDialogOpen(true);
            }}
          >
            Import CSV
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setDialogCamper(null);
              setFormError(null);
              setIsDialogOpen(true);
            }}
          >
            Add camper
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 3 }}>
        {campersQuery.isLoading ? (
          <Stack alignItems="center" py={6}>
            <CircularProgress />
          </Stack>
        ) : campersQuery.isError ? (
          <Stack spacing={1.5}>
            <Typography color="error.main">
              {getErrorMessage(campersQuery.error, "Unable to load campers.")}
            </Typography>
            <Button onClick={() => void campersQuery.refetch()}>Retry</Button>
          </Stack>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Age</TableCell>
                <TableCell>Swimband</TableCell>
                <TableCell>{summaryLabel}</TableCell>
                {activeWeek?.week_type === "overnight" ? (
                  <TableCell>On site</TableCell>
                ) : null}
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tableRows.map(({ camper, detail }) => (
                <TableRow key={camper.id} hover>
                  <TableCell>{formatCamperName(camper)}</TableCell>
                  <TableCell>{camper.age ?? "Unknown"}</TableCell>
                  <TableCell>{camper.swimband ?? "Unknown"}</TableCell>
                  <TableCell>
                    {camper.week_type === "daycamp"
                      ? camper.group?.name ?? "Unassigned"
                      : camper.cabin?.name ?? camper.cabin?.id ?? "Unassigned"}
                  </TableCell>
                  {activeWeek?.week_type === "overnight" ? (
                    <TableCell>{"on_site" in camper ? String(camper.on_site) : "false"}</TableCell>
                  ) : null}
                  <TableCell align="right">
                    <Button
                      onClick={() => {
                        setDialogCamper(detail);
                        setFormError(null);
                        setIsDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <CamperDialog
        open={isDialogOpen}
        camper={dialogCamper}
        weekType={activeWeek!.week_type}
        isSaving={isSaving}
        error={formError}
        onClose={() => {
          if (isSaving) {
            return;
          }

          setIsDialogOpen(false);
          setDialogCamper(null);
          setFormError(null);
        }}
        onSubmit={handleSubmit}
      />

      <Dialog
        open={isImportDialogOpen}
        onClose={importMutation.isPending ? undefined : () => setIsImportDialogOpen(false)}
        fullWidth
        maxWidth="md"
        aria-labelledby="camper-import-dialog-title"
      >
        <DialogTitle id="camper-import-dialog-title">Import campers</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {importError ? <Alert severity="error">{importError}</Alert> : null}
            <TextField
              label="CSV"
              value={importCsv}
              onChange={(event) => setImportCsv(event.target.value)}
              multiline
              minRows={10}
              fullWidth
            />
            <Stack spacing={0.75}>
              <Button variant="outlined" component="label">
                Choose CSV file
                <input
                  aria-label="CSV file"
                  type="file"
                  accept=".csv,text/csv"
                  hidden
                  onChange={(event) => {
                    void handleImportFile(event.target.files?.[0] ?? null);
                    event.target.value = "";
                  }}
                />
              </Button>
              {importFileName ? (
                <Typography color="text.secondary">
                  Loaded {importFileName}
                </Typography>
              ) : null}
            </Stack>
            <FormControlLabel
              control={
                <Checkbox
                  checked={replaceExisting}
                  onChange={(event) => setReplaceExisting(event.target.checked)}
                />
              }
              label="Replace existing campers before import"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsImportDialogOpen(false)}
            disabled={importMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={importMutation.isPending || !importCsv.trim()}
            onClick={() => void importMutation.mutateAsync()}
          >
            Run import
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export function CampersPage() {
  const { currentCamp } = useCampContext();

  return (
    <WeekScopedLayout
      title="Campers"
      description="Manage campers for the active week, including roster updates and CSV imports."
    >
      {(scope) =>
        currentCamp ? <WeekCampersView campId={currentCamp.id} scope={scope} /> : null
      }
    </WeekScopedLayout>
  );
}
