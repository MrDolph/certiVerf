'use strict';
require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { getInstitution, appendInventory, inventoryFile } = require('./storage-inventory.cjs');

const [metaHash, expectedCode] = process.argv.slice(2);
const fail = msg => { throw new Error(msg); };
const isHash = x => /^0x[0-9a-fA-F]{64}$/.test(x || '');
const isCid = x => /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z2-7]+)$/.test(x || '');
async function main() {
  if (!isHash(metaHash) || !/^[A-Z0-9_-]{2,24}$/.test(expectedCode || ''))
    fail('Usage: node storage-reconcile.cjs 0x<METAHASH> INSTITUTION_CODE');
  const rpc = process.env.AMOY_RPC_URL;
  const contractAddress = process.env.CERTIFICATE_REGISTRY_ADDRESS ||
    '0x30d5AEa8d649856a7f986d8D41DA314145Ecd6f5';
  if (!rpc || !ethers.isAddress(contractAddress)) fail('Missing RPC or valid certificate registry address');
  const provider = new ethers.JsonRpcProvider(rpc);
  const net = await provider.getNetwork();
  if (net.chainId !== 80002n) fail(`Wrong network: expected Polygon Amoy (80002), got ${net.chainId}`);
  const contract = new ethers.Contract(contractAddress, [
    'function verifyCertificate(bytes32) view returns ((bytes32 metaHash,bytes32 docHash,string ipfsCid,string institutionName,string institutionAcronym,string programme,string degreeClass,string studentName,string studentId,string email,uint256 completionYear,uint256 issuedAt,address issuer,bool isValid,string revokeReason,uint256 revokedAt))'
  ], provider);
  const c = await contract.verifyCertificate(metaHash);
  if (c.issuer === ethers.ZeroAddress || c.metaHash.toLowerCase() !== metaHash.toLowerCase())
    fail('No matching issued certificate exists on-chain');
  const inst = getInstitution(c.issuer);
  if (!inst || inst.code !== expectedCode) fail('On-chain issuer does not match NUC wallet mapping and institution code');
  if (!isCid(c.ipfsCid) || !isHash(c.docHash)) fail('On-chain certificate CID or document hash is invalid');
  const gateway = (process.env.PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud').replace(/\/$/, '');
  const response = await fetch(`${gateway}/ipfs/${encodeURIComponent(c.ipfsCid)}`, {signal: AbortSignal.timeout(45000)});
  if (!response.ok) fail(`IPFS retrieval failed (HTTP ${response.status})`);
  const length = Number(response.headers.get('content-length') || 0);
  if (length > 10 * 1024 * 1024) fail('IPFS document exceeds 10MB audit limit');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const {done,value} = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 10 * 1024 * 1024) { await reader.cancel(); fail('IPFS document exceeds 10MB audit limit'); }
    chunks.push(Buffer.from(value));
  }
  const bytes = Buffer.concat(chunks);
  if (bytes.subarray(0,5).toString() !== '%PDF-') fail('IPFS object is not a PDF');
  const digest = '0x' + crypto.createHash('sha256').update(bytes).digest('hex');
  if (digest.toLowerCase() !== c.docHash.toLowerCase()) fail('SHA-256 mismatch between IPFS PDF and on-chain docHash');
  const rows = fs.existsSync(inventoryFile)
    ? fs.readFileSync(inventoryFile,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse)
    : [];
  const matches = rows.filter(r => (r.metaHash || '').toLowerCase() === metaHash.toLowerCase() ||
    (r.cid === c.ipfsCid && (r.docHash || '').toLowerCase() === digest.toLowerCase()));
  if (matches.length) {
    console.log(`Already inventoried (${matches.length} matching record(s)); no duplicate added.`);
    return;
  }
  const row = appendInventory({
    institutionCode: inst.code,
    institutionName: inst.name,
    wallet: ethers.getAddress(c.issuer),
    metaHash: c.metaHash,
    cid: c.ipfsCid,
    docHash: digest,
    size,
    uploadedAt: null,
    reconciledAt: new Date().toISOString(),
    status: c.isValid ? 'onchain_verified' : 'onchain_revoked',
    source: 'polygon-amoy-v1-reconciliation',
    contractAddress: ethers.getAddress(contractAddress),
    originalFileName: 'historical-certificate.pdf'
  });
  console.log(`Reconciled ${row.recordId} for ${inst.code}; ${size} PDF bytes verified.`);
  console.log(`Inventory: ${inventoryFile}`);
}
main().catch(e => { console.error('Reconciliation failed:', e.message); process.exitCode = 1; });
