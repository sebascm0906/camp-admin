import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState, type FormEvent } from "react";
import { useSupportContext } from "../../app/support/supportContext";

export function SupportModeBanner() {
  const support = useSupportContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!support.selectedCamp) {
    return null;
  }

  function closeDialog() {
    setIsDialogOpen(false);
    setReason("");
    setConfirmation("");
    setError(null);
  }

  function submitEditMode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (confirmation.trim() !== "SUPPORT") {
      setError("Type SUPPORT to enable support edit mode.");
      return;
    }

    try {
      support.enableEditMode(reason);
      closeDialog();
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to enable support edit mode.",
      );
    }
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Alert severity={support.editMode ? "warning" : "info"}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
        >
          <Stack spacing={0.25}>
            <Typography fontWeight={800}>
              {support.editMode ? "Support edit mode active" : "Support view mode"}
            </Typography>
            <Typography>
              Viewing as: {support.selectedCamp.name}
              {support.editMode && support.reason ? ` · Reason: ${support.reason}` : ""}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            {support.editMode ? (
              <Button
                color="inherit"
                variant="outlined"
                onClick={support.disableEditMode}
              >
                Disable edits
              </Button>
            ) : (
              <Button
                color="inherit"
                variant="outlined"
                onClick={() => setIsDialogOpen(true)}
              >
                Enable edits
              </Button>
            )}
            <Button color="inherit" variant="outlined" onClick={support.stopSupport}>
              Exit support
            </Button>
          </Stack>
        </Stack>
      </Alert>

      <Dialog open={isDialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <Stack component="form" onSubmit={submitEditMode}>
          <DialogTitle>Enable Support Edit Mode</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {error ? <Alert severity="error">{error}</Alert> : null}
              <TextField
                label="Reason"
                value={reason}
                required
                multiline
                minRows={3}
                onChange={(event) => setReason(event.target.value)}
              />
              <TextField
                label="Confirmation"
                value={confirmation}
                required
                helperText="Type SUPPORT to allow audited writes."
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              Enable edits
            </Button>
          </DialogActions>
        </Stack>
      </Dialog>
    </Box>
  );
}
