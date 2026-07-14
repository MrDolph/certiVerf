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
- Certificate history (The Graph)
- Certificate revocation with mandatory on-chain reason
- QR code generation after issuance

### Public Verification Portal
- Wallet-free — JsonRpcProvider
- 🛡️ Animated green shield for VALID / 🚫 Red shake for REVOKED
- Auto-verification from URL `?hash=0x...` — QR scan triggers immediately
- Print / Save PDF

---

## 7. The Graph Subgraph

**GraphQL Endpoint:** `https://api.studio.thegraph.com/query/1756477/certiverf/v0.0.1`

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

### master vs main Branch
**Problem:** Local `git init` creates `master`; GitHub defaults to `main`.  
**Solution:** `git branch -m master main` then pull with `--allow-unrelated-histories`.

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