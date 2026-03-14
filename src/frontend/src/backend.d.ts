import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Message {
    content: string;
    timestamp: bigint;
    senderRole: MessageRole;
}
export interface UserProfile {
    name: string;
    email: string;
}
export interface ExtendedEmployeeProfile {
    name: string;
    isActive: boolean;
    loginId: string;
    jobTitle: string;
    phone: string;
    department: string;
    linkedPrincipal?: Principal;
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
    adminCreateEmployee(name: string, phone: string, jobTitle: string, department: string, loginId: string, password: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    employeeLoginWithCredentials(loginId: string, password: string): Promise<ExtendedEmployeeProfile>;
    getAllEmployees(): Promise<Array<[bigint, ExtendedEmployeeProfile]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getEmployeeCredentials(employeeId: bigint): Promise<[string, string]>;
    getMessagesForAdmin(employeeId: bigint): Promise<Array<Message>>;
    getMessagesForEmployee(): Promise<Array<Message>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(toEmployeeId: bigint, content: string): Promise<void>;
    sendMessageToAdmin(content: string): Promise<void>;
    setEmployeeActiveStatus(employeeId: bigint, isActive: boolean): Promise<void>;
}
