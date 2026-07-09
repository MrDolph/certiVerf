# CertiVerf — Blockchain-Based Academic Certificate Verification System

> **MSc CIT899 Thesis Prototype** · National Open University of Nigeria (NOUN)  
> **Author:** Dawodu Fatai Olalekan · Student ID: NOU234249189  
> **Supervisor:** Lagos Mainland I Study Centre  
> **Deployed Network:** Polygon Amoy Testnet (Chain ID: 80002)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Live Demo](#2-live-demo)
3. [System Architecture](#3-system-architecture)
4. [Smart Contracts](#4-smart-contracts)
5. [Key Design Decisions](#5-key-design-decisions)
6. [Frontend Portal — CertiVerf](#6-frontend-portal--certiverf)
7. [Technology Stack](#7-technology-stack)
8. [Repository Structure](#8-repository-structure)
9. [Setup and Deployment Guide](#9-setup-and-deployment-guide)
10. [How to Use Each Portal](#10-how-to-use-each-portal)
11. [Test Scenarios and Results](#11-test-scenarios-and-results)
12. [Known Issues and Learnings](#12-known-issues-and-learnings)
13. [How This Differs from Existing Systems](#13-how-this-differs-from-existing-systems)
14. [References](#14-references)

---

## 1. Project Overview

CertiVerf is a blockchain-based academic certificate verification system designed for the Nigerian higher education context. It addresses the limitations of both manual verification processes and the newly operational National Credential Verification Service (NCVS), which is administratively centralised and lacks cryptographic tamper-evidence.

### Problem Statement

Academic credential fraud is a documented challenge in Nigerian higher institutions. Existing verification approaches — manual institutional queries and the NCVS database — cannot provide cryptographic proof that a certificate has not been altered after issuance. The NCVS, established under the National Education Repository and Databank (NERD) Policy (Official Gazette No. 200, 2025), provides administrative centralisation but is technology-agnostic: a record in the NCVS database can in principle be modified without leaving a cryptographic audit trail.

### Solution

CertiVerf deploys two Solidity smart contracts on the Polygon Amoy public testnet and provides a role-aware frontend portal for three user types:

| Role | Actor | Capability |
|---|---|---|
| **NUC Admin** | Regulatory authority (NUC) | Approve / reject institution registrations |
| **Institution** | NUC-accredited university | Issue, revoke, and track certificates |
| **Public Verifier** | Employer / admissions officer | Verify any certificate — no wallet required |

---

## 2. Live Demo

**Portal URL:** https://mrdolph.github.io/certiVerf/

**Test certificate hash (for verification demo):**
```
0x0ffdf8e50a445961d32e8d85dddcb73106185a8d70345d35dda551b06f030dba
```
Paste this into the Verify Certificate tab to see a live result from the blockchain.

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ACTORS                                │
│   NUC Admin Wallet    Institution Wallet    Any Browser  │
└──────────┬──────────────────┬──────────────────┬────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│              CertiVerf Portal (index.html)               │
│   NUC Admin Tab │ Institution Tab │ Verify Tab           │
│   ethers.js v6 — BrowserProvider (write) /               │
│                   JsonRpcProvider (read)                  │
└──────────────────────────┬──────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           ▼                               ▼
┌──────────────────┐             ┌─────────────────────┐
│ InstitutionRegistry│◄──checks──│ CertificateRegistry │
│ .sol              │            │ .sol                │
│                   │            │                     │
│ Manages who can   │            │ Manages credential  │
│ issue credentials │            │ lifecycle           │
└──────────────────┘            └─────────────────────┘
           │                               │
           └───────────────┬───────────────┘
                           ▼
          ┌────────────────────────────────┐
          │  Polygon Amoy Testnet          │
          │  Chain ID: 80002               │
          │  RPC: Alchemy dedicated key    │
          └────────────────────────────────┘
                           │
                    (off-chain storage)
                           ▼
          ┌────────────────────────────────┐
          │  IPFS via Pinata               │
          │  Certificate PDF documents     │
          └────────────────────────────────┘
```

---

## 4. Smart Contracts

### Deployed Addresses — Polygon Amoy Testnet

| Contract | Address | Sourcify |
|---|---|---|
| `InstitutionRegistry.sol` | `0xCeB1502bD34a71eA45A3cAB6FCF5Cc8D0009A944` | [View verified source](https://repo.sourcify.dev/80002/0xCeB1502bD34a71eA45A3cAB6FCF5Cc8D0009A944/) |
| `CertificateRegistry.sol` | `0x7C280568dD991f471DBe5e6eE430624B93F712fF` | [View verified source](https://repo.sourcify.dev/80002/0x7C280568dD991f471DBe5e6eE430624B93F712fF/) |

Both contracts are Sourcify-verified — the source code visible here is identical to the bytecode executing on the blockchain.

### InstitutionRegistry.sol

Manages the two-stage institution onboarding process:

```
requestRegistration(name, acronym, website)  → any wallet
approveRegistration(wallet)                   → owner only (NUC)
rejectRegistration(wallet)                    → owner only (NUC)
isRegistered(wallet)                          → public view
getInstitution(wallet)                        → public view
getPendingInstitution(wallet)                 → public view
```

### CertificateRegistry.sol

Manages the full credential lifecycle:

```
issueCertificate(CertificateInput)     → registered institutions only
revokeCertificate(metaHash, reason)    → issuing institution only
verifyCertificate(metaHash)            → public view — FREE, no wallet
getCertificateIssuer(metaHash)         → public view
```

### Certificate Data Model (on-chain)

| Field | Type | Source | Purpose |
|---|---|---|---|
| `metaHash` | `bytes32` | Computed on-chain | Unique identifier (keccak256 of metadata) |
| `docHash` | `bytes32` | Browser (SHA-256) | PDF document fingerprint |
| `ipfsCid` | `string` | Institution input | IPFS link to certificate document |
| `institutionName` | `string` | InstitutionRegistry | Official name — NOT user input |
| `institutionAcronym` | `string` | InstitutionRegistry | e.g. UNILAG, OAU, NOUN |
| `programme` | `string` | Institution input | Degree programme |
| `degreeClass` | `string` | Institution input | First Class, Second Class Upper, etc. |
| `studentName` | `string` | Institution input | Graduate's full name |
| `studentId` | `string` | Institution input | Matric / ID number |
| `email` | `string` | Institution input | Graduate's email |
| `completionYear` | `uint256` | Institution input | Year of graduation |
| `issuedAt` | `uint256` | `block.timestamp` | Unix timestamp of issuance |
| `issuer` | `address` | `msg.sender` | Issuing institution's wallet |
| `isValid` | `bool` | System | `false` if revoked |
| `revokeReason` | `string` | Institution input | Reason for revocation |
| `revokedAt` | `uint256` | `block.timestamp` | Timestamp of revocation |

---

## 5. Key Design Decisions

### 5.1 Dual-Hash Scheme — Primary Technical Contribution

Every certificate stores two independent cryptographic hashes:

**metaHash** — computed ON-CHAIN:
```solidity
bytes32 metaHash = keccak256(abi.encodePacked(
    msg.sender,           // issuing institution's wallet
    _input.studentId,     // student matric number
    _input.programme,     // degree programme
    _input.completionYear // graduation year
));
```

**docHash** — computed IN THE BROWSER:
```javascript
const buffer = await file.arrayBuffer();
const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
const docHash = '0x' + Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
```

Both hashes are stored permanently on-chain. During verification, the verifier can independently re-compute the SHA-256 of the downloaded IPFS document and compare it to the stored `docHash`. Any document substitution is immediately detectable.

**Why this matters:** All prior systems reviewed — including ShikkhaChain (Farabi et al., 2025) and Verifi-Chain (Rahman et al., 2023) — store only the IPFS CID on-chain. This means document substitution at the IPFS layer is undetectable. CertiVerf's dual-hash scheme addresses this gap.

### 5.2 No Post-Issuance Modification

`CertificateRegistry.sol` has no function to update or replace any field after issuance. This is a deliberate architectural decision — immutability is enforced structurally, not by policy.

The reference implementation CertiQ includes an `updateIpfsHash()` function that allows an institution to silently swap the linked document. CertiVerf explicitly does not include this.

### 5.3 Institution Name from Registry

The `institutionName` field in every certificate is derived from the contract:
```solidity
(string memory instName, string memory instAcronym,,) =
    registry.getInstitution(msg.sender);
```
It is **not** a free-text input from the institution. This prevents a registered institution from issuing certificates claiming to be from a different institution.

### 5.4 Wallet-Free Public Verification

The public verification portal uses `ethers.js JsonRpcProvider` — a read-only blockchain connection. No MetaMask, no wallet, no gas fee required. Any employer with a browser can verify.

```javascript
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CERT_ADDRESS, ABI, provider);
const cert = await contract.verifyCertificate(metaHash);
```

### 5.5 Two-Contract Architecture

Separating governance (InstitutionRegistry) from records (CertificateRegistry) means:
- Certificate records are not affected if governance logic is updated
- The NUC admin role is explicitly encoded in the owner of InstitutionRegistry
- CertificateRegistry links to InstitutionRegistry at deployment time and cannot be re-pointed

---

## 6. Frontend Portal — CertiVerf

**File:** `index.html` (single self-contained file, no dependencies to install)

### Role Detection

After connecting MetaMask, the portal automatically queries InstitutionRegistry to determine the user's role:

```
Owner wallet      → NUC Admin Portal
Registered wallet → Institution Portal (issue, revoke, history)
Pending wallet    → Status: Awaiting NUC Approval
Any other wallet  → Registration form + Public Verify
```

### QR Code Verification

After certificate issuance, a QR code is generated encoding:
```
https://mrdolph.github.io/certiVerf/?hash=0x[metaHash]
```

Scanning this QR code on any device opens the portal and verifies the certificate automatically without any user input.

### SHA-256 Document Fingerprinting

When an institution uploads a PDF before issuance, the browser computes the SHA-256 hash using the native Web Crypto API. The computed `docHash` is displayed before submission so the institution can confirm it.

### Certificate History

Registered institutions can load their full issuance history from blockchain events:
```javascript
const filter = cert.filters.CertificateIssued(null, userAddress);
const events = await cert.queryFilter(filter, 0, 'latest');
```

No database is involved — the blockchain event log is the audit trail.

---

## 7. Technology Stack

| Technology | Version | Role |
|---|---|---|
| Solidity | `^0.8.20` | Smart contract language |
| Polygon Amoy Testnet | Chain ID: 80002 | Deployment blockchain |
| Remix IDE | 2.5.1 | Development and deployment environment |
| ethers.js | v6 (CDN) | Frontend blockchain library |
| Alchemy | Free tier | Dedicated RPC endpoint for Polygon Amoy |
| MetaMask | Browser extension | Transaction signing wallet |
| IPFS via Pinata | — | Off-chain certificate document storage |
| Sourcify | Decentralised | Smart contract source code verification |
| Web Crypto API | Browser native | SHA-256 PDF fingerprinting |
| GitHub Pages | — | Frontend hosting |

---

## 8. Repository Structure

```
certiVerf/
├── index.html                    # CertiVerf multi-portal frontend
├── contracts/
│   ├── InstitutionRegistry.sol   # Governance contract
│   └── CertificateRegistry.sol   # Certificate lifecycle contract
├── diagrams/
│   ├── use_case_diagram.html     # UML Use Case Diagram
│   ├── sequence_issuance.html    # Sequence Diagram: Certificate Issuance
│   └── sequence_verification.html # Sequence Diagram: Verification
└── README.md                     # This file
```

---

## 9. Setup and Deployment Guide

### Prerequisites

- [MetaMask](https://metamask.io) browser extension installed
- Polygon Amoy Testnet added to MetaMask (Chain ID: 80002)
- Test POL tokens from [faucet.polygon.technology](https://faucet.polygon.technology)
- [Alchemy](https://alchemy.com) free account for a dedicated RPC URL

### Step 1 — Add Polygon Amoy to MetaMask

Go to [faucet.polygon.technology](https://faucet.polygon.technology) and click **Add Chain to Wallet**. MetaMask will add Amoy automatically.

Or add manually:
```
Network Name:  Polygon Amoy Testnet
RPC URL:       https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY
Chain ID:      80002
Currency:      POL
Explorer:      https://amoy.polygonscan.com
```

### Step 2 — Get Test POL

Visit [faucet.polygon.technology](https://faucet.polygon.technology), verify with GitHub or X, paste your wallet address and claim. You need approximately **0.05 POL** for both contract deployments.

> **Important:** Public RPC endpoints (rpc-amoy.polygon.technology) are unreliable for deployment. Use a dedicated Alchemy key. Create a free account at alchemy.com, create an app on Polygon PoS (Amoy network), copy the HTTPS endpoint and add it to MetaMask.

### Step 3 — Deploy Contracts (if redeploying)

Open [remix.ethereum.org](https://remix.ethereum.org):

1. Upload both `.sol` files from the `contracts/` folder
2. Compile each with Solidity `0.8.20` and optimizer enabled
3. In Deploy & Run → Environment → select **Injected Provider - MetaMask**
4. Deploy `InstitutionRegistry.sol` first → copy its address
5. Deploy `CertificateRegistry.sol` → paste InstitutionRegistry address in `_registryAddress` field

> **Note:** Both contracts are already deployed and verified. You do not need to redeploy to use the system.

### Step 4 — Configure Frontend

If you redeploy, update these two constants in `index.html`:

```javascript
const REGISTRY_ADDR = "0x[your InstitutionRegistry address]";
const CERT_ADDR     = "0x[your CertificateRegistry address]";
const RPC_URL       = "https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY";
```

### Step 5 — Deploy Frontend to GitHub Pages

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/certiVerf.git
git push -u origin master
```

Then: GitHub repo → Settings → Pages → Source: **master** branch → Save.

Live at: `https://YOUR_USERNAME.github.io/certiVerf/`

> **Branch naming:** Git initialised locally with `git init` defaults to `master`. GitHub defaults to `main`. If you get a push rejection, run `git pull origin main --allow-unrelated-histories` then `git checkout --ours index.html && git add . && git commit -m "merge" && git push`.

---

## 10. How to Use Each Portal

### NUC Admin Portal

1. Connect the wallet that deployed `InstitutionRegistry.sol`
2. Navigate to **NUC Admin** tab
3. Click **Refresh** to load pending institution applications from blockchain events
4. Review each application — name, acronym, website, wallet address
5. Click **Approve** or **Reject** — each triggers an on-chain transaction
6. Use the lookup tool to check any wallet's registration status

### Institution Portal

**If not registered:**
1. Connect your institution wallet
2. Fill in institution name, acronym, and website
3. Click **Submit Registration to NUC** — this creates a pending request on-chain
4. Wait for the NUC Admin to approve your request

**If registered:**
1. Fill in the graduate's details — name, student ID, programme, classification, year, email
2. Upload the certificate PDF — SHA-256 is computed automatically in the browser
3. Paste the IPFS CID from Pinata (upload PDF to Pinata first)
4. Click **Issue Certificate on Blockchain**
5. Copy the generated metaHash and share it with the graduate
6. The QR code encodes a direct verification URL — print it on the physical certificate

**Revocation:**
1. Paste the certificate metaHash
2. Enter a mandatory reason for revocation
3. Click **Revoke Certificate** — reason and timestamp stored permanently on-chain

### Public Verification Portal

1. Navigate to **Verify Certificate** tab — no wallet needed
2. Paste the certificate metaHash (or scan the certificate QR code)
3. Click **Verify** — result returns from blockchain in under 2 seconds
4. **VALID** certificates show green animated shield with full details
5. **REVOKED** certificates show red icon with revocation reason and date
6. Click **Print / Save PDF** to save the verification result

---

## 11. Test Scenarios and Results

All eight scenarios were tested on Remix VM (Cancun). All passed.

| Test | Scenario | Result |
|---|---|---|
| T-01 | Institution submits registration request | ✓ RegistrationRequested event emitted |
| T-02 | Duplicate registration attempt | ✓ Reverted: "already pending" |
| T-03 | NUC Admin approves institution | ✓ RegistrationApproved event emitted |
| T-04 | Institution issues certificate | ✓ metaHash `0x0ffdf8...30dba` generated on-chain |
| T-05 | Unregistered wallet attempts issuance | ✓ Reverted: "not a registered institution" |
| T-06 | Public wallet verifies valid certificate | ✓ Full Certificate struct returned, isValid: true |
| T-07 | Institution revokes certificate | ✓ CertificateRevoked event with reason + timestamp |
| T-08 | Verifier checks revoked certificate | ✓ isValid: false, revokeReason and revokedAt returned |

### Performance (Polygon Amoy Testnet)

| Metric | Result | Target |
|---|---|---|
| Gas — InstitutionRegistry deploy | 0.0334998 POL | < 0.05 POL |
| Gas — issueCertificate | 398,016 units | < 0.01 POL |
| Gas — verifyCertificate | FREE (view) | FREE |
| Verification response time | < 2 seconds | < 5 seconds |
| Fraud detection rate | 100% (3/3) | 100% |

---

## 12. Known Issues and Learnings

### EVM Stack Too Deep Error

**Problem:** The first version of `issueCertificate()` had 8 individual parameters plus local variables, exceeding the EVM's 16-slot stack limit.

**Solution:** Grouped all 8 inputs into a `CertificateInput` struct. The struct passes as a single memory reference — one stack slot.

```solidity
// BEFORE (caused stack too deep)
function issueCertificate(
    string memory _studentName,
    string memory _studentId,
    // ... 6 more parameters
)

// AFTER (resolved)
function issueCertificate(CertificateInput memory _input)
```

This also reduced gas consumption significantly.

---

### Polygon Amoy RPC Unreliability

**Problem:** Public RPC endpoints (`rpc-amoy.polygon.technology`, `drpc.org`, `ankr`) failed repeatedly during deployment with the error `_context7.t3.error.indexOf is not a function` — a Remix 2.5.1 bug triggered by unreliable RPC responses.

**Solution:** Create a dedicated Alchemy account and use the private HTTPS endpoint. Public endpoints are shared across thousands of developers and unreliable for testnet deployments.

---

### MetaMask Branch vs GitHub Branch

**Problem:** `git init` locally creates a `master` branch. GitHub's default is `main`. This causes push rejection: `error: src refspec main does not match any`.

**Solution:** Either push to `master` directly (`git push -u origin master`) or rename the branch before pushing:
```bash
git branch -m master main
git pull origin main --allow-unrelated-histories
git checkout --ours index.html
git add . && git commit -m "merge" && git push -u origin main
```

---

### Goerli Testnet Deprecated

ShikkhaChain (Farabi et al., 2025) deployed on Goerli Ethereum testnet, which the Ethereum Foundation deprecated in 2023. This system uses **Polygon Amoy** — the current official Polygon testnet replacing the deprecated Mumbai network.

---

### viaIR Compiler Flag

**Problem:** Remix's `remix.config.json` does not accept `viaIR: true` directly in the settings object — it raises "Unknown key viaIR".

**Solution:** The `CertificateInput` struct pattern eliminates the need for `viaIR` entirely. Struct inputs count as one stack slot regardless of how many fields they contain.

---

### Institution Name Fraud Vector

**Problem (in CertiQ reference implementation):** Institution name is a free-text input, allowing any registered institution to issue a certificate claiming to be from a different university.

**Solution:** Derive `institutionName` from `InstitutionRegistry.getInstitution(msg.sender)` inside the contract at issuance time. The institution cannot supply this value.

---

## 13. How This Differs from Existing Systems

| Feature | Verifi-Chain (2023) | ShikkhaChain (2025) | CertiQ (n.d.) | **CertiVerf (This System)** |
|---|---|---|---|---|
| Dual-hash (metadata + document) | ✗ | ✗ | ✗ | **✓** |
| PDF SHA-256 browser fingerprint | ✗ | ✗ | ✗ | **✓** |
| No post-issuance modification | ~ | ~ | ✗ | **✓** |
| Institution name from on-chain registry | ✗ | ✗ | ✗ | **✓** |
| Wallet-free public verification | ✗ | ~ | ~ | **✓** |
| Two-contract architecture | ✗ | ✗ | ✗ | **✓** |
| QR code auto-verification (URL-based) | ✗ | ~ (future work) | ~ | **✓** |
| Certificate history from events | ✗ | ~ | ✗ | **✓** |
| Nigerian regulatory context (NUC/NCVS) | ✗ | ✗ | ✗ | **✓** |
| Positioned against an operational system | ✗ | ✗ | ✗ | **✓** |

Gas cost comparison: ShikkhaChain reports ~1,289,600 gas units per issuance on Goerli (Farabi et al., 2025, p.4). CertiVerf incurred 398,016 units on Polygon Amoy — approximately 3× more efficient.

---

## 14. References

- Akuma, C. F., Garba, E. J., Usman, M., & Kadams, A. A. (2024). Blockchain-enabled conceptual framework for enhancing academic transcript issuance and authentication in the Nigerian educational system. *International Journal of Development Mathematics*, *1*(2), 227–236. https://doi.org/10.62054/ijdm/0102.19

- Effiong, M. E. (2020). *A framework for the adoption of blockchain technology in academic certificate-verification systems: A case study of Nigeria* [Master's thesis, Tallinn University of Technology]. https://digikogu.taltech.ee/et/Download/1fe667ff-d131-432b-b758-061b9d4348d1

- Farabi, A., Khandaker, I., Ahsan, J., Shanto, I. K., Jahan, N., & Khan, M. J. (2025). ShikkhaChain: A blockchain-powered academic credential verification system for Bangladesh. *arXiv preprint arXiv:2508.05334*. https://arxiv.org/abs/2508.05334

- Federal Republic of Nigeria. (2025). *National Education Repository and Databank (NERD) Regulation, 2025, Official Gazette No. 200*. Federal Government Press.

- Hevner, A. R., March, S. T., Park, J., & Ram, S. (2004). Design science in information systems research. *MIS Quarterly*, *28*(1), 75–106. https://doi.org/10.2307/25148625

- Marikkal, A. (n.d.). *CertiQ* [Source code]. GitHub. https://github.com/AdithyanMarikkal/CertiQ

- Ogbonnia, O. O., & Chiamaka, E. B. (2022). Centralized online transcript verification system for Nigeria tertiary institutions: A propositional model. *International Journal of Advances in Engineering and Management*, *4*(11), 264–270. https://doi.org/10.35629/5252-0411264270

- Peffers, K., Tuunanen, T., Rothenberger, M. A., & Chatterjee, S. (2007). A design science research methodology for information systems research. *Journal of Management Information Systems*, *24*(3), 45–77.

- Polygon Technology. (2024). *Introducing the Amoy testnet for Polygon PoS*. https://polygon.technology/blog/introducing-the-amoy-testnet-for-polygon-pos

- Rahman, T., Mouno, S. I., Raatul, A. M., Al Azad, A. K., & Mansoor, N. (2023). Verifi-Chain: A credentials verifier using blockchain and IPFS. In *Inventive Communication and Computational Technologies* (pp. 355–366). Springer. https://doi.org/10.1007/978-981-99-5166-6_24

- Rustemi, A., Dalipi, F., Atanasovski, V., & Risteski, A. (2023). A systematic literature review on blockchain-based systems for academic certificate verification. *IEEE Access*, *11*, 64,679–64,696. https://doi.org/10.1109/ACCESS.2023.3289598

---

## Licence

This project is developed as an academic thesis prototype at the National Open University of Nigeria. It is made publicly available for research and educational purposes.

---

*CertiVerf · Dawodu Fatai Olalekan · NOU234249189 · MSc CIT899 · NOUN Lagos Mainland I · 2025*