/* Certiverf Phase 3: browser-side byte-for-byte PDF SHA-256 verification.
   No file bytes are uploaded by this module. */
(function (root) {
  'use strict';
  const HEX32 = /^0x[0-9a-fA-F]{64}$/;
  function normalizeDigest(value) {
    if (typeof value !== 'string' || !HEX32.test(value)) throw new Error('Expected a 32-byte 0x-prefixed hex digest');
    return value.toLowerCase();
  }
  async function hashFile(file) {
    if (!file || typeof file.arrayBuffer !== 'function') throw new Error('Select a PDF file');
    if (file.size === 0) throw new Error('Empty file');
    if (file.size > 25 * 1024 * 1024) throw new Error('PDF exceeds the 25 MiB limit');
    const bytes = await file.arrayBuffer();
    const header = new Uint8Array(bytes, 0, Math.min(5, bytes.byteLength));
    if (String.fromCharCode(...header) !== '%PDF-') throw new Error('File does not start with a PDF header');
    if (!root.crypto || !root.crypto.subtle) throw new Error('Web Crypto requires HTTPS or localhost');
    const digest = await root.crypto.subtle.digest('SHA-256', bytes);
    return '0x' + Array.from(new Uint8Array(digest), x => x.toString(16).padStart(2, '0')).join('');
  }
  function assess(storedHash, actualHash, recordValid, status) {
    const stored = normalizeDigest(storedHash);
    const actual = normalizeDigest(actualHash);
    if (stored !== actual) return { outcome: 'MISMATCH', detail: 'The presented PDF differs byte-for-byte from the registered document.' };
    if (recordValid === true && (status === 0 || status === 'Valid' || status === undefined))
      return { outcome: 'MATCH', detail: 'PDF bytes match the registered digest and the contract reports the certificate as currently valid. Holder identity is not established.' };
    return { outcome: 'REVIEW', detail: 'PDF bytes match, but the contract does not report the certificate as currently valid. Review revocation/institution status.' };
  }
  root.CertiverfPdfIntegrity = { hashFile, assess, normalizeDigest };
})(typeof window !== 'undefined' ? window : globalThis);
