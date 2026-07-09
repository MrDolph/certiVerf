// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title   InstitutionRegistry
 * @author  Dawodu Fatai Olalekan (NOU234249189)
 * @notice  Manages registration and approval of academic institutions
 *          authorized to issue credentials on the blockchain.
 *
 * @dev     Contract 1 of 2 in the Blockchain-Based Academic Certificate
 *          Verification System developed for MSc CIT899 thesis at the
 *          National Open University of Nigeria (NOUN), Lagos Mainland I.
 *
 *          In the Nigerian context, the contract owner (admin) represents
 *          a regulatory authority such as the National Universities
 *          Commission (NUC). Only NUC-approved institutions receive
 *          the right to issue credentials via CertificateRegistry.sol.
 *
 *          This contract does NOT store certificates. It answers only
 *          one question for CertificateRegistry: "Is this wallet address
 *          an approved institution?"
 */
contract InstitutionRegistry {

    // =========================================================
    // STATE VARIABLES
    // State variables are stored permanently on the blockchain.
    // Every read is free; every write costs gas (a transaction fee).
    // =========================================================

    /// @notice The wallet address of the contract owner (admin / regulator)
    address public owner;


    // =========================================================
    // STRUCTS
    // A struct is a custom data type grouping related fields together.
    // Think of it like a row in a database table.
    // =========================================================

    /**
     * @notice Represents a fully approved academic institution.
     * @dev    Stored permanently in the `institutions` mapping
     *         after the admin calls approveRegistration().
     */
    struct Institution {
        string   name;               // Full official name  e.g. "University of Lagos"
        string   acronym;            // Short form          e.g. "UNILAG"
        string   website;            // Official URL        e.g. "https://unilag.edu.ng"
        address  wallet;             // The institution's Ethereum wallet address
        bool     isApproved;         // True once the admin approves the institution
        uint256  registrationTime;   // Unix timestamp of the moment of approval
        bool     exists;             // Guard: distinguishes a real entry from an empty slot
    }

    /**
     * @notice Represents an institution that has applied but not yet been approved.
     * @dev    Stored temporarily in `pendingInstitutions`.
     *         Deleted when the admin calls approveRegistration() or rejectRegistration().
     */
    struct PendingInstitution {
        string  name;
        string  acronym;
        string  website;
        bool    exists;   // Guard flag — same purpose as in Institution struct
    }


    // =========================================================
    // MAPPINGS
    // A mapping works like a dictionary (key → value).
    // Here the key is an Ethereum address; the value is a struct.
    // Unmapped keys return a zero-value struct (not an error).
    // =========================================================

    /// @notice Maps an institution's wallet address to its approved record.
    mapping(address => Institution) public institutions;

    /// @notice Maps an institution's wallet address to its pending request.
    mapping(address => PendingInstitution) public pendingInstitutions;


    // =========================================================
    // EVENTS
    // Events are log entries written to the blockchain when
    // something important happens. They do not change state —
    // they are signals your frontend listens for.
    // The `indexed` keyword makes an argument searchable later.
    // =========================================================

    /// @notice Emitted when an institution submits a registration request.
    event RegistrationRequested(
        address indexed wallet,
        string          name,
        string          acronym
    );

    /// @notice Emitted when the owner approves an institution.
    event RegistrationApproved(
        address indexed wallet,
        string          name,
        uint256         timestamp
    );

    /// @notice Emitted when the owner rejects an institution's request.
    event RegistrationRejected(
        address indexed wallet,
        string          name
    );


    // =========================================================
    // MODIFIERS
    // A modifier is a reusable access-control guard.
    // The `_;` placeholder means "run the function body here".
    // Attach a modifier to a function to enforce a condition
    // before the function executes.
    // =========================================================

    /**
     * @notice Restricts a function so only the contract owner can call it.
     * @dev    Reverts the entire transaction if the check fails.
     *         In Solidity, require(condition, "message") is how you
     *         validate inputs and enforce rules.
     */
    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "InstitutionRegistry: caller is not the owner"
        );
        _;
    }


    // =========================================================
    // CONSTRUCTOR
    // The constructor runs ONCE — at the moment of deployment.
    // It is used to set up initial state.
    // msg.sender here is the wallet that deploys the contract.
    // =========================================================

    /**
     * @notice Sets the deploying address as the contract owner (the admin).
     * @dev    In deployment, this will be the regulatory authority's wallet.
     */
    constructor() {
        owner = msg.sender;
    }


    // =========================================================
    // WRITE FUNCTIONS
    // These functions change blockchain state — they require a
    // transaction (signed by a wallet) and cost gas.
    // `external` means the function can only be called from
    // outside this contract (not from within it).
    // `memory` means the string is a temporary copy in RAM,
    // not written to permanent storage.
    // =========================================================

    /**
     * @notice Allows any wallet to submit an institution registration request.
     *
     * @dev    The institution must not already be approved or have a pending
     *         request. Name and acronym must not be empty strings.
     *         Input validation protects the contract from garbage data.
     *
     * @param _name     Full official name of the institution
     * @param _acronym  Short acronym (e.g. "UNILAG", "OAU", "NOUN")
     * @param _website  Official website URL of the institution
     */
    function requestRegistration(
        string memory _name,
        string memory _acronym,
        string memory _website
    ) external {
        require(
            !institutions[msg.sender].isApproved,
            "This wallet is already a registered institution"
        );
        require(
            !pendingInstitutions[msg.sender].exists,
            "A registration request is already pending for this wallet"
        );
        require(
            bytes(_name).length > 0,
            "Institution name cannot be empty"
        );
        require(
            bytes(_acronym).length > 0,
            "Acronym cannot be empty"
        );

        // Store the pending request on-chain
        pendingInstitutions[msg.sender] = PendingInstitution({
            name    : _name,
            acronym : _acronym,
            website : _website,
            exists  : true
        });

        // Emit an event so the admin frontend can pick this up
        emit RegistrationRequested(msg.sender, _name, _acronym);
    }

    /**
     * @notice Approves a pending institution registration request.
     *
     * @dev    Only the owner (admin) can call this.
     *         Moves the institution data from `pendingInstitutions`
     *         into `institutions` and removes the pending entry.
     *         `block.timestamp` is the Unix time of the current block —
     *         this becomes the official registration timestamp on-chain.
     *
     * @param _wallet  The wallet address of the institution to approve
     */
    function approveRegistration(address _wallet) external onlyOwner {
        require(
            pendingInstitutions[_wallet].exists,
            "No pending request found for this address"
        );

        // Read the pending data into a temporary memory variable (gas-efficient)
        PendingInstitution memory pending = pendingInstitutions[_wallet];

        // Write the approved institution to permanent storage
        institutions[_wallet] = Institution({
            name             : pending.name,
            acronym          : pending.acronym,
            website          : pending.website,
            wallet           : _wallet,
            isApproved       : true,
            registrationTime : block.timestamp,
            exists           : true
        });

        // Remove the pending entry — it is no longer needed
        delete pendingInstitutions[_wallet];

        emit RegistrationApproved(_wallet, pending.name, block.timestamp);
    }

    /**
     * @notice Rejects and removes a pending registration request.
     *
     * @dev    Only the owner (admin) can call this.
     *         The institution's wallet may reapply by calling
     *         requestRegistration() again.
     *
     * @param _wallet  The wallet address of the institution to reject
     */
    function rejectRegistration(address _wallet) external onlyOwner {
        require(
            pendingInstitutions[_wallet].exists,
            "No pending request found for this address"
        );

        // Save the name before deleting (needed for the event)
        string memory institutionName = pendingInstitutions[_wallet].name;

        delete pendingInstitutions[_wallet];

        emit RegistrationRejected(_wallet, institutionName);
    }


    // =========================================================
    // READ FUNCTIONS (view)
    // `view` means the function only reads state — it does NOT
    // change anything on the blockchain. Calling a view function
    // is FREE (no gas cost) when called directly, not in a tx.
    // =========================================================

    /**
     * @notice Checks whether a wallet address belongs to an approved institution.
     *
     * @dev    This is the primary function called by CertificateRegistry
     *         before allowing a certificate to be issued. It is the
     *         bridge between the two contracts.
     *
     * @param  _wallet  The wallet address to check
     * @return bool     True if the address is an approved institution
     */
    function isRegistered(address _wallet) external view returns (bool) {
        return institutions[_wallet].isApproved;
    }

    /**
     * @notice Returns the public profile of an approved institution.
     *
     * @dev    Reverts if the wallet is not a registered institution.
     *         Used by CertificateRegistry to embed the institution's
     *         official name in the certificate record (not free-text input).
     *
     * @param  _wallet           The wallet address of the institution
     * @return name              Full official name
     * @return acronym           Short acronym
     * @return website           Official website
     * @return registrationTime  Unix timestamp of approval
     */
    function getInstitution(address _wallet) external view returns (
        string memory name,
        string memory acronym,
        string memory website,
        uint256       registrationTime
    ) {
        require(
            institutions[_wallet].isApproved,
            "Address is not a registered institution"
        );
        Institution memory inst = institutions[_wallet];
        return (inst.name, inst.acronym, inst.website, inst.registrationTime);
    }

    /**
     * @notice Returns details of a pending registration request.
     *
     * @dev    Used by the admin frontend to display institutions
     *         waiting for approval or rejection.
     *
     * @param  _wallet   The wallet address of the pending institution
     * @return name      Institution name from the request
     * @return acronym   Institution acronym from the request
     * @return website   Institution website from the request
     */
    function getPendingInstitution(address _wallet) external view returns (
        string memory name,
        string memory acronym,
        string memory website
    ) {
        require(
            pendingInstitutions[_wallet].exists,
            "No pending request for this address"
        );
        PendingInstitution memory pending = pendingInstitutions[_wallet];
        return (pending.name, pending.acronym, pending.website);
    }

}
