import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Send, Shield } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MessageRole } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useEmployeeMessages,
  useSendMessageToAdmin,
} from "../hooks/useQueries";

export default function EmployeeChat() {
  const { identity, clear } = useInternetIdentity();
  const { data: messages, isLoading } = useEmployeeMessages();
  const sendMsg = useSendMessageToAdmin();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const msgCount = messages?.length ?? 0;

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when message count changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgCount]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content) return;
    setInput("");
    try {
      await sendMsg.mutateAsync(content);
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

  const principalStr = identity?.getPrincipal().toString() ?? "";
  const shortId = principalStr.slice(0, 5).toUpperCase();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* WhatsApp-style header */}
      <div className="wa-header px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
        <Avatar className="w-10 h-10">
          <AvatarFallback
            className="text-sm font-bold"
            style={{
              backgroundColor: "oklch(0.52 0.11 178)",
              color: "white",
            }}
          >
            AD
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-white text-sm leading-tight">
            Hacked Power
          </p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-white/70 text-xs">Admin Online</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ backgroundColor: "oklch(1 0 0 / 0.12)" }}
          >
            <Shield className="w-3 h-3 text-white/80" />
            <span className="text-white/80 text-xs font-medium">{shortId}</span>
          </div>
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

      {/* Chat content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 wa-chat-bg">
          <div className="p-4 min-h-full">
            {isLoading ? (
              <div className="space-y-4" data-ocid="chat.loading_state">
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
            ) : messages?.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                data-ocid="chat.empty_state"
                className="flex flex-col items-center justify-center h-full py-20 text-center"
              >
                <div className="bg-white/90 rounded-2xl px-6 py-5 shadow-bubble">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: "oklch(var(--primary) / 0.12)" }}
                  >
                    <Send
                      className="w-7 h-7"
                      style={{ color: "oklch(var(--primary))" }}
                    />
                  </div>
                  <p className="font-semibold text-foreground text-sm mb-1">
                    Koi message nahi
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Admin ko pehla message karein
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-1.5">
                <AnimatePresence initial={false}>
                  {messages?.map((msg, i) => {
                    const isEmployee = msg.senderRole === MessageRole.employee;
                    return (
                      <motion.div
                        key={`msg-${String(msg.timestamp)}-${i}`}
                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={cn(
                          "flex",
                          isEmployee ? "justify-end" : "justify-start",
                        )}
                        data-ocid={`chat.item.${i + 1}`}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] px-3 py-2 text-sm relative",
                            isEmployee
                              ? "bubble-sent rounded-tl-2xl rounded-bl-2xl rounded-br-2xl rounded-tr-sm"
                              : "bubble-received rounded-tr-2xl rounded-br-2xl rounded-bl-2xl rounded-tl-sm",
                          )}
                        >
                          <p className="leading-relaxed">{msg.content}</p>
                          <p
                            className="text-[10px] mt-0.5 text-right"
                            style={{
                              color: isEmployee
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
                            {isEmployee && " ✓✓"}
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

        {/* Input bar */}
        <div className="bg-secondary/60 px-3 py-3 flex items-center gap-2">
          <input
            data-ocid="chat.textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message karein... (Enter bhejne ke liye)"
            className="flex-1 bg-white border-0 rounded-full h-10 px-4 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            data-ocid="chat.primary_button"
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
