import { useCallback, useEffect, useRef, useState } from "react";
import type { CallSignal } from "../backend.d";
import { useActor } from "./useActor";

export type CallState = "idle" | "calling" | "ringing" | "connected" | "ended";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

export interface UseVideoCallOptions {
  role: "admin" | "employee";
  employeeId?: bigint;
}

async function getLocalStream(
  localVideoRef: React.RefObject<HTMLVideoElement | null>,
  localStreamRef: React.MutableRefObject<MediaStream | null>,
): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  localStreamRef.current = stream;
  if (localVideoRef.current) {
    localVideoRef.current.srcObject = stream;
  }
  return stream;
}

async function applyIceCandidates(
  pc: RTCPeerConnection,
  candidates: string[],
): Promise<void> {
  for (const c of candidates) {
    try {
      await pc.addIceCandidate(
        new RTCIceCandidate(JSON.parse(c) as RTCIceCandidateInit),
      );
    } catch {
      // ignore duplicates
    }
  }
}

export function useVideoCall({ role, employeeId }: UseVideoCallOptions) {
  const { actor } = useActor();
  const [callState, setCallState] = useState<CallState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callerName, setCallerName] = useState("");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sentCandidatesRef = useRef<Set<string>>(new Set());
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const incomingOfferRef = useRef("");
  const incomingEmpIdRef = useRef<bigint | undefined>(undefined);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    stopPolling();
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      for (const t of localStreamRef.current.getTracks()) t.stop();
      localStreamRef.current = null;
    }
    sentCandidatesRef.current.clear();
    setCallState("idle");
    setIsMuted(false);
    setIsCameraOff(false);
  }, [stopPolling]);

  const createPeerConnection = useCallback(
    (onIceCandidate: (candidate: string) => void) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          const str = JSON.stringify(candidate);
          if (!sentCandidatesRef.current.has(str)) {
            sentCandidatesRef.current.add(str);
            onIceCandidate(str);
          }
        }
      };

      pc.ontrack = ({ streams }) => {
        if (streams[0] && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = streams[0];
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setCallState("connected");
        } else if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected" ||
          pc.connectionState === "closed"
        ) {
          cleanup();
        }
      };

      return pc;
    },
    [cleanup],
  );

  // Admin: initiate call
  const startCall = useCallback(
    async (targetEmployeeId: bigint, targetName: string) => {
      if (!actor) return;
      try {
        const stream = await getLocalStream(localVideoRef, localStreamRef);
        setCallState("calling");
        setCallerName(targetName);

        const pc = createPeerConnection(async (candidate) => {
          await actor.addIceCandidateAdmin(targetEmployeeId, candidate);
        });
        pcRef.current = pc;

        for (const track of stream.getTracks()) {
          pc.addTrack(track, stream);
        }

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await actor.initiateVideoCall(targetEmployeeId, JSON.stringify(offer));

        pollingRef.current = setInterval(async () => {
          try {
            const signal = await actor.getCallSignalForAdmin(targetEmployeeId);
            if (!signal) return;

            const s = signal as CallSignal;
            if (s.status === "ended") {
              cleanup();
              return;
            }

            if (s.answer && pc.signalingState === "have-local-offer") {
              const answer = JSON.parse(s.answer) as RTCSessionDescriptionInit;
              await pc.setRemoteDescription(new RTCSessionDescription(answer));
              setCallState("connected");
            }

            await applyIceCandidates(pc, s.iceCandidates);
          } catch {
            // polling errors are non-fatal
          }
        }, 2000);
      } catch (err) {
        cleanup();
        throw err;
      }
    },
    [actor, createPeerConnection, cleanup],
  );

  // Employee: initiate call to admin
  const startCallAsEmployee = useCallback(async () => {
    if (!actor) return;
    try {
      const stream = await getLocalStream(localVideoRef, localStreamRef);
      setCallState("calling");

      const pc = createPeerConnection(async (candidate) => {
        await actor.addIceCandidateEmployee(candidate);
      });
      pcRef.current = pc;

      for (const track of stream.getTracks()) {
        pc.addTrack(track, stream);
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await actor.employeeInitiateVideoCall(JSON.stringify(offer));

      pollingRef.current = setInterval(async () => {
        try {
          const signal = await actor.getCallSignalForEmployee();
          if (!signal) return;

          const s = signal as CallSignal;
          if (s.status === "ended") {
            cleanup();
            return;
          }

          if (s.answer && pc.signalingState === "have-local-offer") {
            const answer = JSON.parse(s.answer) as RTCSessionDescriptionInit;
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            setCallState("connected");
          }

          await applyIceCandidates(pc, s.iceCandidates);
        } catch {
          // non-fatal
        }
      }, 2000);
    } catch (err) {
      cleanup();
      throw err;
    }
  }, [actor, createPeerConnection, cleanup]);

  // Accept incoming call
  const acceptCall = useCallback(
    async (offerJson: string, fromEmployeeId?: bigint) => {
      if (!actor) return;
      try {
        const stream = await getLocalStream(localVideoRef, localStreamRef);
        setCallState("connected");

        const pc = createPeerConnection(async (candidate) => {
          if (role === "admin" && fromEmployeeId != null) {
            await actor.addIceCandidateAdmin(fromEmployeeId, candidate);
          } else {
            await actor.addIceCandidateEmployee(candidate);
          }
        });
        pcRef.current = pc;

        for (const track of stream.getTracks()) {
          pc.addTrack(track, stream);
        }

        const offer = JSON.parse(offerJson) as RTCSessionDescriptionInit;
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await actor.answerVideoCall(JSON.stringify(answer));

        pollingRef.current = setInterval(async () => {
          try {
            const raw =
              role === "admin" && fromEmployeeId != null
                ? await actor.getCallSignalForAdmin(fromEmployeeId)
                : await actor.getCallSignalForEmployee();

            if (!raw) return;
            const s = raw as CallSignal;
            if (s.status === "ended") {
              cleanup();
              return;
            }
            await applyIceCandidates(pc, s.iceCandidates);
          } catch {
            // non-fatal
          }
        }, 2000);
      } catch (err) {
        cleanup();
        throw err;
      }
    },
    [actor, role, createPeerConnection, cleanup],
  );

  const declineCall = useCallback(async () => {
    if (!actor) return;
    if (role === "admin" && employeeId != null) {
      await actor.endCallAdmin(employeeId);
    } else {
      await actor.endCallEmployee();
    }
    cleanup();
  }, [actor, role, employeeId, cleanup]);

  const endCall = useCallback(async () => {
    if (!actor) return;
    if (role === "admin" && employeeId != null) {
      await actor.endCallAdmin(employeeId);
    } else {
      await actor.endCallEmployee();
    }
    cleanup();
  }, [actor, role, employeeId, cleanup]);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    const enabled = !isMuted;
    for (const track of localStreamRef.current.getAudioTracks()) {
      track.enabled = !enabled;
    }
    setIsMuted(enabled);
  }, [isMuted]);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    const off = !isCameraOff;
    for (const track of localStreamRef.current.getVideoTracks()) {
      track.enabled = !off;
    }
    setIsCameraOff(off);
  }, [isCameraOff]);

  // Poll for incoming calls
  useEffect(() => {
    if (!actor || callState !== "idle") return;

    const poll = setInterval(async () => {
      try {
        let raw: CallSignal | null = null;
        if (role === "admin" && employeeId != null) {
          raw = (await actor.getCallSignalForAdmin(
            employeeId,
          )) as CallSignal | null;
        } else if (role === "employee") {
          raw = (await actor.getCallSignalForEmployee()) as CallSignal | null;
        }

        if (raw?.status === "calling" && raw.offer) {
          incomingOfferRef.current = raw.offer;
          incomingEmpIdRef.current = employeeId;
          setCallerName(role === "employee" ? "Admin" : "");
          setCallState("ringing");
        }
      } catch {
        // non-fatal
      }
    }, 2000);

    return () => clearInterval(poll);
  }, [actor, callState, role, employeeId]);

  const handleAccept = useCallback(async () => {
    await acceptCall(incomingOfferRef.current, incomingEmpIdRef.current);
  }, [acceptCall]);

  return {
    callState,
    isMuted,
    isCameraOff,
    callerName,
    localVideoRef,
    remoteVideoRef,
    startCall,
    startCallAsEmployee,
    handleAccept,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera,
    cleanup,
  };
}
