// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRegistryV2 { function isRegistered(address wallet) external view returns (bool); }

/// @notice Privacy-preserving research prototype; V2 does not migrate V1 personal data.
contract CertificateRegistryV2 {
    IRegistryV2 public immutable registry;
    struct Certificate {
        address issuer;
        bytes32 identityCommitment; // keccak256(abi.encode(salt, identity fields)) computed off-chain
        bytes32 docHash; // SHA-256 of exact issued PDF bytes
        bytes32 logicalId; // groups versions of same credential
        bytes32 supersedes;
        uint64 issuedAt;
        uint64 revokedAt;
        bool revoked;
    }
    mapping(bytes32 => Certificate) public certificates;
    mapping(bytes32 => bytes32) public latestByLogicalId;
    event CertificateIssued(bytes32 indexed certificateId, bytes32 indexed logicalId, address indexed issuer, bytes32 docHash);
    event CertificateRevoked(bytes32 indexed certificateId, address indexed issuer);
    modifier onlyInstitution() { require(registry.isRegistered(msg.sender), "inactive institution"); _; }
    constructor(address registryAddress) { require(registryAddress != address(0), "zero registry"); registry = IRegistryV2(registryAddress); }
    /// @dev Salt must be unpredictable and held off-chain. Never emit personal fields or salt.
    function issueCertificate(bytes32 logicalId, bytes32 identityCommitment, bytes32 docHash, bytes32 supersedes)
        external onlyInstitution returns (bytes32 certificateId)
    {
        require(logicalId != bytes32(0) && identityCommitment != bytes32(0) && docHash != bytes32(0), "zero digest");
        bytes32 previous = latestByLogicalId[logicalId];
        if (previous == bytes32(0)) { require(supersedes == bytes32(0), "unexpected predecessor"); }
        else {
            require(supersedes == previous, "wrong predecessor");
            Certificate storage oldCert = certificates[previous];
            require(oldCert.issuer == msg.sender, "wrong issuer");
            require(oldCert.revoked, "revoke before replacement");
        }
        certificateId = keccak256(abi.encode(block.chainid,address(this),msg.sender,logicalId,previous,identityCommitment,docHash));
        require(certificates[certificateId].issuer == address(0), "already issued");
        certificates[certificateId] = Certificate(msg.sender,identityCommitment,docHash,logicalId,previous,uint64(block.timestamp),0,false);
        latestByLogicalId[logicalId] = certificateId;
        emit CertificateIssued(certificateId,logicalId,msg.sender,docHash);
    }
    function revokeCertificate(bytes32 certificateId) external {
        Certificate storage c = certificates[certificateId];
        require(c.issuer != address(0), "not found");
        require(c.issuer == msg.sender, "not issuer");
        require(!c.revoked, "already revoked");
        c.revoked = true; c.revokedAt = uint64(block.timestamp);
        emit CertificateRevoked(certificateId,msg.sender);
    }
    function verifyCertificate(bytes32 certificateId) external view returns (Certificate memory record, bool currentlyValid) {
        record = certificates[certificateId];
        require(record.issuer != address(0), "not found");
        currentlyValid = !record.revoked && registry.isRegistered(record.issuer) && latestByLogicalId[record.logicalId] == certificateId;
    }
}
