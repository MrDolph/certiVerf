const { expect } = require('chai');
const { ethers } = require('hardhat');

const digest = (value) => ethers.sha256(ethers.toUtf8Bytes(value));

describe('CertificateRegistryV2', function () {
  let institutions, certificates, authority, school, stranger, replacement;
  const logicalId = digest('logical-credential-001');
  const commitment = digest('example-commitment-not-real-PII');
  const documentHash = digest('example-PDF-bytes');
  beforeEach(async function () {
    [authority, school, stranger, replacement] = await ethers.getSigners();
    institutions = await (await ethers.getContractFactory('InstitutionRegistryV2')).deploy(authority.address);
    await institutions.waitForDeployment();
    certificates = await (await ethers.getContractFactory('CertificateRegistryV2')).deploy(await institutions.getAddress());
    await certificates.waitForDeployment();
    await institutions.connect(school).requestRegistration('Fictitious Demo University', 'FDU', '');
    await institutions.approveRegistration(school.address);
  });
  async function issue(id = logicalId, c = commitment, h = documentHash, previous = ethers.ZeroHash) {
    const tx = await certificates.connect(school).issueCertificate(id, c, h, previous);
    const receipt = await tx.wait();
    const event = receipt.logs.map((log) => { try { return certificates.interface.parseLog(log); } catch { return null; } }).find((x) => x && x.name === 'CertificateIssued');
    return event.args.certificateId;
  }
  it('rejects zero registry address', async () => {
    await expect((await ethers.getContractFactory('CertificateRegistryV2')).deploy(ethers.ZeroAddress)).to.be.revertedWith('zero registry');
  });
  it('rejects issuance from unapproved wallet', async () => {
    await expect(certificates.connect(stranger).issueCertificate(logicalId, commitment, documentHash, ethers.ZeroHash)).to.be.revertedWith('inactive institution');
  });
  it('issues and verifies a certificate', async () => {
    const id = await issue();
    const [record, valid] = await certificates.verifyCertificate(id);
    expect(valid).to.equal(true);
    expect(record.issuer).to.equal(school.address);
    expect(record.docHash).to.equal(documentHash);
    expect(record.identityCommitment).to.equal(commitment);
  });
  it('records the newest certificate ID', async () => {
    const id = await issue();
    expect(await certificates.latestByLogicalId(logicalId)).to.equal(id);
  });
  it('emits the issuance event', async () => {
    await expect(certificates.connect(school).issueCertificate(logicalId, commitment, documentHash, ethers.ZeroHash)).to.emit(certificates, 'CertificateIssued');
  });
  for (const [label, l, c, h] of [
    ['logicalId', ethers.ZeroHash, commitment, documentHash],
    ['identityCommitment', logicalId, ethers.ZeroHash, documentHash],
    ['docHash', logicalId, commitment, ethers.ZeroHash],
  ]) {
    it(`rejects zero ${label}`, async () => {
      await expect(certificates.connect(school).issueCertificate(l, c, h, ethers.ZeroHash)).to.be.revertedWith('zero digest');
    });
  }
  it('rejects a predecessor on the first issuance', async () => {
    await expect(certificates.connect(school).issueCertificate(logicalId, commitment, documentHash, digest('fake predecessor'))).to.be.revertedWith('unexpected predecessor');
  });
  it('rejects a second issuance without a predecessor', async () => {
    await issue();
    await expect(certificates.connect(school).issueCertificate(logicalId, commitment, digest('another PDF'), ethers.ZeroHash)).to.be.revertedWith('wrong predecessor');
  });
  it('rejects replacement before revocation', async () => {
    const id = await issue();
    await expect(certificates.connect(school).issueCertificate(logicalId, commitment, digest('another PDF'), id)).to.be.revertedWith('revoke before replacement');
  });
  it('rejects a wrong predecessor', async () => {
    await issue();
    await expect(certificates.connect(school).issueCertificate(logicalId, commitment, digest('another PDF'), digest('wrong'))).to.be.revertedWith('wrong predecessor');
  });
  it('rejects revocation of unknown certificate', async () => {
    await expect(certificates.revokeCertificate(digest('unknown'))).to.be.revertedWith('not found');
  });
  it('rejects revocation by a different wallet', async () => {
    const id = await issue();
    await expect(certificates.connect(stranger).revokeCertificate(id)).to.be.revertedWith('not issuer');
  });
  it('revokes a certificate and invalidates it', async () => {
    const id = await issue();
    await certificates.connect(school).revokeCertificate(id);
    const [record, valid] = await certificates.verifyCertificate(id);
    expect(record.revoked).to.equal(true);
    expect(record.revokedAt).to.be.greaterThan(0n);
    expect(valid).to.equal(false);
  });
  it('rejects double revocation', async () => {
    const id = await issue();
    await certificates.connect(school).revokeCertificate(id);
    await expect(certificates.connect(school).revokeCertificate(id)).to.be.revertedWith('already revoked');
  });
  it('reissues a corrected certificate after revocation', async () => {
    const oldId = await issue();
    await certificates.connect(school).revokeCertificate(oldId);
    const newId = await issue(logicalId, commitment, digest('corrected-PDF'), oldId);
    expect(newId).not.to.equal(oldId);
    expect((await certificates.verifyCertificate(newId))[1]).to.equal(true);
    expect((await certificates.verifyCertificate(oldId))[1]).to.equal(false);
    expect((await certificates.certificates(newId)).supersedes).to.equal(oldId);
  });
  it('suspension blocks issuance', async () => {
    await institutions.setSuspended(school.address, true);
    await expect(certificates.connect(school).issueCertificate(logicalId, commitment, documentHash, ethers.ZeroHash)).to.be.revertedWith('inactive institution');
  });
  it('suspension makes an existing certificate fail current validity', async () => {
    const id = await issue();
    await institutions.setSuspended(school.address, true);
    expect((await certificates.verifyCertificate(id))[1]).to.equal(false);
  });
  it('reinstatement restores validity for an unrevoked certificate', async () => {
    const id = await issue();
    await institutions.setSuspended(school.address, true);
    await institutions.setSuspended(school.address, false);
    expect((await certificates.verifyCertificate(id))[1]).to.equal(true);
  });
  it('institution revocation makes existing certificate fail current validity', async () => {
    const id = await issue();
    await institutions.revokeInstitution(school.address);
    expect((await certificates.verifyCertificate(id))[1]).to.equal(false);
  });
  it('rejects verification of unknown certificate', async () => {
    await expect(certificates.verifyCertificate(digest('unknown'))).to.be.revertedWith('not found');
  });
  it('rejects cross-issuer replacement for same logical ID', async () => {
    const id = await issue();
    await certificates.connect(school).revokeCertificate(id);
    await institutions.connect(replacement).requestRegistration('Second Demo', 'SD', '');
    await institutions.approveRegistration(replacement.address);
    await expect(certificates.connect(replacement).issueCertificate(logicalId, commitment, digest('new'), id)).to.be.revertedWith('wrong issuer');
  });
  it('preserves independent logical credentials', async () => {
    const a = await issue(logicalId);
    const b = await issue(digest('another-logical-id'));
    expect(a).not.to.equal(b);
    expect((await certificates.verifyCertificate(a))[1]).to.equal(true);
    expect((await certificates.verifyCertificate(b))[1]).to.equal(true);
  });
  it('uses SHA-256 document hash as stored, without verifying PDF contents on-chain', async () => {
    const id = await issue();
    expect((await certificates.certificates(id)).docHash).to.equal(documentHash);
  });
  it('keeps original issuance timestamp and records revocation timestamp', async () => {
    const id = await issue();
    const original = await certificates.certificates(id);
    await certificates.connect(school).revokeCertificate(id);
    const after = await certificates.certificates(id);
    expect(after.issuedAt).to.equal(original.issuedAt);
    expect(after.revokedAt).to.be.greaterThanOrEqual(original.issuedAt);
  });
  it('allows original issuer to revoke even when suspended (current behaviour)', async () => {
    const id = await issue();
    await institutions.setSuspended(school.address, true);
    await certificates.connect(school).revokeCertificate(id);
    expect((await certificates.certificates(id)).revoked).to.equal(true);
  });
  it('shows key rotation invalidates existing certificates (known V2 limitation)', async () => {
    const id = await issue();
    await institutions.rotateInstitutionKey(school.address, replacement.address);
    expect((await certificates.verifyCertificate(id))[1]).to.equal(false);
  });
  it('shows rotated wallet cannot reissue predecessor under original wallet (known V2 limitation)', async () => {
    const id = await issue();
    await certificates.connect(school).revokeCertificate(id);
    await institutions.rotateInstitutionKey(school.address, replacement.address);
    await expect(certificates.connect(replacement).issueCertificate(logicalId, commitment, digest('corrected'), id)).to.be.revertedWith('wrong issuer');
  });
});
