import { Button } from "@/components/ui/button";
import { Clock, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function PendingApproval() {
  const { clear } = useInternetIdentity();

  return (
    <div className="min-h-screen flex flex-col">
      {/* WhatsApp-style header */}
      <div className="wa-header px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "oklch(1 0 0 / 0.15)" }}
          >
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm">
              Hacked Power
            </p>
            <p className="text-white/70 text-xs">Account Review</p>
          </div>
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

      {/* WhatsApp chat background */}
      <main className="flex-1 wa-chat-bg flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-sm w-full"
          data-ocid="pending.panel"
        >
          {/* Main card */}
          <div className="bg-white rounded-2xl shadow-bubble p-8">
            <div className="relative inline-flex items-center justify-center mb-6">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 2.5,
                  ease: "easeInOut",
                }}
                className="w-20 h-20 rounded-full"
                style={{ backgroundColor: "oklch(var(--primary) / 0.12)" }}
              />
              <div
                className="absolute w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "oklch(var(--primary))" }}
              >
                <Clock className="w-7 h-7 text-white" />
              </div>
            </div>

            <h1 className="text-xl font-display font-bold text-foreground mb-2">
              Account Review Mein Hai
            </h1>

            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Aapka account admin ke paas review ke liye hai. Approve hone ke
              baad aap chat kar saken ge.
            </p>

            {/* Status indicator */}
            <div
              className="rounded-xl p-4 mb-6 text-left"
              style={{ backgroundColor: "oklch(var(--primary) / 0.08)" }}
            >
              <div className="flex items-center gap-3">
                <RefreshCw
                  className="w-4 h-4 animate-spin flex-shrink-0"
                  style={{ color: "oklch(var(--primary))" }}
                />
                <p
                  className="text-sm"
                  style={{ color: "oklch(var(--primary))" }}
                >
                  Yeh page automatically refresh hota rahega
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => clear()}
              data-ocid="pending.button"
              className="rounded-full border-border/60 text-muted-foreground hover:text-foreground"
            >
              Logout
            </Button>
          </div>

          <p className="text-xs text-muted-foreground/70 mt-4">
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
              style={{ color: "oklch(var(--primary))" }}
            >
              caffeine.ai
            </a>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
