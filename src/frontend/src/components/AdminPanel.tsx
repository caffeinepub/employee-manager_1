import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Eye,
  EyeOff,
  Loader2,
  MessageSquare,
  Phone,
  Search,
  Send,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ExtendedEmployeeProfile, Message } from "../backend.d";
import { MessageRole } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAdminCreateEmployee,
  useAdminMessages,
  useAllEmployees,
  useEmployeeCredentials,
  useSendMessageToEmployee,
  useSetEmployeeActiveStatus,
} from "../hooks/useQueries";

const AVATAR_COLORS = [
  "oklch(0.55 0.18 250)",
  "oklch(0.52 0.16 30)",
  "oklch(0.50 0.16 300)",
  "oklch(0.52 0.15 180)",
  "oklch(0.55 0.18 140)",
  "oklch(0.52 0.18 60)",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function CreateEmployeeDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    jobTitle: "",
    department: "",
    loginId: "",
    password: "",
  });
  const [showPass, setShowPass] = useState(false);
  const createEmployee = useAdminCreateEmployee();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.loginId || !form.password) {
      toast.error("Naam, Login ID aur Password zaruri hain");
      return;
    }
    try {
      await createEmployee.mutateAsync(form);
      toast.success(`${form.name} ka account ban gaya!`);
      setForm({
        name: "",
        phone: "",
        jobTitle: "",
        department: "",
        loginId: "",
        password: "",
      });
      setOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Login ID already exists")) {
        toast.error(
          "Yeh Login ID already use ho raha hai -- doosra ID chunein",
        );
      } else {
        toast.error("Account banana fail ho gaya");
      }
    }
  };

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          data-ocid="admin.open_modal_button"
          className="text-white text-xs gap-1.5 h-8 px-3"
          style={{ backgroundColor: "oklch(var(--primary) / 0.85)" }}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Employee Banao
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" data-ocid="admin.dialog">
        <DialogHeader>
          <DialogTitle className="font-display">
            Naya Employee Banao
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="emp-name" className="text-xs">
                Naam *
              </Label>
              <Input
                id="emp-name"
                data-ocid="admin.employee.input"
                placeholder="Ali Ahmed"
                value={form.name}
                onChange={set("name")}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="emp-phone" className="text-xs">
                Phone
              </Label>
              <Input
                id="emp-phone"
                placeholder="03001234567"
                value={form.phone}
                onChange={set("phone")}
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="emp-job" className="text-xs">
                Job Title
              </Label>
              <Input
                id="emp-job"
                placeholder="Manager"
                value={form.jobTitle}
                onChange={set("jobTitle")}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="emp-dept" className="text-xs">
                Department
              </Label>
              <Input
                id="emp-dept"
                placeholder="Sales"
                value={form.department}
                onChange={set("department")}
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="emp-loginid" className="text-xs">
              Login ID *
            </Label>
            <Input
              id="emp-loginid"
              data-ocid="admin.employee.input"
              placeholder="ali.ahmed"
              value={form.loginId}
              onChange={set("loginId")}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="emp-pass" className="text-xs">
              Password *
            </Label>
            <div className="relative">
              <Input
                id="emp-pass"
                data-ocid="admin.employee.input"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={set("password")}
                className="h-9 text-sm pr-10"
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
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              data-ocid="admin.cancel_button"
              onClick={() => setOpen(false)}
              className="h-9 text-sm"
            >
              Wapas
            </Button>
            <Button
              type="submit"
              data-ocid="admin.submit_button"
              disabled={createEmployee.isPending}
              className="h-9 text-sm"
              style={{ backgroundColor: "oklch(var(--primary))" }}
            >
              {createEmployee.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" /> Bana raha
                  hai...
                </>
              ) : (
                "Account Banao"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CredentialsDialog({
  employeeId,
  name,
  index,
}: { employeeId: bigint; name: string; index: number }) {
  const [open, setOpen] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { data: creds, isLoading: credsLoading } = useEmployeeCredentials(
    open ? employeeId : null,
  );

  const loginId = creds?.[0] ?? "";
  const password = creds?.[1] ?? "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          data-ocid={`admin.item.${index}`}
          title="Login ID & Password dekho"
          className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors flex-shrink-0"
          style={{
            backgroundColor: "oklch(var(--primary) / 0.12)",
            color: "oklch(var(--primary))",
          }}
        >
          <Eye className="w-3.5 h-3.5" />
          ID/Pass
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs" data-ocid="admin.dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-base">
            {name} — Login Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {credsLoading ? (
            <div className="space-y-3" data-ocid="admin.loading_state">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Login ID</p>
                <div
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                  style={{ backgroundColor: "oklch(var(--muted))" }}
                >
                  <span className="font-mono text-sm font-semibold">
                    {loginId || "—"}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Password</p>
                <div
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                  style={{ backgroundColor: "oklch(var(--muted))" }}
                >
                  <span className="font-mono text-sm font-semibold">
                    {showPass ? password || "—" : "••••••••"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="text-muted-foreground hover:text-foreground ml-2"
                  >
                    {showPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
          <p className="text-xs text-muted-foreground">
            Yeh credentials employee ko share karein taake woh login kar sakein.
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            data-ocid="admin.close_button"
            onClick={() => setOpen(false)}
            className="h-9 text-sm w-full"
          >
            Theek Hai
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPanel() {
  const { clear } = useInternetIdentity();
  const { data: employees, isLoading: empLoading } = useAllEmployees();
  const [selectedEmployee, setSelectedEmployee] = useState<
    [bigint, ExtendedEmployeeProfile] | null
  >(null);
  const [mobileTab, setMobileTab] = useState<"list" | "chat">("list");
  const [search, setSearch] = useState("");

  const filtered = employees?.filter(
    ([, p]) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.department.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-chat-bg">
      <div className="md:hidden flex">
        <button
          type="button"
          data-ocid="admin.tab"
          className={cn(
            "flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors",
            mobileTab === "list"
              ? "wa-header text-white"
              : "bg-white text-muted-foreground",
          )}
          onClick={() => setMobileTab("list")}
        >
          <Users className="w-4 h-4" /> Employees
        </button>
        <button
          type="button"
          data-ocid="admin.tab"
          className={cn(
            "flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors",
            mobileTab === "chat"
              ? "wa-header text-white"
              : "bg-white text-muted-foreground",
          )}
          onClick={() => setMobileTab("chat")}
        >
          <MessageSquare className="w-4 h-4" /> Chat
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div
          className={cn(
            "w-full md:w-[360px] flex flex-col bg-white border-r border-border flex-shrink-0",
            "md:flex",
            mobileTab === "list" ? "flex" : "hidden",
          )}
        >
          <div className="wa-sidebar-header px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-display font-bold text-white text-sm leading-tight">
                  Hacked Power
                </p>
                <p className="text-white/70 text-xs">Admin Panel</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CreateEmployeeDialog />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clear()}
                data-ocid="nav.button"
                className="text-white/80 hover:text-white hover:bg-white/10 text-xs"
              >
                Logout
              </Button>
            </div>
          </div>

          <div className="px-3 py-2 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search karein..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-muted border-0 rounded-full h-9 text-sm focus-visible:ring-1"
              />
            </div>
          </div>

          <div className="px-4 py-1.5 bg-secondary/40 border-b border-border">
            <p className="text-xs text-muted-foreground font-medium">
              Employees ({filtered?.length ?? 0})
            </p>
          </div>

          <ScrollArea className="flex-1">
            {empLoading ? (
              <div className="p-4 space-y-1" data-ocid="admin.loading_state">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-3">
                    <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered?.length === 0 ? (
              <div className="p-8 text-center" data-ocid="admin.empty_state">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Koi employee nahi mila
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Upar &ldquo;Employee Banao&rdquo; se naya account banayein
                </p>
              </div>
            ) : (
              <div data-ocid="admin.list">
                {filtered?.map(([id, profile], idx) => (
                  <EmployeeRow
                    key={id.toString()}
                    employeeId={id}
                    profile={profile}
                    index={idx + 1}
                    isSelected={selectedEmployee?.[0] === id}
                    onSelect={() => {
                      setSelectedEmployee([id, profile]);
                      setMobileTab("chat");
                    }}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div
          className={cn(
            "flex-1 flex flex-col",
            "md:flex",
            mobileTab === "chat" ? "flex" : "hidden",
          )}
        >
          {selectedEmployee ? (
            <AdminChat
              employee={selectedEmployee}
              onBack={() => setMobileTab("list")}
            />
          ) : (
            <div
              className="flex-1 flex items-center justify-center wa-chat-bg"
              data-ocid="admin.empty_state"
            >
              <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl px-10 py-8 shadow-bubble">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: "oklch(var(--primary) / 0.12)" }}
                >
                  <MessageSquare
                    className="w-8 h-8"
                    style={{ color: "oklch(var(--primary))" }}
                  />
                </div>
                <p className="font-display font-semibold text-foreground mb-1">
                  Hacked Power
                </p>
                <p className="text-sm text-muted-foreground">
                  Employee select karein chat shuru karne ke liye
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmployeeRow({
  employeeId,
  profile,
  index,
  isSelected,
  onSelect,
}: {
  employeeId: bigint;
  profile: ExtendedEmployeeProfile;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const setStatus = useSetEmployeeActiveStatus();

  const handleToggle = async (checked: boolean) => {
    try {
      await setStatus.mutateAsync({ employeeId, isActive: checked });
      toast.success(
        `${profile.name} ko ${checked ? "activate" : "deactivate"} kar diya`,
      );
    } catch {
      toast.error("Status update fail ho gaya");
    }
  };

  const handleCall = () => {
    if (profile.phone) {
      window.location.href = `tel:${profile.phone}`;
    } else {
      toast.error("Is employee ka phone number nahi hai");
    }
  };

  const initials = profile.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const avatarColor = getAvatarColor(profile.name);

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-3 border-b border-border/50 transition-colors hover:bg-secondary/60",
        isSelected && "bg-secondary",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex items-center gap-3 flex-1 text-left min-w-0 cursor-pointer"
      >
        <Avatar className="w-12 h-12 flex-shrink-0">
          <AvatarFallback
            className="text-white text-sm font-bold"
            style={{ backgroundColor: avatarColor }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm text-foreground truncate">
              {profile.name}
            </p>
            <Badge
              className="text-[9px] px-1.5 py-0 ml-2 flex-shrink-0 h-4 rounded-sm"
              style={{
                backgroundColor: profile.isActive
                  ? "oklch(var(--primary) / 0.15)"
                  : "oklch(var(--muted))",
                color: profile.isActive
                  ? "oklch(var(--primary))"
                  : "oklch(var(--muted-foreground))",
                border: "none",
              }}
            >
              {profile.isActive ? "Active" : "Pending"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {profile.jobTitle}
          </p>
          <p
            className="text-xs"
            style={{ color: "oklch(var(--muted-foreground) / 0.7)" }}
          >
            {profile.department}
          </p>
        </div>
      </button>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <CredentialsDialog
          employeeId={employeeId}
          name={profile.name}
          index={index}
        />
        {/* Message button */}
        <button
          type="button"
          data-ocid="admin.employee.primary_button"
          title="Message karein"
          onClick={onSelect}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
          style={{
            backgroundColor: "oklch(var(--primary) / 0.12)",
            color: "oklch(var(--primary))",
          }}
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </button>
        {/* Call button */}
        <button
          type="button"
          data-ocid="admin.employee.secondary_button"
          title="Call karein"
          onClick={handleCall}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
          style={{
            backgroundColor: "oklch(var(--primary) / 0.12)",
            color: "oklch(var(--primary))",
          }}
        >
          <Phone className="w-3.5 h-3.5" />
        </button>
        <Switch
          data-ocid={`admin.switch.${index}`}
          checked={profile.isActive}
          onCheckedChange={handleToggle}
          disabled={setStatus.isPending}
        />
      </div>
    </div>
  );
}

function AdminChat({
  employee,
  onBack,
}: { employee: [bigint, ExtendedEmployeeProfile]; onBack: () => void }) {
  const [employeeId, profile] = employee;
  const { data: messages, isLoading } = useAdminMessages(employeeId);
  const sendMsg = useSendMessageToEmployee();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const msgCount = messages?.length ?? 0;

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message count change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgCount]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content) return;
    setInput("");
    try {
      await sendMsg.mutateAsync({ toId: employeeId, content });
    } catch {
      toast.error("Message send nahi ho saka.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCallFromHeader = () => {
    if (profile.phone) {
      window.location.href = `tel:${profile.phone}`;
    } else {
      toast.error("Phone number nahi hai");
    }
  };

  const initials = profile.name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const avatarColor = getAvatarColor(profile.name);

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="wa-header px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
        <button
          type="button"
          className="md:hidden mr-1 text-white/80 hover:text-white"
          onClick={onBack}
          data-ocid="admin.secondary_button"
        >
          ←
        </button>
        <Avatar className="w-10 h-10">
          <AvatarFallback
            className="text-white text-sm font-bold"
            style={{ backgroundColor: avatarColor }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm leading-tight truncate">
            {profile.name}
          </p>
          <p className="text-white/70 text-xs truncate">
            {profile.jobTitle} · {profile.department}
          </p>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: profile.isActive
              ? "oklch(var(--primary) / 0.25)"
              : "oklch(1 0 0 / 0.12)",
            color: profile.isActive
              ? "oklch(var(--primary))"
              : "oklch(1 0 0 / 0.6)",
          }}
        >
          {profile.isActive ? "● Active" : "● Pending"}
        </span>
        {/* Call button in chat header */}
        <button
          type="button"
          data-ocid="adminchat.secondary_button"
          title="Call karein"
          onClick={handleCallFromHeader}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/20 text-white"
        >
          <Phone className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 wa-chat-bg">
          <div className="p-4 min-h-full">
            {isLoading ? (
              <div className="space-y-4" data-ocid="adminchat.loading_state">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex",
                      i % 2 === 0 ? "justify-end" : "justify-start",
                    )}
                  >
                    <Skeleton className="h-10 w-48 rounded-2xl" />
                  </div>
                ))}
              </div>
            ) : !messages || messages.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-20 text-center"
                data-ocid="adminchat.empty_state"
              >
                <div className="bg-white/90 rounded-2xl px-6 py-4 shadow-bubble">
                  <p className="text-sm text-muted-foreground">
                    🔒 Messages end-to-end encrypted hain
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {profile.name} ke saath koi message nahi
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <AnimatePresence initial={false}>
                  {(messages as Message[]).map((msg, i) => {
                    const isAdmin = msg.senderRole === MessageRole.admin;
                    return (
                      <motion.div
                        key={`msg-${String(msg.timestamp)}-${i}`}
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={cn(
                          "flex",
                          isAdmin ? "justify-end" : "justify-start",
                        )}
                        data-ocid={`adminchat.item.${i + 1}`}
                      >
                        <div
                          className={cn(
                            "max-w-[65%] px-3 py-2 text-sm relative",
                            isAdmin
                              ? "bubble-sent rounded-tl-2xl rounded-bl-2xl rounded-br-2xl rounded-tr-sm"
                              : "bubble-received rounded-tr-2xl rounded-br-2xl rounded-bl-2xl rounded-tl-sm",
                          )}
                        >
                          <p className="leading-relaxed">{msg.content}</p>
                          <p
                            className="text-[10px] mt-0.5 text-right"
                            style={{
                              color: isAdmin
                                ? "oklch(var(--sent-bubble-fg) / 0.6)"
                                : "oklch(var(--muted-foreground))",
                            }}
                          >
                            {new Date(
                              Number(msg.timestamp) / 1_000_000,
                            ).toLocaleTimeString("ur-PK", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {isAdmin && " ✓✓"}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="bg-secondary/60 px-3 py-3 flex items-center gap-2">
          <Input
            data-ocid="adminchat.input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`${profile.name} ko reply karein...`}
            className="flex-1 bg-white border-0 rounded-full h-10 px-4 text-sm shadow-xs focus-visible:ring-1"
          />
          <button
            type="button"
            data-ocid="adminchat.primary_button"
            onClick={handleSend}
            disabled={sendMsg.isPending || !input.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-50"
            style={{ backgroundColor: "oklch(var(--primary))" }}
          >
            {sendMsg.isPending ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
