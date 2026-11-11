// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Research prototype: deploy with a properly configured multisig as initial authority.
contract InstitutionRegistryV2 {
    address public owner;
    address public pendingOwner;
    struct Institution { string name; string acronym; string website; bool approved; bool suspended; bool exists; }
    struct Request { string name; string acronym; string website; bool exists; }
    mapping(address => Institution) public institutions;
    mapping(address => Request) public requests;
    event OwnershipTransferStarted(address indexed oldOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);
    event RegistrationRequested(address indexed wallet);
    event RegistrationApproved(address indexed wallet);
    event InstitutionSuspended(address indexed wallet, bool suspended);
    event InstitutionRevoked(address indexed wallet);
    event InstitutionKeyRotated(address indexed oldWallet, address indexed newWallet);
    modifier onlyOwner() { require(msg.sender == owner, "not authority"); _; }
    constructor(address authority) { require(authority != address(0), "zero authority"); owner = authority; }
    function transferOwnership(address next) external onlyOwner { require(next != address(0), "zero address"); pendingOwner = next; emit OwnershipTransferStarted(owner,next); }
    function acceptOwnership() external { require(msg.sender == pendingOwner, "not nominated"); address old = owner; owner = msg.sender; pendingOwner = address(0); emit OwnershipTransferred(old,owner); }
    function requestRegistration(string calldata name, string calldata acronym, string calldata website) external {
        require(bytes(name).length != 0 && bytes(acronym).length != 0, "empty institution");
        require(!institutions[msg.sender].exists && !requests[msg.sender].exists, "already known");
        requests[msg.sender] = Request(name,acronym,website,true); emit RegistrationRequested(msg.sender);
    }
    function approveRegistration(address wallet) external onlyOwner {
        Request memory r = requests[wallet]; require(r.exists, "no request");
        institutions[wallet] = Institution(r.name,r.acronym,r.website,true,false,true);
        delete requests[wallet]; emit RegistrationApproved(wallet);
    }
    function rejectRegistration(address wallet) external onlyOwner { require(requests[wallet].exists,"no request"); delete requests[wallet]; }
    function setSuspended(address wallet, bool suspended) external onlyOwner {
        require(institutions[wallet].approved, "not approved");
        institutions[wallet].suspended = suspended; emit InstitutionSuspended(wallet,suspended);
    }
    function revokeInstitution(address wallet) external onlyOwner {
        require(institutions[wallet].approved, "not approved");
        institutions[wallet].approved = false; institutions[wallet].suspended = true; emit InstitutionRevoked(wallet);
    }
    function rotateInstitutionKey(address oldWallet, address newWallet) external onlyOwner {
        require(oldWallet != newWallet && newWallet != address(0), "invalid wallet");
        require(institutions[oldWallet].approved, "not approved");
        require(!institutions[newWallet].exists && !requests[newWallet].exists, "new wallet in use");
        institutions[newWallet] = institutions[oldWallet];
        institutions[oldWallet].approved = false;
        institutions[oldWallet].suspended = true;
        emit InstitutionKeyRotated(oldWallet,newWallet);
    }
    function isRegistered(address wallet) external view returns (bool) {
        Institution storage i = institutions[wallet]; return i.approved && !i.suspended;
    }
}
