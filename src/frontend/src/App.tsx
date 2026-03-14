import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { UserRole } from "./backend.d";
import AdminPanel from "./components/AdminPanel";
import EmployeeChat from "./components/EmployeeChat";
import LoginPage from "./components/LoginPage";
import PendingApproval from "./components/PendingApproval";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useCallerRole,
  useEmployeeLogin,
  useIsAdmin,
} from "./hooks/useQueries";

function AppLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <Skeleton className="w-48 h-4" />
        <Skeleton className="w-32 h-3" />
      </div>
    </div>
  );
}

function EmployeeAccountLinkScreen() {
  const { clear } = useInternetIdentity();
  const employeeLogin = useEmployeeLogin();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId || !password) {
      toast.error("Login ID aur Password dono zaruri hain");
      return;
    }
    try {
      await employeeLogin.mutateAsync({ loginId, password });
      toast.success("Account link ho gaya! App khul rahi hai...");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Login ID not found")) {
        toast.error("Login ID galat hai");
      } else if (msg.includes("Invalid password")) {
        toast.error("Password galat hai");
      } else {
        toast.error("Login fail ho gaya -- Login ID ya Password check karein");
      }
    }
  };

  return (
    <div className="min-h-screen wa-chat-bg flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-bubble px-8 py-10 max-w-sm w-full">
        <div className="text-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "oklch(var(--primary) / 0.12)" }}
          >
            <span className="text-3xl">🔐</span>
          </div>
          <h2 className="font-display font-bold text-lg mb-1">
            Employee Login
          </h2>
          <p className="text-sm text-muted-foreground">
            Admin ne jo Login ID aur Password diya hai woh yahan likhein
          </p>
        </div>
        <form onSubmit={handleLink} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="link-loginid" className="text-sm">
              Login ID
            </Label>
            <Input
              id="link-loginid"
              data-ocid="employee.login.input"
              placeholder="Login ID likhein"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="link-password" className="text-sm">
              Password
            </Label>
            <div className="relative">
              <Input
                id="link-password"
                data-ocid="employee.login.input"
                type={showPass ? "text" : "password"}
                placeholder="Password likhein"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPass ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            data-ocid="employee.login.submit_button"
            disabled={employeeLogin.isPending}
            className="w-full h-11 font-semibold"
            style={{ backgroundColor: "oklch(var(--primary))", color: "white" }}
          >
            {employeeLogin.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Login ho raha
                hai...
              </>
            ) : (
              "Login Karein"
            )}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => clear()}
            data-ocid="guest.button"
            className="text-xs text-muted-foreground underline hover:no-underline"
          >
            Wapas jayein (Logout)
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { isFetching: isActorLoading } = useActor();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { data: role, isLoading: isRoleLoading } = useCallerRole();

  const isLoading =
    isInitializing ||
    isActorLoading ||
    (!!identity && (isAdminLoading || isRoleLoading));

  if (!identity) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  if (isLoading) {
    return <AppLoader />;
  }

  if (isAdmin) {
    return (
      <>
        <AdminPanel />
        <Toaster />
      </>
    );
  }

  // Guest = employee who hasn't linked credentials yet
  if (!role || role === UserRole.guest) {
    return (
      <>
        <EmployeeAccountLinkScreen />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <EmployeeActiveChecker />
      <Toaster />
    </>
  );
}

function EmployeeActiveChecker() {
  const { actor, isFetching } = useActor();

  const { data: isActive, isLoading } = useQuery({
    queryKey: ["employeeActive"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        await (actor as any).getMessagesForEmployee();
        return true;
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });

  if (isLoading) return <AppLoader />;

  if (isActive === false) {
    return <PendingApproval />;
  }

  return <EmployeeChat />;
}
