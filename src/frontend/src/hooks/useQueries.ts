import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExtendedEmployeeProfile } from "../backend.d";
import { useActor } from "./useActor";

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
  });
}

export function useCallerRole() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerRole"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
  });
}

export function useAllEmployees() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[bigint, ExtendedEmployeeProfile]>>({
    queryKey: ["allEmployees"],
    queryFn: async () => {
      if (!actor) return [] as Array<[bigint, ExtendedEmployeeProfile]>;
      return actor.getAllEmployees();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useEmployeeMessages() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["employeeMessages"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMessagesForEmployee();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 3000,
  });
}

export function useAdminMessages(employeeId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["adminMessages", employeeId?.toString()],
    queryFn: async () => {
      if (!actor || employeeId === null) return [];
      return actor.getMessagesForAdmin(employeeId);
    },
    enabled: !!actor && !isFetching && employeeId !== null,
    refetchInterval: 3000,
  });
}

export function useSendMessageToAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.sendMessageToAdmin(content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeMessages"] });
    },
  });
}

export function useSendMessageToEmployee() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      toId,
      content,
    }: { toId: bigint; content: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.sendMessage(toId, content);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["adminMessages", vars.toId.toString()],
      });
    },
  });
}

export function useSetEmployeeActiveStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      employeeId,
      isActive,
    }: { employeeId: bigint; isActive: boolean }) => {
      if (!actor) throw new Error("Not connected");
      return actor.setEmployeeActiveStatus(employeeId, isActive);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allEmployees"] });
    },
  });
}

export function useAdminCreateEmployee() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      phone: string;
      jobTitle: string;
      department: string;
      loginId: string;
      password: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.adminCreateEmployee(
        data.name,
        data.phone,
        data.jobTitle,
        data.department,
        data.loginId,
        data.password,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allEmployees"] });
    },
  });
}

export function useEmployeeCredentials(employeeId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<[string, string]>({
    queryKey: ["employeeCredentials", employeeId?.toString()],
    queryFn: async () => {
      if (!actor || employeeId === null) return ["", ""] as [string, string];
      return actor.getEmployeeCredentials(employeeId);
    },
    enabled: !!actor && !isFetching && employeeId !== null,
  });
}

export function useEmployeeLogin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { loginId: string; password: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.employeeLoginWithCredentials(data.loginId, data.password);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerRole"] });
      queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
    },
  });
}
