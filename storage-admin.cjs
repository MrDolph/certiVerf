'use strict';
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { inventoryFile } = require('./storage-inventory.cjs');

const [command, rawCode, suppliedPath] = process.argv.slice(2);
const base = path.resolve(process.cwd(), 'storage', 'institutions');
const validCode = x => typeof x === 'string' && /^[A-Z0-9_-]{2,24}$/.test(x);
const usage = 'Usage: node storage-admin.cjs list [CODE] | export CODE [output.json] | audit CODE [output-directory] | export-all';
if (!['list','export','audit','export-all'].includes(command)) { console.error(usage); process.exit(2); }
if (command === 'export-all' && (rawCode || suppliedPath)) { console.error(usage); process.exit(2); }
if (command !== 'export-all' && rawCode && !validCode(rawCode)) { console.error('Invalid institution code. Use uppercase letters, digits, underscore or hyphen.'); process.exit(2); }
if (['export','audit'].includes(command) && !validCode(rawCode)) { console.error('An institution code is required.'); process.exit(2); }

function readInventory() {
  if (!fs.existsSync(inventoryFile)) return [];
  const lines = fs.readFileSync(inventoryFile,'utf8').split(/\r?\n/).filter(Boolean);
  return lines.map((line,i) => { try { return JSON.parse(line); } catch(e) { throw Error(`Malformed inventory JSON at line ${i+1}: ${e.message}`); } });
}
function ensureDirectory(folder) { fs.mkdirSync(folder,{recursive:true,mode:0o700}); }
function institutionDir(code) { return path.join(base,code); }
function writeExport(code,rows,filename) {
  const target = filename ? path.resolve(filename) : path.join(institutionDir(code),'inventory.json');
  ensureDirectory(path.dirname(target));
  const temp = `${target}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temp,JSON.stringify({schema:'certiverf-storage-export-v1',institutionCode:code,generatedAt:new Date().toISOString(),records:rows},null,2)+'\n',{mode:0o600});
    fs.renameSync(temp,target);
  } finally { if(fs.existsSync(temp)) fs.unlinkSync(temp); }
  console.log(`Exported ${rows.length} records for ${code}: ${target}`);
}

async function audit(code,rows,out) {
  const target = out ? path.resolve(out) : path.join(institutionDir(code),'audit-reports');
  ensureDirectory(target);
  const gateway=(process.env.PINATA_GATEWAY_URL||'https://gateway.pinata.cloud').replace(/\/$/,'');
  const results=[];
  for (const row of rows) {
    try {
      if(!/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z2-7]+)$/.test(row.cid)) throw Error('Invalid CID in inventory');
      if(!/^0x[0-9a-f]{64}$/i.test(row.docHash)) throw Error('Invalid SHA-256 in inventory');
      const response=await fetch(`${gateway}/ipfs/${row.cid}`,{signal:AbortSignal.timeout(45000)});
      if(!response.ok) throw Error(`Gateway HTTP ${response.status}`);
      const bytes=Buffer.from(await response.arrayBuffer());
      const hash='0x'+crypto.createHash('sha256').update(bytes).digest('hex');
      if(hash.toLowerCase()!==row.docHash.toLowerCase() || bytes.length!==row.size) throw Error('Integrity/size mismatch');
      if(!/^[0-9a-f-]{36}$/i.test(row.recordId)) throw Error('Invalid record ID');
      const filename=`${row.recordId}.pdf`;
      fs.writeFileSync(path.join(target,filename),bytes,{mode:0o600});
      results.push({recordId:row.recordId,cid:row.cid,docHash:hash,filename,status:'verified'});
    } catch(e) { results.push({recordId:row.recordId,cid:row.cid,status:'failed',error:e.message}); }
  }
  const manifest=path.join(target,'audit-manifest.json');
  fs.writeFileSync(manifest,JSON.stringify({institutionCode:code,generatedAt:new Date().toISOString(),results},null,2)+'\n',{mode:0o600});
  const failed=results.filter(x=>x.status==='failed').length;
  console.log(`Audit: ${results.length-failed} verified, ${failed} failed. Manifest: ${manifest}`);
  if(failed) process.exitCode=1;
}

async function main() {
  const rows=readInventory();
  if(command==='list') {
    const selected=rawCode ? rows.filter(x=>x.institutionCode===rawCode) : rows;
    console.table(selected.map(x=>({institution:x.institutionCode,cid:x.cid,sha256:x.docHash,status:x.status,uploadedAt:x.uploadedAt})));
  } else if(command==='export') {
    writeExport(rawCode,rows.filter(x=>x.institutionCode===rawCode),suppliedPath);
  } else if(command==='export-all') {
    const codes=[...new Set(rows.map(x=>x.institutionCode))].filter(validCode).sort();
    for(const code of codes) writeExport(code,rows.filter(x=>x.institutionCode===code));
    console.log(`Completed: ${codes.length} institutions. Note: institutions with no inventory records are not exported.`);
  } else {
    await audit(rawCode,rows.filter(x=>x.institutionCode===rawCode),suppliedPath);
  }
}
main().catch(e=>{console.error('Storage administration failed:',e.message);process.exitCode=1;});
