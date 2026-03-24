# Hacked Power

## Current State
Employee management app with WhatsApp-style chat. Admin creates employees, both sides chat. Video call feature exists. Data is NOT persisted -- all variables use non-stable storage, so all employees/messages are lost on canister restart/upgrade.

## Requested Changes (Diff)

### Add
- Stable storage for all data (employeeIdCounter, employeeProfiles, employeeCredentials, employeeMessages, loginIdIndex, principalToEmployeeId, userProfiles, videoSignals, adminVideoSignals)

### Modify
- Convert all mutable maps and counter to stable variables so data persists across restarts and upgrades

### Remove
- Nothing

## Implementation Plan
1. Regenerate Motoko backend with all data declared as `stable var` using stable-compatible types (arrays/tuples for maps, stable var counter)
2. Use preupgrade/postupgrade hooks to serialize/deserialize map data
