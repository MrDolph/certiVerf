# CertiVerf — Blockchain-Based Academic Certificate Verification System

> **MSc CIT899 Thesis Prototype** · National Open University of Nigeria (NOUN)  
> **Author:** Dawodu Fatai Olalekan · Student ID: NOU234249189  
> **Study Centre:** Lagos Mainland I  
> **Deployed Network:** Polygon Amoy Testnet (Chain ID: 80002)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Live Demo](#2-live-demo)
3. [System Architecture](#3-system-architecture)
4. [Smart Contracts](#4-smart-contracts)
5. [Key Design Decisions](#5-key-design-decisions)
6. [Frontend Portal — CertiVerf](#6-frontend-portal--certiverf)
7. [The Graph Subgraph](#7-the-graph-subgraph)
8. [Technology Stack](#8-technology-stack)
9. [Repository Structure](#9-repository-structure)
10. [Setup and Deployment Guide](#10-setup-and-deployment-guide)
11. [How to Use Each Portal](#11-how-to-use-each-portal)
12. [Test Scenarios and Results](#12-test-scenarios-and-results)
13. [Known Issues and Learnings](#13-known-issues-and-learnings)
14. [How This Differs from Existing Systems](#14-how-this-differs-from-existing-systems)
15. [References](#15-references)

---

## 1. Project Overview

CertiVerf is a blockchain-based academic certificate verification system designed for the Nigerian higher education context. It addresses the limitations of both manual verification processes and the newly operational National Credential Verification Service (NCVS), which is administratively centralised and lacks cryptographic tamper-evidence.

### Problem Statement

Academic credential fraud is a documented challenge in Nigerian higher institutions. The NCVS, established under the National Education Repository and Databank (NERD) Policy (Official Gazette No. 200, 2025), provides administrative centralisation but is technology-agnostic — a record in the NCVS database can in principle be modified without any cryptographic audit trail.

### Solution

CertiVerf deploys two Solidity smart contracts on the Polygon Amoy public testnet, a role-aware frontend portal, and a decentralised event indexing subgraph via The Graph Protocol. It serves three user types:

| Role | Actor | Capability |
|---|---|---|
| **NUC Admin** | Regulatory authority (NUC) | Approve / reject institution registrations, view statistics |
| **Institution** | NUC-accredited university | Issue, revoke, and track certificates |
| **Public Verifier** | Employer / admissions officer | Verify any certificate — no wallet required |

---

## 2. Live Demo

**Portal URL:** https://mrdolph.github.io/certiVerf/

**Test certificate hash (for verification demo):**
```
0x0ffdf8e50a445961d32e8d85dddcb73106185a8d70345d35dda551b06f030dba
```
Paste this into the Verify Certificate portal to see a live result from the blockchain — or scan the QR code from a mobile device to auto-verify.

**The Graph Subgraph (GraphQL):**
```
https://api.studio.thegraph.com/query/1756477/certiverf/v0.0.1
```

---

## 3. System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         ACTORS                               │
│   NUC Admin Wallet    Institution Wallet    Any Browser      │
└──────────┬───────────────────┬──────────────────┬───────────┘
           │                   │                  │
           ▼                   ▼                  ▼
┌──────────────────────────────────────────────────────────────┐
│       CertiVerf Portal (index.html + scripts.js)             │
│  ┌──────────────────┐  ┌─────────────────┐  ┌────────────┐  │
│  │  Landing Page    │  │ Role Detection  │  │ Session    │  │
│  │  Role Selector   │→ │ (on-chain check)│  │ Storage    │  │
│  └──────────────────┘  └─────────────────┘  └────────────┘  │
│  ethers.js v6 — BrowserProvider (write) / JsonRpcProvider    │
└──────────────────────────────┬───────────────────────────────┘
                               │
              ┌────────────────┴────────────────┐
              ▼                                 ▼
┌─────────────────────┐             ┌───────────────────────┐
│  InstitutionRegistry│◄──checks────│  CertificateRegistry  │
│  .sol               │             │  .sol                 │
└─────────────────────┘             └───────────────────────┘
              │                                 │
              └──────────────┬──────────────────┘
                             ▼
            ┌────────────────────────────────┐
            │  Polygon Amoy Testnet          │
            │  Chain ID: 80002               │
            └────────────────────────────────┘
                   │                    │
        (off-chain storage)    (event indexing)
                   ▼                    ▼
      ┌─────────────────────┐  ┌──────────────────────┐
      │  IPFS via Pinata    │  │  The Graph Protocol  │
      │  Certificate PDFs   │  │  GraphQL Subgraph    │
      └─────────────────────┘  └──────────────────────┘
```

---

## 4. Smart Contracts

### Deployed Addresses — Polygon Amoy Testnet

| Contract | Address | Sourcify |
|---|---|---|
| `InstitutionRegistry.sol` | `0x5416e493590141D710F367afA994F97A58116834` | [View verified source](https://repo.sourcify.dev/80002/0x5416e493590141D710F367afA994F97A58116834/) |
| `CertificateRegistry.sol` | `0x30d5AEa8d649856a7f986d8D41DA314145Ecd6f5` | [View verified source](https://repo.sourcify.dev/80002/0x30d5AEa8d649856a7f986d8D41DA314145Ecd6f5/) |

**Deploying wallet:** `0x44F586b4991B622fC44b31225aAE0B85415EfB6e` (Fatai CertiVerf Wallet — NUC Admin)

### InstitutionRegistry.sol

```
requestRegistration(name, acronym, website)  → any wallet
approveRegistration(wallet)                   → owner only (NUC)
rejectRegistration(wallet)                    → owner only (NUC)
isRegistered(wallet)                          → public view
getInstitution(wallet)                        → public view
getPendingInstitution(wallet)                 → public view
```

### CertificateRegistry.sol

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
| `docHash` | `bytes32` | Browser SHA-256 | PDF document fingerprint |
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

**metaHash** — computed ON-CHAIN:
```solidity
bytes32 metaHash = keccak256(abi.encodePacked(
    msg.sender, _input.studentId, _input.programme, _input.completionYear
));
```

**docHash** — computed IN THE BROWSER:
```javascript
const hashBuffer = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
const docHash = '0x' + Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
```

Both stored permanently on-chain. All prior systems reviewed — including ShikkhaChain (Farabi et al., 2025) — store only the IPFS CID without a separate document fingerprint.

### 5.2 No Post-Issuance Modification
Immutability enforced structurally. No update function exists. CertiQ's `updateIpfsHash()` vulnerability is explicitly excluded.

### 5.3 Institution Name from Registry
`institutionName` derived from `registry.getInstitution(msg.sender)` — not user input. Prevents institution identity fraud.

### 5.4 Wallet-Free Public Verification
`ethers.js JsonRpcProvider` — read-only. No MetaMask, no wallet, no gas required for verification.

### 5.5 Two-Contract Architecture
InstitutionRegistry (governance) separated from CertificateRegistry (records). NUC admin role encoded in contract ownership.

---

## 6. Frontend Portal — CertiVerf

Three files: `index.html` (structure), `scripts.js` (logic), `styles.css` (Nigerian green/gold theme).

### Landing Page
Full-screen role selector on first visit. Three cards: Verify Certificate, Institution Portal, NUC Admin. `sessionStorage` remembers chosen role — refresh skips landing. **Change Role** button in header returns to landing.

### NUC Admin Portal
- Pending applications queue (auto-loads)
- Look Up tool with inline Approve/Reject buttons
- Registered Institutions table (The Graph)
- Certificate Statistics — total issued + per-institution breakdown (The Graph)

### Institution Portal
- NUC registration form
- Certificate issuance with auto SHA-256 PDF fingerprinting (Web Crypto API)
- Certificate history (The Graph) with **Valid/Revoked status badge** + **CSV export**
- Certificate revocation with mandatory on-chain reason
- QR code generation after issuance

### Mobile Experience
- **Hamburger sidebar menu (☰)** — on mobile, all wallet controls (connect, disconnect, change role, wallet address, network status) move into a clean slide-in right drawer keeping the header uncluttered
- Responsive landing cards — 1 column on phones, 2 on tablets
- Horizontal-scroll tables on narrow screens
- Touch-friendly button sizing throughout
- Single-column form layout on mobile

### Public Verification Portal
- Wallet-free — JsonRpcProvider
- 🛡️ Animated green shield for VALID / 🚫 Red shake for REVOKED
- Auto-verification from URL `?hash=0x...` — QR scan triggers immediately
- Print / Save PDF

---

## 7. The Graph Subgraph

**GraphQL Endpoint:** `https://api.studio.thegraph.com/query/1756477/certiverf/v0.0.1`

**GraphQL New Endpoint:** `https://api.studio.thegraph.com/query/1756477/certiverf/version/latest`

Indexed entities: `RegistrationRequested`, `RegistrationApproved`, `CertificateIssued`, `CertificateRevoked`

**Example query:**
```graphql
{
  certificateIssueds(
    where: { issuer: "0x44f586b4991b622fc44b31225aae0b85415efb6e" }
    orderBy: issuedAt orderDirection: desc
  ) { metaHash studentName studentId programme issuedAt }
}
```

**Redeploy:**
```bash
cd certiverf && graph auth --studio YOUR_KEY && npm run deploy
```

---

## 8. Technology Stack

| Technology | Version | Role |
|---|---|---|
| Solidity | `^0.8.20` | Smart contract language |
| Polygon Amoy Testnet | Chain ID: 80002 | Deployment blockchain |
| Remix IDE | 2.5.1 | Development and deployment |
| ethers.js | v6 (CDN) | Frontend blockchain library |
| Alchemy | Free tier | Dedicated RPC endpoint |
| MetaMask | Browser extension | Transaction signing wallet |
| IPFS via Pinata | — | Off-chain certificate document storage |
| Sourcify | Decentralised | Smart contract source verification |
| Web Crypto API | Browser native | SHA-256 PDF fingerprinting |
| The Graph Protocol | v0.0.1 | Decentralised blockchain event indexing |
| GitHub Pages | — | Frontend hosting |

---

## 9. Repository Structure

```
certiVerf/
├── index.html                      # Portal HTML structure
├── scripts.js                      # Portal JavaScript logic
├── styles.css                      # Portal styles (Nigerian green/gold)
├── contracts/
│   ├── InstitutionRegistry.sol     # Governance contract
│   └── CertificateRegistry.sol    # Certificate lifecycle contract
├── certiverf/                      # The Graph subgraph
│   ├── schema.graphql              # Entity definitions
│   ├── subgraph.yaml               # Subgraph manifest
│   └── src/                        # Mapping handlers
├── diagrams/
│   ├── use_case_diagram.html
│   ├── sequence_issuance.html
│   └── sequence_verification.html
└── README.md
```

---

## 10. Setup and Deployment Guide

### Prerequisites
- MetaMask installed · Polygon Amoy added (Chain ID: 80002)
- Test POL from [faucet.polygon.technology](https://faucet.polygon.technology)
- Alchemy free account for dedicated RPC

### Gas Settings (always use these)
MetaMask Advanced: Priority Fee = **65 Gwei**, Max Fee = **70 Gwei**  
Gas Limit: **300,000** for most functions · **500,000** for `issueCertificate`

### Load Existing Contracts in Remix
1. Open `InstitutionRegistry.sol` → Compile → **Add Contract** → paste `0x5416e493590141D710F367afA994F97A58116834`
2. Open `CertificateRegistry.sol` → Compile → **Add Contract** → paste `0x30d5AEa8d649856a7f986d8D41DA314145Ecd6f5`

> **CRITICAL:** Never replay saved Remix scenarios with MetaMask/Injected Provider selected — this deploys new contracts on-chain and spends real POL. Always switch to Remix VM before replaying scenarios.

### Deploy to GitHub Pages
```bash
git add . && git commit -m "deploy" && git push
```
GitHub repo → Settings → Pages → Source: main branch → Save.

---

## 11. How to Use Each Portal

### Landing Page
Open the portal. Click your role card. On refresh, your last portal opens automatically. Use **Change Role** in the header to switch roles.

### NUC Admin
Connect deployer wallet → Pending Applications auto-loads → Approve/Reject → view Registered Institutions and Statistics.

### Institution — Registration
Connect institution wallet → fill Name, Acronym, Website → Submit → wait for NUC approval.

### Institution — Issuance
Upload PDF (SHA-256 auto-computed) → upload same PDF to Pinata → paste CID → fill student details → Issue Certificate → copy metaHash + QR code.

### Public Verification
Open portal → click Verify Certificate → paste metaHash or scan QR → result in under 2 seconds.

---

## 12. Test Scenarios and Results

| Test | Scenario | Result |
|---|---|---|
| T-01 | Institution registration request | ✓ RegistrationRequested event emitted |
| T-02 | Duplicate registration | ✓ Reverted: "already pending" |
| T-03 | NUC Admin approves | ✓ RegistrationApproved event emitted |
| T-04 | Certificate issuance | ✓ metaHash `0x0ffdf8...30dba` generated on-chain |
| T-05 | Unregistered wallet attempts issuance | ✓ Reverted: "not a registered institution" |
| T-06 | Public verification of valid certificate | ✓ Full struct returned, isValid: true |
| T-07 | Certificate revocation | ✓ CertificateRevoked event with reason + timestamp |
| T-08 | Verification of revoked certificate | ✓ isValid: false, revokeReason returned |

### Performance

| Metric | Result | Target |
|---|---|---|
| Gas — issueCertificate | 398,016 units | < 0.01 POL |
| Gas — verifyCertificate | FREE (view) | FREE |
| Verification response time | < 2 seconds | < 5 seconds |
| Fraud detection rate | 100% (3/3) | 100% |
| ShikkhaChain comparison | ~1,289,600 gas | CertiVerf is ~3× more efficient |

---

## 13. Known Issues and Learnings

### EVM Stack Too Deep
**Problem:** 8 parameters exceeded the EVM's 16-slot stack limit.  
**Solution:** `CertificateInput` struct — one memory reference, one stack slot. Also reduced gas ~70%.

### Alchemy eth_getLogs Block Range Limit
**Problem:** Alchemy free tier limits `eth_getLogs` to 10 blocks — prevented historical event queries.  
**Solution:** Integrated The Graph Protocol. All event queries now use GraphQL with no block range restrictions.

### Accidental Contract Redeployments
**Problem:** Replaying Remix scenarios with MetaMask selected deploys new contracts on-chain.  
**Solution:** Always switch to Remix VM before replaying. Use Add Contract (not Deploy) to load existing contracts.

### Gas Price Below Minimum
**Problem:** Transactions failed with `gas tip cap below minimum`.  
**Solution:** All write functions include explicit gas overrides (65 Gwei priority, 70 Gwei max). `issueCertificate` uses 500,000 gas limit (actual cost: 398,016).

### MetaMask User Rejection (wallet_requestPermissions)
**Behaviour:** When the user cancels the MetaMask account selector popup, error code `4001` is returned. This is expected Web3 behaviour — not a system error.
**Handling:** The portal catches this silently, resets the Connect Wallet button, and does not log to the console. Genuine errors are still logged.

---

### master vs main Branch
**Problem:** Local `git init` creates `master`; GitHub defaults to `main`.  
**Solution:** `git branch -m master main` then pull with `--allow-unrelated-histories`.

---

### IPFS CID Workflow and Immutability Trade-off
**Design decision:** The system has no post-issuance modification function — immutability is enforced structurally. This means an IPFS CID cannot be retroactively added to a certificate issued without one.

**Correct workflow:** Upload PDF to Pinata first → copy CID → issue certificate with CID included → metaHash and QR generated on-chain → print QR on physical certificate.

**Future enhancement:** For certificates intentionally issued without a CID during prototype testing, a restricted `addIpfsCid()` function could permit one-time CID assignment — only where the field is empty — while continuing to prohibit substitution of an existing CID. This is a recommended next-version enhancement, not a limitation of the current implementation.

---

### IPFS Single-Provider Dependency
**Risk:** Pinata is a private commercial entity. If it ceases operations, document retrieval fails — though on-chain metaHash and docHash evidence survives permanently.

**Recovery:** Because IPFS uses content addressing, re-uploading the same PDF to any IPFS provider anywhere produces the identical CID. No blockchain transactions needed.

**Recommended progression (Chapter 5, Section 5.6.8):**
1. Commercial pinning (Pinata/Infura) — immediate, foreign dependency
2. Dedicated NUC IPFS node — sovereign, within Nigeria
3. Federated model — each of 170 universities runs its own node, NUC holds national backup
4. NITDA national IPFS infrastructure — aligned with the NERD Policy framework

---

## 14. How This Differs from Existing Systems

| Feature | Verifi-Chain (2023) | ShikkhaChain (2025) | CertiQ (n.d.) | **CertiVerf** |
|---|---|---|---|---|
| Dual-hash: metaHash + docHash | ✗ | ✗ | ✗ | **✓** |
| PDF SHA-256 browser fingerprint | ✗ | ✗ | ✗ | **✓** |
| No post-issuance modification | ~ | ~ | ✗ | **✓** |
| Institution name from on-chain registry | ✗ | ✗ | ✗ | **✓** |
| Wallet-free public verification | ✗ | ~ | ~ | **✓** |
| Two-contract architecture | ✗ | ✗ | ✗ | **✓** |
| QR auto-verification (URL, no wallet) | ✗ | ~ (future work) | ~ | **✓** |
| The Graph decentralised event indexing | ✗ | ✗ | ✗ | **✓** |
| Certificate history (unlimited range) | ✗ | ✗ | ✗ | **✓** |
| Certificate statistics per institution | ✗ | ✗ | ✗ | **✓** |
| Role selection landing page | ✗ | ✗ | ✗ | **✓** |
| Nigerian regulatory context (NUC/NCVS) | ✗ | ✗ | ✗ | **✓** |
| Positioned against an operational system | ✗ | ✗ | ✗ | **✓** |
| The Graph decentralised event indexing | ✗ | ✗ | ✗ | **✓** |
| Certificate statistics per institution (NUC dashboard) | ✗ | ✗ | ✗ | **✓** |
| CSV export for institutions and certificates | ✗ | ✗ | ✗ | **✓** |
| Valid/Revoked status in certificate history | ✗ | ✗ | ✗ | **✓** |
| National IPFS infrastructure recommendation (NITDA) | ✗ | ✗ | ✗ | **✓** |
| Mobile sidebar drawer for wallet controls | ✗ | ✗ | ✗ | **✓** |

---

## 15. References

- Akuma, C. F., Garba, E. J., Usman, M., & Kadams, A. A. (2024). *International Journal of Development Mathematics*, *1*(2), 227–236. https://doi.org/10.62054/ijdm/0102.19

- Effiong, M. E. (2020). [Master's thesis, Tallinn University of Technology]. https://digikogu.taltech.ee/et/Download/1fe667ff-d131-432b-b758-061b9d4348d1

- Farabi, A., Khandaker, I., Ahsan, J., Shanto, I. K., Jahan, N., & Khan, M. J. (2025). *arXiv preprint arXiv:2508.05334*. https://arxiv.org/abs/2508.05334

- Federal Republic of Nigeria. (2025). *NERD Regulation, Official Gazette No. 200*. Federal Government Press.

- Hevner, A. R., March, S. T., Park, J., & Ram, S. (2004). *MIS Quarterly*, *28*(1), 75–106. https://doi.org/10.2307/25148625

- Marikkal, A. (n.d.). *CertiQ* [Source code]. https://github.com/AdithyanMarikkal/CertiQ

- Ogbonnia, O. O., & Chiamaka, E. B. (2022). *International Journal of Advances in Engineering and Management*, *4*(11), 264–270. https://doi.org/10.35629/5252-0411264270

- Peffers, K., Tuunanen, T., Rothenberger, M. A., & Chatterjee, S. (2007). *Journal of Management Information Systems*, *24*(3), 45–77.

- Polygon Technology. (2024). *Introducing the Amoy testnet for Polygon PoS*. https://polygon.technology/blog/introducing-the-amoy-testnet-for-polygon-pos

- Rahman, T., Mouno, S. I., Raatul, A. M., Al Azad, A. K., & Mansoor, N. (2023). In *Inventive Communication and Computational Technologies* (pp. 355–366). Springer. https://doi.org/10.1007/978-981-99-5166-6_24

- Rustemi, A., Dalipi, F., Atanasovski, V., & Risteski, A. (2023). *IEEE Access*, *11*, 64,679–64,696. https://doi.org/10.1109/ACCESS.2023.3289598

- Tal, Y., Ramirez, B., & Pohlmann, J. (2018). *The Graph: A decentralized query protocol for blockchain data* [White paper]. https://github.com/graphprotocol/research/blob/master/papers/whitepaper/the-graph-whitepaper.pdf

- The Graph Foundation. (2024). *About The Graph*. https://thegraph.com/docs/en/about/

---

## Licence

This project is developed as an academic thesis prototype at the National Open University of Nigeria and is made publicly available for research and educational purposes.

---

*CertiVerf · Dawodu Fatai Olalekan · NOU234249189 · MSc CIT899 · NOUN Lagos Mainland I · 2026*



# Certiverf Phase 4: additive V1-safe presented-PDF verification ## 12/11/2026 ##

## Apply
From `C:\DevCorner\certiverf` (back up existing files first):

1. Copy `index.html` and `scripts.js` from this ZIP into the folder containing your existing `index.html` and `scripts.js` (the repository root in the supplied archive).
2. Run a local static HTTP server, e.g. `npx --yes http-server . -p 8085 -c-1`.
3. Open `http://localhost:8085` and use Public Verification.

## Test
- Enter a real *registered* V1 `metaHash`, upload the original registered PDF, and select Verify. Expect PDF MATCH only if its registered `docHash` is the same SHA-256.
- Use the same `metaHash` with a modified PDF. Expect PDF MISMATCH.
- Use a valid `metaHash` without PDF. The existing blockchain-only verification still works.
- An unregistered metaHash must return not found; do not use a PDF SHA-256 as the metaHash.
- For a certificate registered with placeholder or wrong docHash, the correct result is MISMATCH or INCONCLUSIVE, not MATCH.

## Scope and limitations
- Preserves original CSS, existing tabs, QR, result card and contract addresses.
- Does not change Solidity contracts, deploy V2.1, integrate Pinata automatically, or upload presented PDFs to any backend.
- Existing manual CID entry remains until secure server-side Pinata credentials are available.
- Issuance now requires a PDF and recomputes SHA-256 at submission to avoid the prior hardcoded placeholder docHash.
- The document check validates exact PDF bytes, not student identity or the truthfulness of institution claims.
- `crypto.subtle` requires localhost or HTTPS.
- V1's publicly stored student PII remains a separate privacy issue; use fictitious test data.

## Suggested commit
feat(certiverf): verify presented PDFs against V1 on-chain docHash while preserving portal UI

==========================================================================================================================================================

# Phase 4.1 — Correct combined verification verdict

This is a **minimal logic-only correction** to the Phase 4 patch. It does not alter `index.html`, `styles.css`, Solidity contracts, wallet settings, or deployments.

## Install
1. Back up `C:\DevCorner\certiverf\scripts.js`.
2. Replace only that file with `scripts.js` from this ZIP (in the folder containing your current `index.html`).
3. Run `npx --yes http-server . -p 8085 -c-1` from the application directory, and hard-refresh the local page.

## Expected results
- Valid blockchain record + original matching PDF: `CERTIFICATE VERIFIED`.
- Valid blockchain record + changed PDF: `DOCUMENT VERIFICATION FAILED` (with the PDF mismatch diagnostic).
- Valid blockchain record + no PDF: `BLOCKCHAIN RECORD VALID` (PDF not checked).
- Valid blockchain record + unusable docHash or hash-calculation error: `DOCUMENT VERIFICATION INCONCLUSIVE`.
- Revoked blockchain record: `CERTIFICATE REVOKED`, regardless of PDF match.
- Changing the PDF clears/hides the prior result until Verify is clicked again.

## Validation
`node --check scripts.js` passed. Browser/on-chain integration still requires local testing. No contract or IPFS changes.

## Suggested commit
`fix(verification): align overall certificate verdict with presented-PDF integrity`

=========================================================================================================================================================

# Certiverf Phase 4.2 — automatic Pinata upload (V1-safe)

## Contents
- `index.html` and `scripts.js`: full Phase 4.1-compatible frontend with minimal changes to existing issuance form; original `styles.css` unchanged.
- `server.cjs`: localhost backend, Pinata JWT stays server-side.
- `.env.example`: backend configuration. The existing project `package.json` is deliberately preserved.

## Installation
1. Back up `C:\DevCorner\certiverf\index.html` and `scripts.js`.
2. Copy the files in this ZIP to `C:\DevCorner\certiverf` (do not delete existing files, `styles.css`, contracts, etc.).
3. Run `cd C:\DevCorner\certiverf` then `npm install --no-save express@4 multer@1 ethers@6 dotenv@16`.
4. Copy `.env.example` to `.env`. Set PINATA_JWT, AMOY_RPC_URL and the **deployed V1** InstitutionRegistry address (the same as REGISTRY_ADDR in scripts.js). Do not share JWT or commit .env.
5. Stop the previous `http-server` on port 8085; run `node server.cjs`.
6. Open `http://localhost:8085` and connect an **approved institution** wallet.
7. Select a PDF, complete fields, click Issue Certificate. Sign the *upload challenge* first, wait for Pinata upload + retrieval check, then sign the **separate blockchain issuance transaction**.
8. Verify the issued metaHash with the original PDF; then test a modified PDF and no-PDF lookup.

## Important safeguards / limitations
- No token in browser; server verifies signed challenge, SHA-256 and on-chain institution registration.
- Upload succeeds only if the gateway returns identical bytes. Gateway propagation delay can cause an issuance stop; uploaded Pinata object may remain pinned. Retry if needed.
- This **does not deploy V2.1** or modify the live V1 deployment. V1 contract still exposes plaintext student data on chain; use synthetic demo certificates only.
- PDF is publicly retrievable by CID; do not upload private student data until encryption/access-control design is completed.
- The backend is intended for **local controlled testing**, not production deployment. Before production add HTTPS, persistent nonce store, rate limiting, upload quotas, malware screening, logging policy and secret management.
- A valid signed challenge authenticates a wallet, not the truth of a certificate's claims.
- Original `styles.css` remains untouched; `stuIpfs` is read-only to avoid accidental CID/PDF mismatch.
- Node 20+ required. If `npm install` conflicts with root Hardhat dependencies, install server dependencies in an isolated server package and adjust startup paths rather than forcing peer dependency overrides.

=========================================================================================================================================================

# Certiverf Phase 4.3 — Institutional IPFS Inventory (Stage 1)

## Scope
Incremental backend-only upgrade built on the Phase 4.2 server. **Does not replace your current `scripts.js`, `index.html`, or `styles.css`.** The original interface and working issuance remain unchanged.

New uploads are tagged in Pinata metadata with an NUC-controlled `institution_code`, and recorded in a server-only JSONL inventory after the backend verifies retrieved IPFS PDF bytes against SHA-256. CLI tools list, export and independently download/hash-audit files by institution.

**Important limitations:** This is a prototype operational inventory, not a fully governed production registry. It does NOT confirm that a blockchain issuance transaction succeeded; records are `uploaded_unconfirmed`. It does NOT automatically migrate to a second provider, synchronize pre-existing Pinata files, encrypt PDFs, or provide an NUC admin web dashboard. Do not use real student PDFs until privacy controls are implemented.

## Install on Windows PowerShell

1. Back up your working Certiverf folder (especially `server.cjs`, `.env`, and your current frontend).
2. Extract ZIP; copy only `server.cjs`, `storage-inventory.cjs`, and `storage-admin.cjs` to `C:\DevCorner\certiverf`.
3. Create `C:\DevCorner\certiverf\private` and copy `private\institutions.example.json` to `private\institutions.json`.
4. Edit `private\institutions.json`: one entry per approved institution, with its actual V1 registered wallet. Example AFUT is a TEST mapping; update it if needed.
5. Add to your existing `.env` (keep all existing credentials and RPC settings):
   ```
   CERTIVERF_INSTITUTIONS_FILE=./private/institutions.json
   CERTIVERF_INVENTORY_FILE=./private/inventory.jsonl
   ```
6. Add `private/`, `.env`, and `audit-exports/` to `.gitignore`. Never commit wallet maps or inventories containing sensitive metadata.
7. Stop your current server; restart from project root: `node server.cjs`.
8. Upload a *synthetic* PDF through your unchanged institution portal. Backend checks that the wallet is registered on-chain and mapped to an institution; returns CID as before.
9. In a separate PowerShell window:
   ```
   node storage-admin.cjs list AFUT
   node storage-admin.cjs export AFUT afut-inventory.json
   node storage-admin.cjs audit AFUT audit-exports/AFUT
   ```
   `audit` retrieves every matching CID and compares bytes/size/SHA-256; report at `audit-exports/AFUT/audit-manifest.json`. **This downloads local verified copies, not a second-provider migration.**

## Operational safeguards
- Backend derives institution code from NUC-controlled wallet map; client cannot supply it.
- Pinata `pinataMetadata.keyvalues` includes only institution code, document hash and schema; **not student names, emails or IDs**.
- Inventory appends only after gateway retrieval and SHA-256 verification.
- Institution map and inventory blocked from HTTP static serving under `/private`.
- Existing PDFs are not automatically inventoried; reconcile historic uploads separately.
- JSONL append is suitable for a single local server process. For concurrent production servers, replace with a transactional database, uniqueness constraints, backup/restore and audit logs.
- CID does not guarantee long-term availability. Audit regularly; add independent replica pinning in Stage 2.
- Treat all public IPFS PDF contents as publicly retrievable, regardless of Pinata groups or metadata.

## Next Stage (not included)
- Receipt-confirmed inventory state (`issued`, `revoked`, `failed`), with idempotent reconciliation against Polygon Amoy.
- NUC authenticated dashboard and provider-to-provider migration with verified repinning.
- Backfill historic CIDs, encryption, retention/access policies, and multi-institution governance tests.


=====================
# Certiverf Phase 4.4.1 — integrated NUC storage monitoring

This patch **does not add a separate page**. It extends the existing `pane-admin` in `index.html`, preserving the existing role selection, NUC institution approval, issuance and verification flows.

## Apply (Windows Git Bash)

1. Back up your current `index.html`, `scripts.js`, and `server.cjs` (or commit them before applying).
2. Copy the three files from this ZIP into `C:\DevCorner\certiverf` and overwrite the matching originals. Do not replace any other files.
3. Run `node --check server.cjs` and `node --check scripts.js`.
4. Start the existing local server with `node server.cjs` and open `http://127.0.0.1:8085/`.
5. Choose **NUC Admin**, connect the InstitutionRegistry contract-owner wallet, then click **Refresh** on **Institutional Storage Monitoring**. MetaMask prompts for a one-time authentication signature.
6. Verify existing certificate issuance and verification before committing.

## Security / limitations

- The API verifies a wallet-signed, single-use challenge against the on-chain InstitutionRegistry owner, and requires an expiring bearer session. Tokens are in-memory only and are not saved to browser storage.
- This is a read-only local prototype, not production authentication. Use HTTPS and production-grade rate limiting, persistence and auditing before deployment.
- This page reports **inventory records**, not confirmed blockchain issuance counts. It does not display student names, PDF hashes, CIDs or certificate content.
- Existing `storage/` and `private/` are never modified by this patch.
- For safety, the server blocks direct static access to storage directories and administrative `.cjs` source files. Review broader static serving before exposing this server publicly.
- The backend uses `INSTITUTION_REGISTRY_ADDRESS` and `AMOY_RPC_URL` from `.env`. These must match the contract and chain used by `scripts.js`.


==================
# Certiverf Phase 4.4.2 — safe directory enhancement

Changes: searchable registered institution directory, live V1 registration checks, details view, pending reapplication handling, escaped institution names/websites, removal of fixed gas fees on approval/rejection. Existing NUC portal and design preserved. No V2.1 transaction controls are activated. No server.cjs change.

## Install (Git Bash)
Extract this ZIP to a separate folder. Run `bash patches/install-phase442.sh` from that extracted folder. The installer targets `/c/DevCorner/certiverf`, verifies SHA-256 of all three source files, creates a backup, and refuses to overwrite modified baselines.

## Validate
`node --check scripts.js`
`npx hardhat test`
Open the existing NUC dashboard, connect owner wallet, refresh registered institutions, test search/details and pending applications. Verify existing certificate issuance and public verification remain operational. Do not commit/deploy until browser checks pass.

## Limitations
The Graph first 1,000 approval/request events; not exhaustive pagination. V1 only provides registration status, not suspension/revocation state. Pending applications rely on indexed requests plus live `getPendingInstitution` checks. Existing other HTML rendering paths are not comprehensively security-audited. No deployed V2.1 integration or on-chain deployment.
