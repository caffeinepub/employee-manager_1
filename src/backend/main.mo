import Time "mo:core/Time";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
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

  var employeeIdCounter = 0;
  let employeeProfiles = Map.empty<Nat, EmployeeProfile>();
  let employeeCredentials = Map.empty<Nat, EmployeeCredentials>();
  let employeeMessages = Map.empty<Nat, List.List<Message>>();
  let loginIdIndex = Map.empty<Text, Nat>();
  let principalToEmployeeId = Map.empty<Principal, Nat>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let videoSignals = Map.empty<Nat, CallSignal>();
  let adminVideoSignals = Map.empty<Nat, CallSignal>();
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

  public shared ({ caller }) func initiateVideoCall(toEmployeeId : Nat, sdpOffer : Text) : async Result {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can initiate calls");
    };

    switch (employeeProfiles.get(toEmployeeId)) {
      case (null) { return #err("Employee not found") };
      case (?profile) {
        if (not profile.isActive) { return #err("Employee is not active") };
      };
    };

    let currentSignal = switch (videoSignals.get(toEmployeeId)) {
      case (null) { null };
      case (?signal) { ?signal };
    };
    switch (currentSignal) {
      case (?signal) {
        if (signal.status != #idle and signal.status != #ended) {
          return #err("Employee already has a call");
        };
      };
      case (null) {};
    };

    let defaultSignal : CallSignal = {
      offer = null;
      answer = null;
      iceCandidates = [];
      status = #idle;
    };

    let updatedSignal : CallSignal = {
      (switch (videoSignals.get(toEmployeeId)) { case (null) { defaultSignal }; case (?signal) { signal } }) with
      offer = ?sdpOffer;
      status = #calling;
      iceCandidates = [];
    };
    videoSignals.add(toEmployeeId, updatedSignal);

    let adminSignal : CallSignal = {
      offer = ?sdpOffer;
      answer = null;
      iceCandidates = [];
      status = #calling;
    };
    adminVideoSignals.add(toEmployeeId, adminSignal);

    #ok;
  };

  public shared ({ caller }) func employeeInitiateVideoCall(sdpOffer : Text) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated employees can initiate calls");
    };

    if (not isCallerActiveEmployee(caller)) {
      Runtime.trap("Unauthorized: Only active employees can initiate calls");
    };

    let employeeId = switch (principalToEmployeeId.get(caller)) {
      case (null) { Runtime.trap("Employee principal not linked") };
      case (?id) { id };
    };

    let currentSignal = switch (adminVideoSignals.get(employeeId)) {
      case (null) { null };
      case (?signal) { ?signal };
    };
    switch (currentSignal) {
      case (?signal) {
        if (signal.status != #idle and signal.status != #ended) {
          return #err("Existing call in progress - cannot start new");
        };
      };
      case (null) {};
    };

    let defaultSignal : CallSignal = {
      offer = null;
      answer = null;
      iceCandidates = [];
      status = #idle;
    };

    let updatedSignal : CallSignal = {
      (switch (adminVideoSignals.get(employeeId)) { case (null) { defaultSignal }; case (?signal) { signal } }) with
      offer = ?sdpOffer;
      status = #calling;
      iceCandidates = [];
    };
    adminVideoSignals.add(employeeId, updatedSignal);

    let employeeSignal : CallSignal = {
      offer = ?sdpOffer;
      answer = null;
      iceCandidates = [];
      status = #calling;
    };
    videoSignals.add(employeeId, employeeSignal);

    #ok;
  };

  public shared ({ caller }) func answerVideoCall(sdpAnswer : Text) : async Result {
    let maybeEmployeeId = principalToEmployeeId.get(caller);
    
    switch (maybeEmployeeId) {
      case (?employeeId) {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
          Runtime.trap("Unauthorized: Only authenticated employees can answer calls");
        };
        
        if (not isCallerActiveEmployee(caller)) {
          Runtime.trap("Unauthorized: Only active employees can answer calls");
        };
        
        return handleEmployeeCallAnswer(employeeId, sdpAnswer);
      };
      case (null) {
        if (AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Admin cannot answer calls - employees answer admin-initiated calls");
        };
        Runtime.trap("Unauthorized: Unknown caller cannot answer calls");
      };
    };
  };

  func handleEmployeeCallAnswer(employeeId : Nat, sdpAnswer : Text) : Result {
    let signal = switch (videoSignals.get(employeeId)) {
      case (null) { return #err("No active call") };
      case (?callSignal) { callSignal };
    };

    switch (signal.status) {
      case (#calling) {
        let updatedSignal : CallSignal = { signal with answer = ?sdpAnswer; status = #connected };
        videoSignals.add(employeeId, updatedSignal);

        let adminSignal = {
          offer = signal.offer;
          answer = ?sdpAnswer;
          iceCandidates = signal.iceCandidates;
          status = #connected;
        };
        adminVideoSignals.add(employeeId, adminSignal);
        #ok;
      };
      case (#idle) { #err("Cannot answer call with status idle") };
      case (#connected) { #err("Call already connected") };
      case (#ended) { #err("Cannot answer call with status ended") };
    };
  };

  public shared ({ caller }) func addIceCandidateAdmin(toEmployeeId : Nat, candidate : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can add ICE candidates");
    };

    switch (videoSignals.get(toEmployeeId)) {
      case (null) { Runtime.trap("Call not found for employee") };
      case (?signal) {
        let updatedCandidatesList = signal.iceCandidates.concat([candidate]);
        let updatedSignal : CallSignal = { signal with iceCandidates = updatedCandidatesList };
        videoSignals.add(toEmployeeId, updatedSignal);

        let adminSignal : CallSignal = {
          offer = signal.offer;
          answer = signal.answer;
          iceCandidates = updatedCandidatesList;
          status = signal.status;
        };
        adminVideoSignals.add(toEmployeeId, adminSignal);
      };
    };
  };

  public shared ({ caller }) func addIceCandidateEmployee(candidate : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated employees can add ICE candidates");
    };

    if (not isCallerActiveEmployee(caller)) {
      Runtime.trap("Unauthorized: Only active employees can add ICE candidates");
    };

    let employeeId = switch (principalToEmployeeId.get(caller)) {
      case (null) { Runtime.trap("Employee principal not linked") };
      case (?id) { id };
    };

    switch (adminVideoSignals.get(employeeId)) {
      case (null) { Runtime.trap("Call not found") };
      case (?signal) {
        let updatedCandidatesList = signal.iceCandidates.concat([candidate]);
        let updatedSignal : CallSignal = { signal with iceCandidates = updatedCandidatesList };
        adminVideoSignals.add(employeeId, updatedSignal);

        let employeeSignal : CallSignal = {
          offer = signal.offer;
          answer = signal.answer;
          iceCandidates = updatedCandidatesList;
          status = signal.status;
        };
        videoSignals.add(employeeId, employeeSignal);
      };
    };
  };

  public query ({ caller }) func getCallSignalForAdmin(employeeId : Nat) : async ?CallSignal {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can get call signals");
    };
    adminVideoSignals.get(employeeId);
  };

  public query ({ caller }) func getCallSignalForEmployee() : async ?CallSignal {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated employees can get call signals");
    };

    if (not isCallerActiveEmployee(caller)) {
      Runtime.trap("Unauthorized: Only active employees can get call signals");
    };

    switch (principalToEmployeeId.get(caller)) {
      case (null) { Runtime.trap("Employee principal not linked") };
      case (?employeeId) { videoSignals.get(employeeId) };
    };
  };

  public shared ({ caller }) func endCallAdmin(employeeId : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can end call");
    };

    switch (videoSignals.get(employeeId)) {
      case (null) { Runtime.trap("No active call to end for employee") };
      case (?signal) {
        if (signal.status != #calling and signal.status != #connected) {
          Runtime.trap("Cannot end call in current state");
        };

        let endedSignal : CallSignal = {
          offer = null;
          answer = null;
          iceCandidates = [];
          status = #ended;
        };

        videoSignals.add(employeeId, endedSignal);
        let adminSignal : CallSignal = {
          offer = null;
          answer = null;
          iceCandidates = [];
          status = #ended;
        };
        adminVideoSignals.add(employeeId, adminSignal);
      };
    };
  };

  public shared ({ caller }) func endCallEmployee() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authorized employees can end calls");
    };

    if (not isCallerActiveEmployee(caller)) {
      Runtime.trap("Unauthorized: Only active employees can end calls");
    };

    let employeeId = switch (principalToEmployeeId.get(caller)) {
      case (null) { Runtime.trap("Employee principal not linked") };
      case (?id) { id };
    };

    switch (adminVideoSignals.get(employeeId)) {
      case (null) { Runtime.trap("Cannot end call that does not exist") };
      case (?signal) {
        if (signal.status != #calling and signal.status != #connected) {
          Runtime.trap("Cannot end call in current state");
        };

        let endedSignal : CallSignal = {
          offer = null;
          answer = null;
          iceCandidates = [];
          status = #ended;
        };

        adminVideoSignals.add(employeeId, endedSignal);
        let employeeSignal : CallSignal = {
          offer = null;
          answer = null;
          iceCandidates = [];
          status = #ended;
        };
        videoSignals.add(employeeId, employeeSignal);
      };
    };
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
