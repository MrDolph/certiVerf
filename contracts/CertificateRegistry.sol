// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// =========================================================
// INTERFACE — how this contract talks to InstitutionRegistry
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
 *          KEY DESIGN DECISIONS:
 *
 *          1. DUAL-HASH SCHEME
 *             metaHash — keccak256 of metadata fields, computed on-chain.
 *             This is the unique certificate identifier (the mapping key).
 *             docHash  — SHA-256 of the actual PDF, computed in the browser
 *             and passed in as a parameter. Stored permanently on-chain.
 *             Together, these provide tamper-evidence for both the data
 *             fields and the physical certificate document.
 *
 *          2. INSTITUTION NAME FROM REGISTRY
 *             institutionName is pulled from InstitutionRegistry using
 *             msg.sender — not typed by the user. This closes a fraud
 *             vector present in prior implementations (e.g. CertiQ).
 *
 *          3. NO POST-ISSUANCE MODIFICATION
 *             No function exists to update or replace the docHash or
 *             ipfsCid after issuance. Immutability is preserved by design.
 *
 *          4. STRUCT INPUT PATTERN (resolves "stack too deep" error)
 *             issueCertificate() accepts a CertificateInput struct rather
 *             than 8 individual parameters. This is a Solidity best practice
 *             that keeps the function's local variable count within the
 *             EVM's 16-slot stack limit.
 */
contract CertificateRegistry {

    // =========================================================
    // STATE VARIABLES
    // =========================================================

    /// @notice Reference to the deployed InstitutionRegistry contract
    IInstitutionRegistry public registry;


    // =========================================================
    // STRUCTS
    // =========================================================

    /**
     * @notice Input struct for issueCertificate().
     *
     * @dev    Grouping all inputs into one struct solves the EVM
     *         "stack too deep" error that occurs when a function has
     *         more than ~16 local variables. The struct is passed as
     *         a single `memory` reference, counting as ONE stack slot.
     *         This is the standard Solidity pattern for functions
     *         that require many inputs.
     */
    struct CertificateInput {
        string  studentName;      // Full name of the graduate
        string  studentId;        // Matric/ID number at the institution
        string  programme;        // e.g. "Bachelor of Science in Computer Science"
        string  degreeClass;      // e.g. "First Class", "Second Class Upper"
        uint256 completionYear;   // Year of graduation e.g. 2024
        string  email;            // Graduate's email address
        bytes32 docHash;          // SHA-256 of the PDF — computed in browser
        string  ipfsCid;          // IPFS content identifier of the document
    }

    /**
     * @notice Represents a single academic credential stored on-chain.
     *
     * @dev    `metaHash` is also the mapping key in `certificates`.
     *         Storing it inside the struct makes it self-contained —
     *         any caller who receives the struct also has the key.
     *
     *         `docHash` uses bytes32 because SHA-256 always produces
     *         exactly 32 bytes. Fixed-size types are more gas-efficient
     *         than dynamic `bytes` or `string`.
     *
     *         Returning this full struct from verifyCertificate() also
     *         solves the "stack too deep" problem on the return side —
     *         one struct return = one stack slot.
     */
    struct Certificate {
        bytes32 metaHash;            // keccak256 of metadata — unique identifier
        bytes32 docHash;             // SHA-256 of the PDF document (from browser)
        string  ipfsCid;             // IPFS content identifier for the document
        string  institutionName;     // From InstitutionRegistry — not user input
        string  institutionAcronym;  // e.g. "UNILAG", "OAU", "NOUN"
        string  programme;           // Degree programme name
        string  degreeClass;         // Degree classification
        string  studentName;         // Full name of the graduate
        string  studentId;           // Student matric/ID number
        string  email;               // Graduate's email address
        uint256 completionYear;      // Year of graduation
        uint256 issuedAt;            // Block timestamp of issuance
        address issuer;              // Wallet address of the issuing institution
        bool    isValid;             // False if the certificate has been revoked
        string  revokeReason;        // Reason for revocation (empty if still valid)
        uint256 revokedAt;           // Timestamp of revocation (0 if not revoked)
    }


    // =========================================================
    // MAPPINGS
    // =========================================================

    /// @notice Maps a certificate's metaHash to its full on-chain record.
    ///         metaHash is the "certificate number" of this system.
    mapping(bytes32 => Certificate) public certificates;


    // =========================================================
    // EVENTS
    // =========================================================

    /// @notice Emitted when a new certificate is issued.
    event CertificateIssued(
        bytes32 indexed metaHash,
        address indexed issuer,
        string          institutionName,
        string          studentName,
        string          studentId,
        string          programme,
        uint256         issuedAt
    );

    /// @notice Emitted when a certificate is revoked.
    event CertificateRevoked(
        bytes32 indexed metaHash,
        address indexed issuer,
        string          reason,
        uint256         revokedAt
    );


    // =========================================================
    // MODIFIERS
    // =========================================================

    /// @notice Restricts issuance to approved institutions only.
    modifier onlyRegisteredInstitution() {
        require(
            registry.isRegistered(msg.sender),
            "CertificateRegistry: caller is not a registered institution"
        );
        _;
    }


    // =========================================================
    // CONSTRUCTOR
    // Deploy InstitutionRegistry FIRST. Copy its address.
    // Then deploy this contract, passing that address in.
    // =========================================================

    /**
     * @notice Links this contract to a deployed InstitutionRegistry.
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
     * @dev    DUAL-HASH PROCESS:
     *         metaHash — computed HERE inside the function using
     *         keccak256(abi.encodePacked(issuer, studentId, programme, year)).
     *         docHash  — computed in the browser (SHA-256 of the PDF file)
     *         and passed in via _input.docHash.
     *
     *         INSTITUTION NAME:
     *         Pulled from InstitutionRegistry via msg.sender.
     *         The issuing wallet cannot claim to be a different institution.
     *
     *         STRUCT INPUT:
     *         All certificate fields are bundled into CertificateInput memory.
     *         This is a single stack slot, solving the stack-too-deep error.
     *
     * @param  _input  A CertificateInput struct containing all certificate fields
     */
    function issueCertificate(
        CertificateInput memory _input
    ) external onlyRegisteredInstitution {

        // --- Input validation ---
        require(bytes(_input.studentName).length > 0,  "Student name cannot be empty");
        require(bytes(_input.studentId).length > 0,    "Student ID cannot be empty");
        require(bytes(_input.programme).length > 0,    "Programme cannot be empty");
        require(bytes(_input.degreeClass).length > 0,  "Degree class cannot be empty");
        require(
            _input.completionYear > 1900 && _input.completionYear <= 2100,
            "Completion year is not valid"
        );
        require(_input.docHash != bytes32(0), "Document hash cannot be empty");

        // --- Pull institution name from registry (not from user input) ---
        (string memory instName, string memory instAcronym,,) =
            registry.getInstitution(msg.sender);

        // --- Compute unique certificate identifier on-chain ---
        bytes32 metaHash = keccak256(abi.encodePacked(
            msg.sender,
            _input.studentId,
            _input.programme,
            _input.completionYear
        ));

        // --- Prevent duplicate issuance ---
        // address(0) is the default value for an unmapped address field.
        // If issuer is still address(0), no certificate exists here yet.
        require(
            certificates[metaHash].issuer == address(0),
            "A certificate already exists for this student, programme, and year"
        );

        // --- Store certificate permanently on-chain ---
        certificates[metaHash] = Certificate({
            metaHash           : metaHash,
            docHash            : _input.docHash,
            ipfsCid            : _input.ipfsCid,
            institutionName    : instName,
            institutionAcronym : instAcronym,
            programme          : _input.programme,
            degreeClass        : _input.degreeClass,
            studentName        : _input.studentName,
            studentId          : _input.studentId,
            email              : _input.email,
            completionYear     : _input.completionYear,
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
            _input.studentName,
            _input.studentId,
            _input.programme,
            block.timestamp
        );
    }

    /**
     * @notice Revokes a previously issued certificate.
     * @dev    Only the original issuing institution can revoke.
     *         Revocation is permanent. A reason is mandatory.
     * @param  _metaHash  The unique identifier of the certificate to revoke
     * @param  _reason    The reason for revocation (stored on-chain permanently)
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
     * @notice Verifies a certificate and returns its complete record.
     *
     * @dev    Returns the full Certificate struct as a single memory value.
     *         This solves the "stack too deep" problem on the return side —
     *         returning one struct counts as one stack slot, not 12.
     *
     *         This is a PUBLIC view function — anyone can call it with
     *         no wallet and no gas cost. This is what the employer or
     *         verifier portal calls when a QR code is scanned.
     *
     *         To verify document integrity, the caller should:
     *         1. Retrieve the document from IPFS using cert.ipfsCid
     *         2. Compute SHA-256 of the downloaded file in the browser
     *         3. Compare it to cert.docHash — any mismatch = tampering
     *
     * @param  _metaHash        The certificate's unique identifier
     * @return Certificate      The full certificate struct
     */
    function verifyCertificate(bytes32 _metaHash)
        external
        view
        returns (Certificate memory)
    {
        require(
            certificates[_metaHash].issuer != address(0),
            "Certificate not found"
        );
        return certificates[_metaHash];
    }

    /**
     * @notice Returns the wallet address of the institution that issued
     *         a given certificate.
     * @param  _metaHash  The certificate's unique identifier
     * @return address    The issuing institution's wallet address
     */
    function getCertificateIssuer(bytes32 _metaHash)
        external
        view
        returns (address)
    {
        return certificates[_metaHash].issuer;
    }

}
