// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IInstitutionRegistryV2_1 {
    function institutionIdOf(address wallet) external view returns (uint256);
    function isActiveIssuer(address wallet) external view returns (bool);
    function canManageCertificates(address wallet, uint256 institutionId) external view returns (bool);
    function institutionStatus(uint256 institutionId) external view returns (uint8);
}

contract CertificateRegistryV2_1 {
    IInstitutionRegistryV2_1 public immutable registry;
    enum VerificationStatus { Valid, Revoked, Superseded, InstitutionRevoked }
    struct Certificate {
        address originalIssuer;
        uint256 institutionId;
        bytes32 identityCommitment;
        bytes32 docHash;
        bytes32 logicalId;
        bytes32 supersedes;
        uint64 issuedAt;
        uint64 revokedAt;
        bool revoked;
    }
    mapping(bytes32 => Certificate) public certificates;
    // Logical identifiers are scoped to stable institution IDs, not rotating wallets.
    mapping(uint256 => mapping(bytes32 => bytes32)) public latestByInstitutionAndLogicalId;
    event CertificateIssued(bytes32 indexed certificateId, bytes32 indexed logicalId, uint256 indexed institutionId, address issuer, bytes32 docHash);
    event CertificateRevoked(bytes32 indexed certificateId, uint256 indexed institutionId, address actor);

    constructor(address registryAddress) {
        require(registryAddress != address(0), "zero registry");
        registry = IInstitutionRegistryV2_1(registryAddress);
    }
    function issueCertificate(bytes32 logicalId, bytes32 identityCommitment, bytes32 docHash, bytes32 supersedes)
        external returns (bytes32 certificateId)
    {
        require(registry.isActiveIssuer(msg.sender), "inactive institution");
        require(logicalId != bytes32(0) && identityCommitment != bytes32(0) && docHash != bytes32(0), "zero digest");
        uint256 institutionId = registry.institutionIdOf(msg.sender);
        bytes32 previous = latestByInstitutionAndLogicalId[institutionId][logicalId];
        if (previous == bytes32(0)) {
            require(supersedes == bytes32(0), "unexpected predecessor");
        } else {
            require(supersedes == previous, "wrong predecessor");
            require(certificates[previous].revoked, "revoke before replacement");
        }
        certificateId = keccak256(abi.encode(block.chainid, address(this), institutionId, logicalId, previous, identityCommitment, docHash));
        require(certificates[certificateId].institutionId == 0, "already issued");
        certificates[certificateId] = Certificate(msg.sender, institutionId, identityCommitment, docHash, logicalId, previous, uint64(block.timestamp), 0, false);
        latestByInstitutionAndLogicalId[institutionId][logicalId] = certificateId;
        emit CertificateIssued(certificateId, logicalId, institutionId, msg.sender, docHash);
    }
    function revokeCertificate(bytes32 certificateId) external {
        Certificate storage c = certificates[certificateId];
        require(c.institutionId != 0, "not found");
        require(registry.canManageCertificates(msg.sender, c.institutionId), "not authorized manager");
        require(!c.revoked, "already revoked");
        c.revoked = true;
        c.revokedAt = uint64(block.timestamp);
        emit CertificateRevoked(certificateId, c.institutionId, msg.sender);
    }
    /// @notice 'currentlyValid' means cryptographically registered, current and unrevoked.
    /// A revoked institution returns InstitutionRevoked, requiring additional verification.
    /// This function does not authenticate a presented PDF or establish holder identity.
    function verifyCertificate(bytes32 certificateId)
        external view returns (Certificate memory record, bool currentlyValid, VerificationStatus status)
    {
        record = certificates[certificateId];
        require(record.institutionId != 0, "not found");
        if (record.revoked) return (record, false, VerificationStatus.Revoked);
        if (latestByInstitutionAndLogicalId[record.institutionId][record.logicalId] != certificateId)
            return (record, false, VerificationStatus.Superseded);
        if (registry.institutionStatus(record.institutionId) == 3)
            return (record, false, VerificationStatus.InstitutionRevoked);
        return (record, true, VerificationStatus.Valid);
    }
}
