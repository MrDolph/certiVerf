// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Research prototype. The authority should be a properly configured multisig.
contract InstitutionRegistryV2_1 {
    address public owner;
    address public pendingOwner;
    uint256 public nextInstitutionId = 1;

    enum Status { Unknown, Active, Suspended, Revoked }
    struct Institution {
        string name;
        string acronym;
        string website;
        address currentWallet;
        Status status;
    }
    struct Request { string name; string acronym; string website; bool exists; }
    mapping(uint256 => Institution) private institutions;
    mapping(address => uint256) public institutionIdOf;
    mapping(address => Request) public requests;

    event OwnershipTransferStarted(address indexed previous, address indexed nominated);
    event OwnershipTransferred(address indexed previous, address indexed current);
    event RegistrationRequested(address indexed wallet);
    event RegistrationApproved(uint256 indexed institutionId, address indexed wallet);
    event InstitutionStatusChanged(uint256 indexed institutionId, Status status);
    event InstitutionKeyRotated(uint256 indexed institutionId, address indexed previousWallet, address indexed currentWallet);

    modifier onlyOwner() { require(msg.sender == owner, "not authority"); _; }
    constructor(address authority) { require(authority != address(0), "zero authority"); owner = authority; }

    function transferOwnership(address next) external onlyOwner {
        require(next != address(0), "zero address");
        pendingOwner = next;
        emit OwnershipTransferStarted(owner, next);
    }
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "not nominated");
        address old = owner;
        owner = msg.sender;
        pendingOwner = address(0);
        emit OwnershipTransferred(old, owner);
    }
    function requestRegistration(string calldata name, string calldata acronym, string calldata website) external {
        require(bytes(name).length != 0 && bytes(acronym).length != 0, "empty institution");
        require(institutionIdOf[msg.sender] == 0 && !requests[msg.sender].exists, "already known");
        requests[msg.sender] = Request(name, acronym, website, true);
        emit RegistrationRequested(msg.sender);
    }
    function approveRegistration(address wallet) external onlyOwner {
        Request memory r = requests[wallet];
        require(r.exists, "no request");
        uint256 id = nextInstitutionId++;
        institutions[id] = Institution(r.name, r.acronym, r.website, wallet, Status.Active);
        institutionIdOf[wallet] = id;
        delete requests[wallet];
        emit RegistrationApproved(id, wallet);
    }
    function rejectRegistration(address wallet) external onlyOwner {
        require(requests[wallet].exists, "no request");
        delete requests[wallet];
    }
    function getInstitution(uint256 id) external view returns (Institution memory) {
        require(id > 0 && id < nextInstitutionId, "unknown institution");
        return institutions[id];
    }
    function institutionStatus(uint256 id) external view returns (Status) {
        return institutions[id].status;
    }
    function isActiveIssuer(address wallet) external view returns (bool) {
        uint256 id = institutionIdOf[wallet];
        return id != 0 && institutions[id].currentWallet == wallet && institutions[id].status == Status.Active;
    }
    function canManageCertificates(address wallet, uint256 id) external view returns (bool) {
        return id != 0 && institutions[id].currentWallet == wallet &&
            (institutions[id].status == Status.Active || institutions[id].status == Status.Suspended);
    }
    function setSuspended(uint256 id, bool suspended) external onlyOwner {
        require(id != 0 && id < nextInstitutionId, "unknown institution");
        Status current = institutions[id].status;
        require(current != Status.Revoked, "institution revoked");
        require(current == (suspended ? Status.Active : Status.Suspended), "invalid transition");
        institutions[id].status = suspended ? Status.Suspended : Status.Active;
        emit InstitutionStatusChanged(id, institutions[id].status);
    }
    function revokeInstitution(uint256 id) external onlyOwner {
        require(id != 0 && id < nextInstitutionId, "unknown institution");
        require(institutions[id].status != Status.Revoked, "already revoked");
        institutions[id].status = Status.Revoked;
        emit InstitutionStatusChanged(id, Status.Revoked);
    }
    /// @notice Authority-controlled rotation. A separate secure authorization procedure is required operationally.
    function rotateInstitutionKey(uint256 id, address newWallet) external onlyOwner {
        require(id != 0 && id < nextInstitutionId, "unknown institution");
        require(institutions[id].status != Status.Revoked, "institution revoked");
        address oldWallet = institutions[id].currentWallet;
        require(newWallet != address(0) && newWallet != oldWallet, "invalid wallet");
        require(institutionIdOf[newWallet] == 0 && !requests[newWallet].exists, "wallet in use");
        institutions[id].currentWallet = newWallet;
        institutionIdOf[newWallet] = id;
        // Historical mapping is retained for provenance; only currentWallet has privileges.
        emit InstitutionKeyRotated(id, oldWallet, newWallet);
    }
}
