import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Panel - Dark Green WhatsApp style */}
      <div className="wa-header flex flex-col items-center justify-center p-10 md:w-1/2 min-h-[220px] md:min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* WhatsApp-style logo icon */}
          <div className="w-24 h-24 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-6 shadow-glow">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              className="w-14 h-14"
              role="img"
              aria-label="Hacked Power logo"
            >
              <circle cx="24" cy="24" r="24" fill="white" fillOpacity="0.12" />
              <path
                d="M24 8C15.163 8 8 15.163 8 24c0 2.8.734 5.434 2.018 7.713L8 40l8.582-2.006A15.917 15.917 0 0024 40c8.837 0 16-7.163 16-16S32.837 8 24 8z"
                fill="white"
                fillOpacity="0.9"
              />
              <path
                d="M19.5 17.5c-.4-1-.8-.95-1.1-.97-.28-.02-.6-.02-.92-.02-.32 0-.84.12-1.28.6-.44.48-1.68 1.64-1.68 4s1.72 4.64 1.96 4.96c.24.32 3.36 5.32 8.24 7.24 4.08 1.6 4.92 1.28 5.8 1.2.88-.08 2.84-1.16 3.24-2.28.4-1.12.4-2.08.28-2.28-.12-.2-.44-.32-.92-.56-.48-.24-2.84-1.4-3.28-1.56-.44-.16-.76-.24-1.08.24-.32.48-1.24 1.56-1.52 1.88-.28.32-.56.36-1.04.12-.48-.24-2.02-.74-3.86-2.36-1.42-1.26-2.38-2.82-2.66-3.3-.28-.48-.03-.74.21-.98.22-.22.48-.56.72-.84.24-.28.32-.48.48-.8.16-.32.08-.6-.04-.84-.12-.24-1.04-2.54-1.45-3.48z"
                fill="oklch(0.35 0.08 178)"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-2 tracking-tight">
            Hacked Power
          </h1>
          <p className="text-white/70 text-base max-w-xs">
            Employee management aur secure chat platform
          </p>

          <div className="mt-10 space-y-3 text-left max-w-xs mx-auto">
            {[
              "Employees ko manage karein",
              "Real-time chat karein",
              "Accounts activate karein",
            ].map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                <span className="text-white/80 text-sm">{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel - White login panel */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-sm text-center"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              Khush Amdeed!
            </h2>
            <p className="text-muted-foreground text-sm">
              Login karein ya employee ki taraf se register karein
            </p>
          </div>

          {/* Login Options Box */}
          <div className="border border-border rounded-2xl p-6 mb-6 text-left space-y-4 bg-background">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "oklch(var(--wa-header))" }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="white"
                  className="w-5 h-5"
                  role="img"
                  aria-label="Admin"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">
                  Admin Login
                </p>
                <p className="text-xs text-muted-foreground">
                  Employee accounts manage karein
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="oklch(0.76 0.22 155)"
                  strokeWidth="2"
                  className="w-5 h-5"
                  role="img"
                  aria-label="Employee"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">
                  Employee Login / Register
                </p>
                <p className="text-xs text-muted-foreground">
                  Chat aur profile access karein
                </p>
              </div>
            </div>
          </div>

          <Button
            data-ocid="login.primary_button"
            onClick={() => login()}
            disabled={isLoggingIn}
            className="w-full h-12 text-base font-semibold rounded-full"
            style={{
              backgroundColor: "oklch(var(--primary))",
              color: "white",
            }}
            size="lg"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Logging in...
              </>
            ) : (
              "Login / Sign Up karein"
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Internet Identity se secure login — koi password nahi
          </p>
        </motion.div>

        <footer className="mt-auto pt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}
