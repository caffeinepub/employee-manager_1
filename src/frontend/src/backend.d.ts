import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Result = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: string;
};
export interface ExtendedEmployeeProfile {
    name: string;
    isActive: boolean;
    loginId: string;
    jobTitle: string;
    phone: string;
    department: string;
    linkedPrincipal?: Principal;
}
export interface Message {
    content: string;
    timestamp: bigint;
    senderRole: MessageRole;
}
export interface CallSignal {
    status: CallStatus;
    offer?: string;
    answer?: string;
    iceCandidates: Array<string>;
}
export interface UserProfile {
    name: string;
    email: string;
}
export enum CallStatus {
    idle = "idle",
    calling = "calling",
    ended = "ended",
    connected = "connected"
}
export enum MessageRole {
    admin = "admin",
    employee = "employee"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addIceCandidateAdmin(toEmployeeId: bigint, candidate: string): Promise<void>;
    addIceCandidateEmployee(candidate: string): Promise<void>;
    adminCreateEmployee(name: string, phone: string, jobTitle: string, department: string, loginId: string, password: string): Promise<bigint>;
    answerVideoCall(sdpAnswer: string): Promise<Result>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    employeeInitiateVideoCall(sdpOffer: string): Promise<Result>;
    employeeLoginWithCredentials(loginId: string, password: string): Promise<ExtendedEmployeeProfile>;
    endCallAdmin(employeeId: bigint): Promise<void>;
    endCallEmployee(): Promise<void>;
    getAllEmployees(): Promise<Array<[bigint, ExtendedEmployeeProfile]>>;
    getCallSignalForAdmin(employeeId: bigint): Promise<CallSignal | null>;
    getCallSignalForEmployee(): Promise<CallSignal | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getEmployeeCredentials(employeeId: bigint): Promise<[string, string]>;
    getMessagesForAdmin(employeeId: bigint): Promise<Array<Message>>;
    getMessagesForEmployee(): Promise<Array<Message>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initiateVideoCall(toEmployeeId: bigint, sdpOffer: string): Promise<Result>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(toEmployeeId: bigint, content: string): Promise<void>;
    sendMessageToAdmin(content: string): Promise<void>;
    setEmployeeActiveStatus(employeeId: bigint, isActive: boolean): Promise<void>;
}
