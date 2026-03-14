import Map "mo:core/Map";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";

module {
  public type EmployeeProfile = {
    name : Text;
    phone : Text;
    jobTitle : Text;
    department : Text;
    isActive : Bool;
  };

  public type ExtendedEmployeeProfile = {
    name : Text;
    phone : Text;
    jobTitle : Text;
    department : Text;
    isActive : Bool;
    loginId : Text;
    linkedPrincipal : ?Principal;
  };

  public type EmployeeCredentials = {
    loginId : Text;
    password : Text;
    linkedPrincipal : ?Principal;
  };

  public type Message = {
    senderRole : MessageRole;
    content : Text;
    timestamp : Int;
  };

  public type MessageRole = {
    #admin;
    #employee;
  };

  public type UserProfile = {
    name : Text;
    email : Text;
  };

  public type CallStatus = {
    #idle;
    #calling;
    #connected;
    #ended;
  };

  public type CallSignal = {
    offer : ?Text;
    answer : ?Text;
    iceCandidates : [Text];
    status : CallStatus;
  };

  public type Result = {
    #ok;
    #err : Text;
  };

  public type OldActor = {
    employeeIdCounter : Nat;
    employeeProfiles : Map.Map<Nat, EmployeeProfile>;
    employeeCredentials : Map.Map<Nat, EmployeeCredentials>;
    employeeMessages : Map.Map<Nat, List.List<Message>>;
    loginIdIndex : Map.Map<Text, Nat>;
    principalToEmployeeId : Map.Map<Principal, Nat>;
    userProfiles : Map.Map<Principal, UserProfile>;
    accessControlState : AccessControl.AccessControlState;
  };

  public type NewActor = {
    employeeIdCounter : Nat;
    employeeProfiles : Map.Map<Nat, EmployeeProfile>;
    employeeCredentials : Map.Map<Nat, EmployeeCredentials>;
    employeeMessages : Map.Map<Nat, List.List<Message>>;
    loginIdIndex : Map.Map<Text, Nat>;
    principalToEmployeeId : Map.Map<Principal, Nat>;
    userProfiles : Map.Map<Principal, UserProfile>;
    videoSignals : Map.Map<Nat, CallSignal>;
    adminVideoSignals : Map.Map<Nat, CallSignal>;
    accessControlState : AccessControl.AccessControlState;
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      videoSignals = Map.empty<Nat, CallSignal>();
      adminVideoSignals = Map.empty<Nat, CallSignal>();
    };
  };
};
