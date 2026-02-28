// Phase 5: API mutation hooks using TanStack Query
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import { queryKeys } from "../lib/queries";
import { toUserMessage } from "../lib/errorMessages";

interface ApproveRejectPayload {
  id: string | number;
  approverId: string | number;
  comment?: string;
}

interface CreateReportPayload {
  submitterId: string | number;
  title: string;
  items: { date: string; description: string; amount: number; category: string }[];
}

export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateReportPayload) => {
      return apiFetch("/api/expense-reports", {
        method: "POST",
        body: JSON.stringify(payload),
      }) as Promise<number>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (error: Error) => {
      toast.error(toUserMessage(error));
    },
  });
}

export function useApproveReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, approverId, comment }: ApproveRejectPayload) => {
      return apiFetch(`/api/expense-reports/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ approverId, comment }),
      });
    },
    onSuccess: (_, { id }) => {
      toast.success("Report approved successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.report(id) });
      queryClient.invalidateQueries({ queryKey: ["pendingApprovals"] });
    },
    onError: (error: Error) => {
      toast.error(toUserMessage(error));
    },
  });
}

export function useRejectReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, approverId, comment }: ApproveRejectPayload) => {
      return apiFetch(`/api/expense-reports/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ approverId, comment }),
      });
    },
    onSuccess: (_, { id }) => {
      toast.success("Report rejected");
      queryClient.invalidateQueries({ queryKey: queryKeys.report(id) });
      queryClient.invalidateQueries({ queryKey: ["pendingApprovals"] });
    },
    onError: (error: Error) => {
      toast.error(toUserMessage(error));
    },
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string | number;
      payload: object;
    }) => {
      return apiFetch(`/api/expense-reports/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.report(id) });
    },
    onError: (error: Error) => {
      toast.error(toUserMessage(error));
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      requesterId,
    }: {
      id: string | number;
      requesterId: string | number;
    }) => {
      return apiFetch(
        `/api/expense-reports/${id}?requesterId=${requesterId}`,
        { method: "DELETE" }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (error: Error) => {
      toast.error(toUserMessage(error));
    },
  });
}
