# Hacked Power

## Current State
Employee management app with WhatsApp-style chat between admin and employees. Admin panel has phone call (tel: link) button in employee list and chat header. EmployeeChat has no call options. No video call feature exists.

## Requested Changes (Diff)

### Add
- Video call feature using WebRTC with backend-based signaling (polling)
- `VideoCall` component: fullscreen overlay with local/remote video, mute/camera toggle, end call button
- Video call button (camera icon) in AdminPanel chat header (next to existing phone button)
- Video call button in EmployeeChat header (next to logout)
- Backend signaling endpoints: store/retrieve WebRTC offer, answer, and ICE candidates per employee-admin pair
- Incoming call notification UI (ring animation with accept/decline)

### Modify
- AdminPanel: Add video call button in `AdminChat` header; wire it to VideoCall component
- EmployeeChat: Add video call button in header; wire it to VideoCall component
- Backend: Add signaling functions for WebRTC session management

### Remove
- Nothing removed

## Implementation Plan
1. Add backend signaling: `initiateVideoCall`, `answerVideoCall`, `addIceCandidate`, `getCallSignal`, `endVideoCall` functions
2. Create `VideoCall.tsx` component with WebRTC logic, local/remote video streams, mute/camera toggles, end call
3. Create `useVideoCall` hook for WebRTC state management and polling
4. Add Video call button (Video icon) to AdminChat header
5. Add Video call button to EmployeeChat header
6. Incoming call ring UI with accept/decline for both roles
