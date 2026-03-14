import Time "mo:core/Time";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Option "mo:core/Option";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";


actor {
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

  var employeeIdCounter = 0;

  let employeeProfiles = Map.empty<Nat, EmployeeProfile>();
  let employeeCredentials = Map.empty<Nat, EmployeeCredentials>();
  let employeeMessages = Map.empty<Nat, List.List<Message>>();
  let loginIdIndex = Map.empty<Text, Nat>();
  let principalToEmployeeId = Map.empty<Principal, Nat>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let accessControlState = AccessControl.initState();

  include MixinAuthorization(accessControlState);

  public shared ({ caller }) func adminCreateEmployee(
    name : Text,
    phone : Text,
    jobTitle : Text,
    department : Text,
    loginId : Text,
    password : Text,
  ) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create employee accounts");
    };

    if (loginIdIndex.containsKey(loginId)) {
      Runtime.trap("Login ID already exists. Please choose another login ID");
    };

    let employeeId = employeeIdCounter;
    employeeIdCounter += 1;

    let profile : EmployeeProfile = {
      name;
      phone;
      jobTitle;
      department;
      isActive = true;
    };

    let creds : EmployeeCredentials = {
      loginId;
      password;
      linkedPrincipal = null;
    };

    employeeProfiles.add(employeeId, profile);
    employeeCredentials.add(employeeId, creds);
    employeeMessages.add(employeeId, List.empty<Message>());
    loginIdIndex.add(loginId, employeeId);

    employeeId;
  };

  public shared ({ caller }) func employeeLoginWithCredentials(
    loginId : Text,
    password : Text,
  ) : async ExtendedEmployeeProfile {
    let employeeId = switch (loginIdIndex.get(loginId)) {
      case (null) { Runtime.trap("Login ID not found") };
      case (?id) { id };
    };

    let credentials = switch (employeeCredentials.get(employeeId)) {
      case (null) { Runtime.trap("Credentials not found") };
      case (?creds) { creds };
    };

    if (password != credentials.password) {
      Runtime.trap("Invalid password");
    };

    let _oldLinkedPrincipal = credentials.linkedPrincipal;
    let updatedCreds : EmployeeCredentials = { credentials with linkedPrincipal = ?caller };
    employeeCredentials.add(employeeId, updatedCreds);

    principalToEmployeeId.add(caller, employeeId);
    AccessControl.assignRole(accessControlState, caller, caller, #user);

    switch (employeeProfiles.get(employeeId)) {
      case (null) { Runtime.trap("Employee profile not found") };
      case (?profile) {
        let extendedProfile : ExtendedEmployeeProfile = {
          profile with loginId;
          linkedPrincipal = ?caller;
        };
        return extendedProfile;
      };
    };
  };

  public query ({ caller }) func getAllEmployees() : async [(Nat, ExtendedEmployeeProfile)] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all employees");
    };

    let iter = employeeProfiles.keys().map(
      func(employeeId) {
        switch (employeeProfiles.get(employeeId), employeeCredentials.get(employeeId)) {
          case (?profile, ?creds) {
            let extendedProfile : ExtendedEmployeeProfile = {
              profile with loginId = creds.loginId;
              linkedPrincipal = creds.linkedPrincipal;
            };
            (employeeId, extendedProfile);
          };
          case (_) { Runtime.trap("Data inconsistency found in employee records") };
        };
      }
    );
    iter.toArray();
  };

  public shared ({ caller }) func setEmployeeActiveStatus(employeeId : Nat, isActive : Bool) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can set active status");
    };

    switch (employeeProfiles.get(employeeId)) {
      case (null) { Runtime.trap("Employee not found") };
      case (?profile) {
        let updatedProfile : EmployeeProfile = { profile with isActive };
        employeeProfiles.add(employeeId, updatedProfile);
      };
    };
  };

  public query ({ caller }) func getEmployeeCredentials(employeeId : Nat) : async (Text, Text) {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view credentials");
    };
    switch (employeeCredentials.get(employeeId)) {
      case (null) { ("", "") };
      case (?creds) { (creds.loginId, creds.password) };
    };
  };

  public shared ({ caller }) func sendMessage(toEmployeeId : Nat, content : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can send messages");
    };

    switch (employeeProfiles.get(toEmployeeId)) {
      case (null) { Runtime.trap("Employee does not exist") };
      case (?profile) {
        if (not profile.isActive) {
          Runtime.trap("Cannot send message to inactive employee");
        };
      };
    };

    let message : Message = {
      senderRole = #admin;
      content;
      timestamp = Time.now();
    };

    let messages = switch (employeeMessages.get(toEmployeeId)) {
      case (null) { List.empty<Message>() };
      case (?existingMessages) { existingMessages };
    };
    messages.add(message);
    employeeMessages.add(toEmployeeId, messages);
  };

  public shared ({ caller }) func sendMessageToAdmin(content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered employees can send messages");
    };

    if (not isCallerActiveEmployee(caller)) {
      Runtime.trap("Only active employees can send messages");
    };

    let maybeEmployeeId = principalToEmployeeId.get(caller);
    switch (maybeEmployeeId) {
      case (null) { Runtime.trap("Could not find the employee id linked to your principal") };
      case (?employeeId) {
        let message : Message = {
          senderRole = #employee;
          content;
          timestamp = Time.now();
        };

        let existingMessages = switch (employeeMessages.get(employeeId)) {
          case (null) { List.empty<Message>() };
          case (?msgs) { msgs };
        };
        existingMessages.add(message);
        employeeMessages.add(employeeId, existingMessages);
      };
    };
  };

  public query ({ caller }) func getMessagesForAdmin(employeeId : Nat) : async [Message] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all messages");
    };

    switch (employeeMessages.get(employeeId)) {
      case (null) { [] };
      case (?msgs) { msgs.toArray() };
    };
  };

  public query ({ caller }) func getMessagesForEmployee() : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered employees can view messages");
    };

    if (not isCallerActiveEmployee(caller)) {
      Runtime.trap("Only active employees can view messages");
    };

    let maybeEmployeeId = principalToEmployeeId.get(caller);
    switch (maybeEmployeeId) {
      case (null) { Runtime.trap("Could not find the employee id linked to your principal") };
      case (?employeeId) {
        switch (employeeMessages.get(employeeId)) {
          case (null) { [] };
          case (?msgs) { msgs.toArray() };
        };
      };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  func isCallerActiveEmployee(caller : Principal) : Bool {
    switch (principalToEmployeeId.get(caller)) {
      case (null) { false };
      case (?employeeId) {
        switch (employeeProfiles.get(employeeId)) {
          case (null) { false };
          case (?profile) { profile.isActive };
        };
      };
    };
  };
};
