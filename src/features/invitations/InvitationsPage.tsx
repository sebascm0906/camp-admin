import {
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  createInvitation,
  listInvitations,
  reissueInvitation,
  revokeInvitation,
  type Invitation,
  type InvitationCreate,
} from "../../api/invitations";
import { getErrorMessage } from "../../lib/http";
import { InvitationDialog } from "./InvitationDialog";

function getInvitationState(invitation: Invitation) {
  return invitation.used_at ? "Claimed" : "Pending";
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "None";
  }

  return new Date(value).toLocaleString();
}

export function InvitationsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const invitationsQuery = useQuery({
    queryKey: ["invitations"],
    queryFn: listInvitations,
  });

  const createMutation = useMutation({
    mutationFn: (payload: InvitationCreate) => createInvitation(payload),
    onSuccess: (createdInvitation) => {
      queryClient.setQueryData<Invitation[]>(["invitations"], (current = []) => [
        createdInvitation,
        ...current,
      ]);
      setFormError(null);
      setIsDialogOpen(false);
    },
    onError: (error) => {
      setFormError(getErrorMessage(error, "Unable to create invitation."));
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (invitationId: string) => revokeInvitation(invitationId),
    onSuccess: (_result, invitationId) => {
      queryClient.setQueryData<Invitation[]>(["invitations"], (current = []) =>
        current.filter((invitation) => invitation.id !== invitationId),
      );
    },
  });

  const reissueMutation = useMutation({
    mutationFn: (invitationId: string) => reissueInvitation(invitationId),
    onSuccess: (updatedInvitation) => {
      queryClient.setQueryData<Invitation[]>(["invitations"], (current = []) =>
        current.map((invitation) =>
          invitation.id === updatedInvitation.id ? updatedInvitation : invitation,
        ),
      );
    },
  });

  const invitations = invitationsQuery.data ?? [];
  const isSaving = createMutation.isPending;

  async function handleSubmit(payload: InvitationCreate) {
    await createMutation.mutateAsync(payload);
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        spacing={2}
      >
        <Stack spacing={0.75}>
          <Typography variant="h4" fontWeight={800}>
            Invitations
          </Typography>
          <Typography color="text.secondary">
            Invite new admins and counselors into this camp.
          </Typography>
        </Stack>

        <Button
          variant="contained"
          onClick={() => {
            setFormError(null);
            setIsDialogOpen(true);
          }}
        >
          New invitation
        </Button>
      </Stack>

      <Paper sx={{ p: 3 }}>
        {invitationsQuery.isLoading ? (
          <Stack alignItems="center" py={6}>
            <CircularProgress />
          </Stack>
        ) : invitationsQuery.isError ? (
          <Stack spacing={1.5}>
            <Typography color="error.main">
              {getErrorMessage(
                invitationsQuery.error,
                "Unable to load invitations.",
              )}
            </Typography>
            <Button onClick={() => void invitationsQuery.refetch()}>Retry</Button>
          </Stack>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invitations.map((invitation) => {
                const isClaimed = Boolean(invitation.used_at);

                return (
                  <TableRow key={invitation.id} hover>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>{invitation.role}</TableCell>
                    <TableCell>
                      <Chip size="small" label={getInvitationState(invitation)} />
                    </TableCell>
                    <TableCell>{formatDate(invitation.expires_at)}</TableCell>
                    <TableCell>{formatDate(invitation.created_at)}</TableCell>
                    <TableCell align="right">
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        <Button
                          onClick={() => void reissueMutation.mutateAsync(invitation.id)}
                          disabled={isClaimed || reissueMutation.isPending}
                        >
                          Reissue
                        </Button>
                        <Button
                          color="error"
                          onClick={() => void revokeMutation.mutateAsync(invitation.id)}
                          disabled={isClaimed || revokeMutation.isPending}
                        >
                          Revoke
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>

      <InvitationDialog
        open={isDialogOpen}
        isSaving={isSaving}
        error={formError}
        onClose={() => {
          if (isSaving) {
            return;
          }

          setIsDialogOpen(false);
          setFormError(null);
        }}
        onSubmit={handleSubmit}
      />
    </Stack>
  );
}
