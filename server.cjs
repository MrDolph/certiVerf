'use strict';
// Node >=20. Server serves existing Certiverf static frontend and protected Pinata upload.
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { ethers } = require('ethers');
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');
const { appendInventory, getInstitution, safeFileName } = require('./storage-inventory.cjs');
const app = express();
app.disable('x-powered-by');
const PORT = Number(process.env.PORT || 8085);
const JWT = process.env.PINATA_JWT;
const RPC = process.env.AMOY_RPC_URL;
const REG = process.env.INSTITUTION_REGISTRY_ADDRESS;
if (!JWT || !RPC || !ethers.isAddress(REG || '')) {
  console.error('Missing PINATA_JWT, AMOY_RPC_URL or valid INSTITUTION_REGISTRY_ADDRESS in .env');
  process.exit(1);
}
const provider = new ethers.JsonRpcProvider(RPC);
const registry = new ethers.Contract(REG, ['function isRegistered(address) view returns (bool)'], provider);
const nonces = new Map();
const MAX = 10 * 1024 * 1024;
const uploader = multer({storage:multer.memoryStorage(), limits:{fileSize:MAX, files:1, fields:4}});
app.use((req,res,next) => {res.setHeader('Cache-Control','no-store');next();});
app.get('/api/pinata/challenge', (req,res) => {
  // Prune expired challenges; in production use Redis and per-IP rate limiting.
  const now = Date.now(); for(const [k,v] of nonces) if(v<now) nonces.delete(k);
  const nonce=crypto.randomBytes(24).toString('hex');
  nonces.set(nonce,now+120000);
  res.json({nonce});
});
app.post('/api/pinata/upload', uploader.single('file'), async (req,res) => {
  try {
    const {address,nonce,signature,docHash}=req.body || {};
    const expires=nonces.get(nonce);
    nonces.delete(nonce); // consume challenge before any await
    if(!expires || expires<Date.now()) return res.status(401).json({error:'Expired or reused upload challenge.'});
    if(!ethers.isAddress(address||'') || !/^0x[0-9a-fA-F]{64}$/.test(docHash||'')) return res.status(400).json({error:'Invalid wallet or document hash.'});
    if(!req.file || req.file.size===0 || req.file.size>MAX || !req.file.originalname.toLowerCase().endsWith('.pdf') || req.file.buffer.subarray(0,5).toString()!=='%PDF-')
      return res.status(400).json({error:'A valid PDF of at most 10 MB is required.'});
    const digest='0x'+crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    if(digest!==docHash.toLowerCase()) return res.status(400).json({error:'PDF hash changed between browser and server.'});
    const message=`Certiverf Pinata upload\nWallet: ${address}\nNonce: ${nonce}\nDocument SHA-256: ${docHash}`;
    if(ethers.verifyMessage(message,signature)!==ethers.getAddress(address)) return res.status(401).json({error:'Wallet signature invalid.'});
    if(!(await registry.isRegistered(address))) return res.status(403).json({error:'Wallet is not an approved institution.'});
    // Resolve institution identity from a trusted NUC-controlled wallet mapping.
    // Never accept a university code or name from the browser.
    const institution = getInstitution(address);
    if (!institution) return res.status(403).json({error:'Approved wallet has no NUC storage institution mapping.'});
    const form=new FormData();
    form.append('file',new Blob([req.file.buffer],{type:'application/pdf'}),path.basename(req.file.originalname));
    form.append('pinataMetadata', JSON.stringify({
      name: `${institution.code}/${new Date().getUTCFullYear()}/${digest.slice(2,18)}.pdf`,
      keyvalues: {
        institution_code: institution.code,
        document_sha256: digest.slice(2),
        archive_schema: 'certiverf-4.3'
      }
    }));
    const result=await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS',{method:'POST',headers:{Authorization:`Bearer ${JWT}`},body:form,signal:AbortSignal.timeout(60000)});
    const data=await result.json().catch(()=>({}));
    if(!result.ok || !data.IpfsHash) return res.status(502).json({error:'Pinata upload failed; no blockchain transaction submitted.'});
    // Verify retrievable content when gateway available; never treat a CID as SHA-256.
    const gateway=(process.env.PINATA_GATEWAY_URL||'https://gateway.pinata.cloud').replace(/\/$/,'');
    const retrieved=await fetch(`${gateway}/ipfs/${encodeURIComponent(data.IpfsHash)}`,{signal:AbortSignal.timeout(45000)});
    if(!retrieved.ok) return res.status(502).json({error:'IPFS upload completed but content retrieval failed; issuance stopped.'});
    const bytes=Buffer.from(await retrieved.arrayBuffer());
    if(bytes.length!==req.file.size || !crypto.timingSafeEqual(crypto.createHash('sha256').update(bytes).digest(),crypto.createHash('sha256').update(req.file.buffer).digest()))
      return res.status(502).json({error:'IPFS retrieved bytes do not match uploaded PDF; issuance stopped.'});
    // Durable local inventory, written only after verified IPFS retrieval.
    // This is an UPLOAD inventory, NOT proof of successful blockchain issuance.
    appendInventory({
      institutionCode: institution.code,
      institutionName: institution.name,
      wallet: ethers.getAddress(address),
      cid: data.IpfsHash,
      docHash: digest,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
      status: 'uploaded_unconfirmed',
      originalFileName: safeFileName(req.file.originalname)
    });
    res.json({cid:data.IpfsHash,docHash:digest,size:req.file.size,institutionCode:institution.code});
  } catch(e) { console.error('Upload error:',e.message);res.status(502).json({error:'Upload verification failed; no blockchain transaction submitted.'}); }
});
// Phase 4.4.1: read-only NUC storage overview, protected by on-chain owner wallet proof.
const adminChallenges = new Map();
const adminSessions = new Map();
const adminRegistry = new ethers.Contract(REG, ['function owner() view returns (address)'], provider);
const ADMIN_TTL = 15 * 60 * 1000;
function pruneAdmin() {
  const now = Date.now();
  for (const [key, val] of adminChallenges) if (val.expires <= now) adminChallenges.delete(key);
  for (const [key, val] of adminSessions) if (val.expires <= now) adminSessions.delete(key);
}
app.get('/api/nuc/challenge', async (req,res) => {
  pruneAdmin();
  const nonce = crypto.randomBytes(24).toString('hex');
  adminChallenges.set(nonce, { expires: Date.now() + 120000 });
  res.json({ nonce, message: `Certiverf NUC read-only dashboard access\nNonce: ${nonce}` });
});
app.post('/api/nuc/session', express.json({limit:'4kb'}), async (req,res) => {
  try {
    pruneAdmin();
    const {nonce, signature} = req.body || {};
    const challenge = adminChallenges.get(nonce);
    adminChallenges.delete(nonce);
    if (!challenge || challenge.expires <= Date.now() || typeof signature !== 'string') return res.sendStatus(401);
    const message = `Certiverf NUC read-only dashboard access\nNonce: ${nonce}`;
    const wallet = ethers.verifyMessage(message, signature);
    const owner = await adminRegistry.owner();
    if (wallet.toLowerCase() !== owner.toLowerCase()) return res.sendStatus(403);
    const token = crypto.randomBytes(32).toString('hex');
    adminSessions.set(token, { wallet: wallet.toLowerCase(), expires: Date.now() + ADMIN_TTL });
    res.json({ token, expiresInSeconds: ADMIN_TTL / 1000 });
  } catch(e) { res.status(401).json({error:'NUC wallet authentication failed.'}); }
});
app.get('/api/nuc/storage-overview', async (req,res) => {
  try {
    pruneAdmin();
    const auth = /^Bearer ([0-9a-f]{64})$/.exec(req.get('authorization') || '');
    const session = auth && adminSessions.get(auth[1]);
    if (!session || session.expires <= Date.now()) return res.sendStatus(401);
    // Revalidate owner to ensure wallet rotation immediately revokes access.
    const owner = await adminRegistry.owner();
    if (session.wallet !== owner.toLowerCase()) { adminSessions.delete(auth[1]); return res.sendStatus(403); }
    const { inventoryFile } = require('./storage-inventory.cjs');
    const counts = new Map(); let total = 0, unconfirmed = 0, reconciled = 0, malformed = 0;
    if (fs.existsSync(inventoryFile)) {
      for (const line of fs.readFileSync(inventoryFile,'utf8').split(/\r?\n/)) {
        if (!line.trim()) continue;
        try {
          const r = JSON.parse(line);
          if (typeof r.institutionCode !== 'string' || !/^[A-Z0-9_-]{2,24}$/.test(r.institutionCode)) { malformed++; continue; }
          total++;
          if (r.status === 'uploaded_unconfirmed') unconfirmed++;
          if (String(r.status || '').toLowerCase().includes('reconcil')) reconciled++;
          counts.set(r.institutionCode, (counts.get(r.institutionCode) || 0) + 1);
        } catch { malformed++; }
      }
    }
    res.json({ totalInventoryRecords:total, uploadedUnconfirmed:unconfirmed, reconciledRecords:reconciled,
      malformedRows:malformed, institutions:[...counts].sort(([a],[b])=>a.localeCompare(b)).map(([code,records])=>({code,records})),
      note:'Inventory records represent stored or reconciled files, not confirmed on-chain issuance totals.' });
  } catch(e) { console.error('NUC overview:',e.message); res.status(500).json({error:'Unable to read NUC storage overview.'}); }
});
// Prevent static downloads of administrative source files and local archives.
for (const prefix of ['/storage','/audit-exports','/storage-reconcile.cjs','/storage-inventory.cjs','/storage-admin.cjs','/server.cjs'])
  app.use(prefix, (req,res)=>res.sendStatus(403));

app.use('/api',(req,res)=>res.status(404).json({error:'Unknown API route.'}));
// Never expose NUC-controlled wallet mappings or the inventory via static serving.
app.use('/private', (req,res)=>res.sendStatus(403));
app.use('/storage-inventory.cjs', (req,res)=>res.sendStatus(403));
app.use('/storage-admin.cjs', (req,res)=>res.sendStatus(403));
app.use('/.env', (req,res)=>res.sendStatus(403));
app.use(express.static(__dirname,{index:'index.html',dotfiles:'deny'}));
app.listen(PORT,'127.0.0.1',()=>console.log(`Certiverf Phase 4.2 http://localhost:${PORT}`));
