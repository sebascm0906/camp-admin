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
  createUser,
  listUsers,
  updateUser,
  type CampUser,
  type CampUserCreate,
} from "../../api/users";
import { getErrorMessage } from "../../lib/http";
import { UserDialog } from "./UserDialog";

function formatName(user: CampUser) {
  const name = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
  return name || "No name";
}

export function UsersPage() {
  const queryClient = useQueryClient();
  const [dialogUser, setDialogUser] = useState<CampUser | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CampUserCreate) => createUser(payload),
    onSuccess: (createdUser) => {
      queryClient.setQueryData<CampUser[]>(["users"], (current = []) => [
        ...current,
        createdUser,
      ]);
      setFormError(null);
      setIsDialogOpen(false);
      setDialogUser(null);
    },
    onError: (error) => {
      setFormError(getErrorMessage(error, "Unable to create user."));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: CampUserCreate }) =>
      updateUser(userId, payload),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<CampUser[]>(["users"], (current = []) =>
        current.map((user) => (user.id === updatedUser.id ? updatedUser : user)),
      );
      setFormError(null);
      setIsDialogOpen(false);
      setDialogUser(null);
    },
    onError: (error) => {
      setFormError(getErrorMessage(error, "Unable to update user."));
    },
  });

  const users = usersQuery.data ?? [];
  const isSaving = createMutation.isPending || updateMutation.isPending;

  async function handleSubmit(payload: CampUserCreate) {
    if (dialogUser) {
      await updateMutation.mutateAsync({ userId: dialogUser.id, payload });
      return;
    }

    await createMutation.mutateAsync(payload);
  }

  function openCreateDialog() {
    setDialogUser(null);
    setFormError(null);
    setIsDialogOpen(true);
  }

  function openEditDialog(user: CampUser) {
    setDialogUser(user);
    setFormError(null);
    setIsDialogOpen(true);
  }

  function closeDialog() {
    if (isSaving) {
      return;
    }

    setIsDialogOpen(false);
    setDialogUser(null);
    setFormError(null);
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
            Users
          </Typography>
          <Typography color="text.secondary">
            Manage staff access for the current camp.
          </Typography>
        </Stack>

        <Button variant="contained" onClick={openCreateDialog}>
          Add user
        </Button>
      </Stack>

      <Paper sx={{ p: 3 }}>
        {usersQuery.isLoading ? (
          <Stack alignItems="center" py={6}>
            <CircularProgress />
          </Stack>
        ) : usersQuery.isError ? (
          <Stack spacing={1.5}>
            <Typography color="error.main">
              {getErrorMessage(usersQuery.error, "Unable to load users.")}
            </Typography>
            <Button onClick={() => void usersQuery.refetch()}>Retry</Button>
          </Stack>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Claimed</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{formatName(user)}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <Chip size="small" label={user.status} />
                  </TableCell>
                  <TableCell>{user.firebase_uid ? "Claimed" : "Pending"}</TableCell>
                  <TableCell align="right">
                    <Button onClick={() => openEditDialog(user)}>Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <UserDialog
        open={isDialogOpen}
        user={dialogUser}
        isSaving={isSaving}
        error={formError}
        onClose={closeDialog}
        onSubmit={handleSubmit}
      />
    </Stack>
  );
}
