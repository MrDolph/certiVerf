# Certiverf Phase 3 — presented-PDF integrity prototype

This is a **standalone experimental prototype**, not a replacement for `scripts.js` and not a live blockchain verifier. It is deliberately separate because V2.1 is **not yet deployed** and the existing portal still uses V1.

## Install
Copy `verify-presented-pdf.html` and `pdf-integrity.js` into the same directory, e.g. `C:\DevCorner\certiverf\phase3\`. Do not overwrite the existing `index.html` or `scripts.js`.

From PowerShell in `C:\DevCorner\certiverf`:

```powershell
node .\phase3\test-pdf-integrity.cjs
npx http-server .\phase3 -p 8085 -c-1
```

If `http-server` is unavailable, run `npx --yes http-server .\phase3 -p 8085 -c-1` or use VS Code Live Server. Visit `http://localhost:8085/verify-presented-pdf.html`.

## Test procedure
1. Use a fictitious sample certificate PDF (no real student personal data). Compute its SHA-256 digest in PowerShell:

```powershell
(Get-FileHash -Algorithm SHA256 'C:\path\to\sample.pdf').Hash
```

2. Prefix the resulting 64-character hex digest with `0x`; paste it into the registered hash field. Upload the same PDF. Expect MATCH **only if** you manually select `Valid` status; otherwise REVIEW.
3. Modify one byte in a *copy* of the PDF, or re-export a changed PDF. Upload the modified file against the original digest; expect MISMATCH.
4. For a genuine blockchain experiment, the `docHash` must be captured from a **successfully issued record on the deployed V2.1 contract**, and the file must be the actual presented PDF. Since V2.1 is not yet deployed, do not claim this step has occurred.

## Caveats
- The PDF is hashed locally in the browser using Web Crypto SHA-256. The file is not uploaded by this module.
- This is a byte-exact comparison: even metadata-only changes can produce a mismatch. That is expected, not evidence of semantic forgery.
- The manual on-chain status dropdown is **not trustworthy** for public verification. It exists only to distinguish hash-integrity experiments from on-chain status checks. It must be replaced with a real read-only V2.1 contract query after deployment.
- The sample automated tests use synthetic PDF-like byte strings and do not constitute a real-PDF tamper-detection evaluation.
- A valid digest does not establish holder identity, issuer truthfulness, or authenticity of a printed certificate.
- Test 20–30 real, fictitious certificate PDFs and specified modifications later; log sample IDs, original hash, modified hash, modification class, expected and actual result, and test environment. Do not report unperformed experiments.
