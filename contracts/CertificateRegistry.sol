// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// =========================================================
// INTERFACE
// An interface is a lightweight way to call another contract.
// Instead of importing the full InstitutionRegistry contract,
// we declare only the two functions we need from it.
// This keeps CertificateRegistry independent — it works as
// long as the other contract has these functions, regardless
// of everything else inside it.
// =========================================================

interface IInstitutionRegistry {
    function isRegistered(address _wallet) external view returns (bool);
    function getInstitution(address _wallet) external view returns (
        string memory name,
        string memory acronym,
        string memory website,
        uint256       registrationTime
    );
}


/**
 * @title   CertificateRegistry
 * @author  Dawodu Fatai Olalekan (NOU234249189)
 * @notice  Handles issuance, verification, and revocation of academic
 *          credentials on the blockchain.
 *
 * @dev     Contract 2 of 2 in the Blockchain-Based Academic Certificate
 *          Verification System developed for MSc CIT899 thesis at the
 *          National Open University of Nigeria (NOUN), Lagos Mainland I.
 *
 *          Key design decisions that improve on existing implementations:
 *
 *          1. DUAL-HASH SCHEME
 *             metaHash — keccak256 of all metadata fields, computed
 *             on-chain inside issueCertificate(). This is the unique
 *             identifier stored as the mapping key.
 *             docHash  — SHA-256 of the actual PDF document, computed
 *             in the browser before upload and passed as a parameter.
 *             Both hashes are stored and checked during verification,
 *             providing cryptographic tamper-evidence for both the
 *             data fields and the physical document.
 *
 *          2. INSTITUTION NAME FROM REGISTRY
 *             The institution name embedded in every certificate is
 *             pulled from InstitutionRegistry using msg.sender — not
 *             typed by the user. This closes a fraud vector present
 *             in prior implementations.
 *
 *          3. NO POST-ISSUANCE MODIFICATION
 *             There is no function to update or swap the document hash
 *             after issuance. Immutability is preserved by design.
 *             To correct a certificate, it must be revoked and reissued,
 *             creating a full auditable trail on-chain.
 */
contract CertificateRegistry {

    // =========================================================
    // STATE VARIABLES
    // =========================================================

    /// @notice Reference to the deployed InstitutionRegistry contract.
    ///         Used to verify that only approved institutions can issue.
    IInstitutionRegistry public registry;


    // =========================================================
    // STRUCTS
    // =========================================================

    /**
     * @notice Represents a single academic credential stored on-chain.
     *
     * @dev    `metaHash` is also the mapping key in `certificates`.
     *         Storing it inside the struct as well makes it readable
     *         directly from the struct without needing the key separately.
     *
     *         `docHash` is bytes32 because SHA-256 always produces
     *         exactly 32 bytes. Using bytes32 (a fixed-size type) is
     *         more gas-efficient than a dynamic `bytes` or `string`.
     */
    struct Certificate {
        bytes32 metaHash;            // keccak256 of all metadata — unique identifier
        bytes32 docHash;             // SHA-256 of the PDF document (computed in browser)
        string  ipfsCid;             // IPFS content identifier for retrieving the document
        string  institutionName;     // Pulled from InstitutionRegistry — not user input
        string  institutionAcronym;  // e.g. "UNILAG", "OAU", "NOUN"
        string  programme;           // e.g. "Bachelor of Science in Computer Science"
        string  degreeClass;         // e.g. "First Class", "Second Class Upper"
        string  studentName;         // Full name of the graduate
        string  studentId;           // Institution's student matric/ID number
        string  email;               // Graduate's email address
        uint256 completionYear;      // Year of graduation e.g. 2024
        uint256 issuedAt;            // Block timestamp of issuance
        address issuer;              // Wallet address of the issuing institution
        bool    isValid;             // False if the certificate has been revoked
        string  revokeReason;        // Reason for revocation (empty string if not revoked)
        uint256 revokedAt;           // Timestamp of revocation (0 if not revoked)
    }


    // =========================================================
    // MAPPINGS
    // =========================================================

    /// @notice Maps a certificate's metaHash to its full record.
    ///         The metaHash is the primary key — the "certificate number"
    ///         of this system.
    mapping(bytes32 => Certificate) public certificates;


    // =========================================================
    // EVENTS
    // =========================================================

    /**
     * @notice Emitted when a new certificate is issued.
     * @dev    The frontend listens for this event to confirm issuance
     *         and retrieve the metaHash for QR code generation.
     */
    event CertificateIssued(
        bytes32 indexed metaHash,
        address indexed issuer,
        string          institutionName,
        string          studentName,
        string          studentId,
        string          programme,
        uint256         issuedAt
    );

    /**
     * @notice Emitted when a certificate is revoked.
     * @dev    Revocation is permanent. A new certificate must be
     *         issued if a correction is needed.
     */
    event CertificateRevoked(
        bytes32 indexed metaHash,
        address indexed issuer,
        string          reason,
        uint256         revokedAt
    );


    // =========================================================
    // MODIFIERS
    // =========================================================

    /**
     * @notice Restricts issuance to approved institutions only.
     * @dev    Calls isRegistered() on the InstitutionRegistry contract.
     *         This is the link between the two contracts — every time
     *         an institution tries to issue, we check the registry first.
     */
    modifier onlyRegisteredInstitution() {
        require(
            registry.isRegistered(msg.sender),
            "CertificateRegistry: caller is not a registered institution"
        );
        _;
    }


    // =========================================================
    // CONSTRUCTOR
    // This constructor takes a PARAMETER — the address of the
    // already-deployed InstitutionRegistry contract.
    // This means you must deploy InstitutionRegistry FIRST,
    // copy its address, then deploy CertificateRegistry with
    // that address as the argument.
    // =========================================================

    /**
     * @notice Links this contract to a deployed InstitutionRegistry.
     * @dev    The registry address is set once at deployment and
     *         cannot be changed — this prevents the admin from
     *         swapping the registry to a permissive one later.
     * @param  _registryAddress  Address of the deployed InstitutionRegistry
     */
    constructor(address _registryAddress) {
        require(
            _registryAddress != address(0),
            "Registry address cannot be the zero address"
        );
        registry = IInstitutionRegistry(_registryAddress);
    }


    // =========================================================
    // WRITE FUNCTIONS
    // =========================================================

    /**
     * @notice Issues a new academic credential and stores it on-chain.
     *
     * @dev    Only callable by a registered institution (onlyRegisteredInstitution).
     *
     *         DUAL-HASH PROCESS:
     *         Step 1 — metaHash is computed HERE inside this function using
     *                  keccak256(abi.encodePacked(...)).
     *                  keccak256 is Solidity's built-in hashing function.
     *                  abi.encodePacked tightly packs the arguments into bytes
     *                  before hashing. Together they produce a deterministic
     *                  32-byte fingerprint of the certificate's key fields.
     *
     *         Step 2 — docHash is computed in the BROWSER (JavaScript) using
     *                  the Web Crypto API's SHA-256 on the PDF file, then
     *                  passed in as the `_docHash` parameter. The contract
     *                  stores it without modification.
     *
     *         INSTITUTION NAME:
     *         We call registry.getInstitution(msg.sender) to get the official
     *         institution name from the registry — the issuer cannot type
     *         a different institution name into this function.
     *
     * @param  _studentName      Full name of the graduate
     * @param  _studentId        Student's matric/ID number
     * @param  _programme        Degree programme name
     * @param  _degreeClass      Classification of the degree
     * @param  _completionYear   Year of graduation
     * @param  _email            Graduate's email address
     * @param  _docHash          SHA-256 of the certificate PDF (from browser)
     * @param  _ipfsCid          IPFS content ID of the uploaded document
     */
    function issueCertificate(
        string memory _studentName,
        string memory _studentId,
        string memory _programme,
        string memory _degreeClass,
        uint256       _completionYear,
        string memory _email,
        bytes32       _docHash,
        string memory _ipfsCid
    ) external onlyRegisteredInstitution {

        // --- Input validation ---
        require(bytes(_studentName).length > 0,   "Student name cannot be empty");
        require(bytes(_studentId).length > 0,      "Student ID cannot be empty");
        require(bytes(_programme).length > 0,      "Programme cannot be empty");
        require(bytes(_degreeClass).length > 0,    "Degree class cannot be empty");
        require(
            _completionYear > 1900 && _completionYear <= 2100,
            "Completion year is not valid"
        );
        require(_docHash != bytes32(0),            "Document hash cannot be empty");

        // --- Pull institution details from registry (not from user input) ---
        (string memory instName, string memory instAcronym,,) =
            registry.getInstitution(msg.sender);

        // --- Compute the unique certificate identifier on-chain ---
        // Using issuer address + studentId + programme + year ensures
        // uniqueness: the same institution cannot issue two identical
        // certificates for the same student in the same programme and year.
        bytes32 metaHash = keccak256(abi.encodePacked(
            msg.sender,       // issuing institution's wallet
            _studentId,       // student's unique ID at that institution
            _programme,       // degree programme
            _completionYear   // graduation year
        ));

        // --- Prevent duplicate issuance ---
        // address(0) is the "zero address" — it is the default value for
        // an address field in an empty/unmapped struct. If issuer is still
        // address(0), no certificate has been stored at this metaHash yet.
        require(
            certificates[metaHash].issuer == address(0),
            "A certificate already exists for this student, programme, and year"
        );

        // --- Store certificate permanently on-chain ---
        certificates[metaHash] = Certificate({
            metaHash           : metaHash,
            docHash            : _docHash,
            ipfsCid            : _ipfsCid,
            institutionName    : instName,
            institutionAcronym : instAcronym,
            programme          : _programme,
            degreeClass        : _degreeClass,
            studentName        : _studentName,
            studentId          : _studentId,
            email              : _email,
            completionYear     : _completionYear,
            issuedAt           : block.timestamp,
            issuer             : msg.sender,
            isValid            : true,
            revokeReason       : "",
            revokedAt          : 0
        });

        emit CertificateIssued(
            metaHash,
            msg.sender,
            instName,
            _studentName,
            _studentId,
            _programme,
            block.timestamp
        );
    }

    /**
     * @notice Revokes a previously issued certificate.
     *
     * @dev    Only the institution that originally issued the certificate
     *         can revoke it. Revocation is permanent — isValid becomes
     *         false and cannot be set back to true.
     *         A reason must always be provided for audit transparency.
     *
     * @param  _metaHash   The unique identifier of the certificate to revoke
     * @param  _reason     The reason for revocation (stored on-chain permanently)
     */
    function revokeCertificate(
        bytes32       _metaHash,
        string memory _reason
    ) external {
        require(
            certificates[_metaHash].issuer != address(0),
            "Certificate does not exist"
        );
        require(
            certificates[_metaHash].isValid,
            "Certificate has already been revoked"
        );
        require(
            certificates[_metaHash].issuer == msg.sender,
            "Only the issuing institution can revoke this certificate"
        );
        require(
            bytes(_reason).length > 0,
            "A revocation reason must be provided"
        );

        certificates[_metaHash].isValid      = false;
        certificates[_metaHash].revokeReason = _reason;
        certificates[_metaHash].revokedAt    = block.timestamp;

        emit CertificateRevoked(_metaHash, msg.sender, _reason, block.timestamp);
    }


    // =========================================================
    // READ FUNCTIONS
    // =========================================================

    /**
     * @notice Verifies a certificate and returns its full details.
     *
     * @dev    This is a PUBLIC view function — anyone can call it
     *         with no wallet and no gas cost. This is what the
     *         employer/verifier portal calls when scanning a QR code.
     *
     *         The caller receives both isValid (current status) and
     *         all certificate fields. If isValid is false, revokeReason
     *         explains why. The docHash can be independently verified
     *         by re-computing SHA-256 of the downloaded IPFS document
     *         and comparing it to the returned docHash.
     *
     * @param  _metaHash          The certificate's unique identifier
     * @return isValid            True if certificate is active; false if revoked
     * @return institutionName    Official name of the issuing institution
     * @return institutionAcronym Acronym of the issuing institution
     * @return studentName        Full name of the graduate
     * @return studentId          Student's matric/ID number
     * @return programme          Degree programme
     * @return degreeClass        Degree classification
     * @return completionYear     Year of graduation
     * @return issuedAt           Timestamp of issuance
     * @return docHash            SHA-256 of the PDF — for document verification
     * @return ipfsCid            IPFS link to retrieve the actual document
     * @return revokeReason       Reason for revocation (empty if still valid)
     */
    function verifyCertificate(bytes32 _metaHash) external view returns (
        bool    isValid,
        string memory institutionName,
        string memory institutionAcronym,
        string memory studentName,
        string memory studentId,
        string memory programme,
        string memory degreeClass,
        uint256 completionYear,
        uint256 issuedAt,
        bytes32 docHash,
        string memory ipfsCid,
        string memory revokeReason
    ) {
        require(
            certificates[_metaHash].issuer != address(0),
            "Certificate not found"
        );

        Certificate memory cert = certificates[_metaHash];
        return (
            cert.isValid,
            cert.institutionName,
            cert.institutionAcronym,
            cert.studentName,
            cert.studentId,
            cert.programme,
            cert.degreeClass,
            cert.completionYear,
            cert.issuedAt,
            cert.docHash,
            cert.ipfsCid,
            cert.revokeReason
        );
    }

    /**
     * @notice Returns the wallet address of the institution that issued
     *         a given certificate.
     * @dev    Used internally and by the frontend to confirm the issuer
     *         before allowing revocation.
     * @param  _metaHash  The certificate's unique identifier
     * @return address    The issuing institution's wallet address
     */
    function getCertificateIssuer(bytes32 _metaHash) external view returns (address) {
        return certificates[_metaHash].issuer;
    }

}
