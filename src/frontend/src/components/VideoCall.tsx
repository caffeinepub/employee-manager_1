import { cn } from "@/lib/utils";
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Video } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { RefObject } from "react";
import type { CallState } from "../hooks/useVideoCall";

interface VideoCallProps {
  callState: CallState;
  callerName: string;
  isMuted: boolean;
  isCameraOff: boolean;
  localVideoRef: RefObject<HTMLVideoElement | null>;
  remoteVideoRef: RefObject<HTMLVideoElement | null>;
  onMuteToggle: () => void;
  onCameraToggle: () => void;
  onEndCall: () => void;
  onAccept: () => void;
  onDecline: () => void;
}

export default function VideoCall({
  callState,
  callerName,
  isMuted,
  isCameraOff,
  localVideoRef,
  remoteVideoRef,
  onMuteToggle,
  onCameraToggle,
  onEndCall,
  onAccept,
  onDecline,
}: VideoCallProps) {
  const isVisible =
    callState === "calling" ||
    callState === "ringing" ||
    callState === "connected";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="videocall-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-ocid="videocall.modal"
          className="fixed inset-0 z-50 bg-black flex flex-col"
        >
          {/* Remote video (full screen) */}
          {/* biome-ignore lint/a11y/useMediaCaption: WebRTC live call video */}
          <video
            ref={remoteVideoRef as RefObject<HTMLVideoElement>}
            autoPlay
            playsInline
            className={cn(
              "absolute inset-0 w-full h-full object-cover",
              callState !== "connected" && "opacity-0",
            )}
          />

          {/* Dark overlay when not connected */}
          {callState !== "connected" && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black/95" />
          )}

          {/* Caller info & status */}
          <div className="relative z-10 flex flex-col items-center justify-center flex-1 gap-4 pb-32">
            {/* Avatar ring */}
            <div className="relative">
              {callState === "ringing" && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-green-400"
                    animate={{ scale: [1, 1.5, 1.5], opacity: [0.7, 0, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-green-400"
                    animate={{ scale: [1, 1.8, 1.8], opacity: [0.5, 0, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: 0.3,
                    }}
                  />
                </>
              )}
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white"
                style={{ backgroundColor: "oklch(0.40 0.15 170)" }}
              >
                {callerName ? (
                  callerName
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                ) : (
                  <Video className="w-10 h-10" />
                )}
              </div>
            </div>

            <div className="text-center">
              <p className="text-white text-xl font-semibold font-display">
                {callerName || "Video Call"}
              </p>
              <p className="text-white/60 text-sm mt-1">
                {callState === "calling" && "Calling..."}
                {callState === "ringing" && "Incoming Call..."}
                {callState === "connected" && "Connected"}
              </p>
            </div>
          </div>

          {/* Local video (picture-in-picture) */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute bottom-28 right-4 w-28 h-40 rounded-xl overflow-hidden border-2 border-white/30 shadow-xl z-20"
          >
            {/* biome-ignore lint/a11y/useMediaCaption: local camera preview */}
            <video
              ref={localVideoRef as RefObject<HTMLVideoElement>}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            {isCameraOff && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <CameraOff className="w-8 h-8 text-white/50" />
              </div>
            )}
          </motion.div>

          {/* Controls */}
          <div className="relative z-10 flex items-center justify-center gap-6 pb-10">
            {/* Mute */}
            <button
              type="button"
              data-ocid="videocall.mute_toggle"
              onClick={onMuteToggle}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                isMuted
                  ? "bg-white/30 text-white"
                  : "bg-white/20 text-white hover:bg-white/30",
              )}
            >
              {isMuted ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>

            {/* End Call */}
            <button
              type="button"
              data-ocid="videocall.end_button"
              onClick={onEndCall}
              className="w-16 h-16 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg"
            >
              <PhoneOff className="w-7 h-7" />
            </button>

            {/* Camera toggle */}
            <button
              type="button"
              data-ocid="videocall.camera_toggle"
              onClick={onCameraToggle}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                isCameraOff
                  ? "bg-white/30 text-white"
                  : "bg-white/20 text-white hover:bg-white/30",
              )}
            >
              {isCameraOff ? (
                <CameraOff className="w-6 h-6" />
              ) : (
                <Camera className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Incoming call overlay */}
          {callState === "ringing" && (
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/90 to-transparent px-8 pb-12 pt-8 flex items-center justify-center gap-8"
            >
              {/* Decline */}
              <button
                type="button"
                data-ocid="videocall.decline_button"
                onClick={onDecline}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all shadow-lg">
                  <PhoneOff className="w-7 h-7" />
                </div>
                <span className="text-white/80 text-sm">Decline</span>
              </button>

              {/* Accept */}
              <button
                type="button"
                data-ocid="videocall.accept_button"
                onClick={onAccept}
                className="flex flex-col items-center gap-2"
              >
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{
                    duration: 0.8,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                  className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-lg"
                >
                  <Video className="w-7 h-7" />
                </motion.div>
                <span className="text-white/80 text-sm">Accept</span>
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
