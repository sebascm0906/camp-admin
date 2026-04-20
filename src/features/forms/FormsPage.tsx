/* eslint-disable react-hooks/set-state-in-effect */
import {
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useCampContext } from "../../app/context/useCampContext";
import { WeekScopedLayout, type WeekScope } from "../../components/WeekScopedLayout";
import { listForms, updateForm } from "../../api/forms";
import { getErrorMessage } from "../../lib/http";

function renderJson(value: Record<string, unknown> | null | undefined) {
  return JSON.stringify(value ?? {}, null, 2);
}

function WeekFormsView({
  campId,
  scope,
}: {
  campId: string;
  scope: WeekScope;
}) {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);

  const activeWeek = scope.activeWeek;
  const formsQuery = useQuery({
    queryKey: ["forms", campId, activeWeek?.id, typeFilter],
    queryFn: () =>
      listForms({
        weekId: activeWeek?.id ?? null,
        type: typeFilter === "all" ? undefined : typeFilter,
      }),
    enabled: Boolean(activeWeek),
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ formId, isFavorited }: { formId: string; isFavorited: boolean }) =>
      updateForm(formId, { is_favorited: isFavorited }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["forms", campId, activeWeek?.id, typeFilter],
      });
    },
  });

  const forms = formsQuery.data ?? [];
  const selectedForm =
    forms.find((form) => form.id === selectedFormId) ?? forms[0] ?? null;

  useEffect(() => {
    if (!selectedFormId && forms[0]) {
      setSelectedFormId(forms[0].id);
    }
  }, [forms, selectedFormId]);

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <TextField
          select
          label="Form type"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          SelectProps={{ native: true }}
          sx={{ minWidth: 240 }}
        >
          <option value="all">All</option>
          <option value="maintenance">maintenance</option>
          <option value="behavior">behavior</option>
          <option value="food">food</option>
          <option value="shoutout">shoutout</option>
        </TextField>
      </Stack>

      <Stack direction={{ xs: "column", xl: "row" }} spacing={3}>
        <Paper sx={{ p: 3, flex: 1 }}>
          <Stack spacing={1.5}>
            <Typography variant="h6" fontWeight={700}>
              Records
            </Typography>
            {formsQuery.isLoading ? (
              <Typography color="text.secondary">Loading forms…</Typography>
            ) : formsQuery.isError ? (
              <Typography color="error.main">
                {getErrorMessage(formsQuery.error, "Unable to load forms.")}
              </Typography>
            ) : forms.length === 0 ? (
              <Typography color="text.secondary">No forms for this filter.</Typography>
            ) : (
              forms.map((form) => (
                <Button
                  key={form.id}
                  variant={selectedForm?.id === form.id ? "contained" : "text"}
                  onClick={() => setSelectedFormId(form.id)}
                  sx={{ justifyContent: "space-between" }}
                >
                  <span>{form.type}</span>
                  {form.is_favorited ? <Chip size="small" label="Favorite" /> : null}
                </Button>
              ))
            )}
          </Stack>
        </Paper>

        <Paper sx={{ p: 3, flex: 1.2 }}>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Stack spacing={0.5}>
                <Typography variant="h6" fontWeight={700}>
                  Detail
                </Typography>
                <Typography color="text.secondary">
                  {selectedForm ? selectedForm.id : "Select a form record"}
                </Typography>
              </Stack>

              {selectedForm ? (
                <Button
                  onClick={() =>
                    void toggleFavoriteMutation.mutateAsync({
                      formId: selectedForm.id,
                      isFavorited: !selectedForm.is_favorited,
                    })
                  }
                >
                  {selectedForm.is_favorited ? "Unfavorite" : "Favorite"}
                </Button>
              ) : null}
            </Stack>

            {selectedForm ? (
              <>
                <Typography color="text.secondary">
                  Rating: {selectedForm.rating ?? "None"}
                </Typography>
                <Typography color="text.secondary">
                  Content: {selectedForm.content ?? "No content"}
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography fontWeight={700}>JSON data</Typography>
                  <Typography
                    component="pre"
                    sx={{ m: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                  >
                    {renderJson(selectedForm.json_data)}
                  </Typography>
                </Paper>
              </>
            ) : (
              <Typography color="text.secondary">No form selected.</Typography>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Stack>
  );
}

export function FormsPage() {
  const { currentCamp } = useCampContext();

  return (
    <WeekScopedLayout
      title="Forms"
      description="Inspect raw form records by week and flag important ones as favorites."
    >
      {(scope) =>
        currentCamp ? <WeekFormsView campId={currentCamp.id} scope={scope} /> : null
      }
    </WeekScopedLayout>
  );
}
