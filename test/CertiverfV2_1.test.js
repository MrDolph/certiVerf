const { expect } = require('chai');
const { ethers } = require('hardhat');
const h = (s) => ethers.sha256(ethers.toUtf8Bytes(s));

describe('Certiverf V2.1 governance and continuity', function () {
  let authority, school, rotated, outsider, registry, cert;
  const logical = h('logical-1'), commitment = h('salted-demo-commitment'), pdf = h('exact-pdf-bytes');
  beforeEach(async function () {
    [authority, school, rotated, outsider] = await ethers.getSigners();
    registry = await (await ethers.getContractFactory('InstitutionRegistryV2_1')).deploy(authority.address);
    await registry.waitForDeployment();
    cert = await (await ethers.getContractFactory('CertificateRegistryV2_1')).deploy(await registry.getAddress());
    await cert.waitForDeployment();
    await registry.connect(school).requestRegistration('Fictitious Research University', 'FRU', '');
    await registry.approveRegistration(school.address);
  });
  async function issue(wallet = school, predecessor = ethers.ZeroHash, digest = pdf) {
    const receipt = await (await cert.connect(wallet).issueCertificate(logical, commitment, digest, predecessor)).wait();
    const event = receipt.logs.map((l) => { try { return cert.interface.parseLog(l); } catch { return null; } })
      .find((e) => e && e.name === 'CertificateIssued');
    return event.args.certificateId;
  }
  it('issues a valid credential', async () => {
    const id = await issue();
    const [record, valid, status] = await cert.verifyCertificate(id);
    expect(valid).to.equal(true); expect(status).to.equal(0n); expect(record.originalIssuer).to.equal(school.address);
  });
  it('suspension blocks issuance but preserves previous verification', async () => {
    const id = await issue(); await registry.setSuspended(1, true);
    expect((await cert.verifyCertificate(id))[1]).to.equal(true);
    await expect(cert.connect(school).issueCertificate(h('new'), commitment, pdf, ethers.ZeroHash)).to.be.revertedWith('inactive institution');
  });
  it('suspended institution can revoke but not reissue', async () => {
    const id = await issue(); await registry.setSuspended(1, true);
    await cert.connect(school).revokeCertificate(id);
    expect((await cert.verifyCertificate(id))[2]).to.equal(1n);
    await expect(cert.connect(school).issueCertificate(logical, commitment, h('fixed'), id)).to.be.revertedWith('inactive institution');
  });
  it('institution revocation flags old credentials and prevents issuance', async () => {
    const id = await issue(); await registry.revokeInstitution(1);
    const [, valid, status] = await cert.verifyCertificate(id);
    expect(valid).to.equal(false); expect(status).to.equal(3n);
    await expect(cert.connect(school).issueCertificate(h('new'), commitment, pdf, ethers.ZeroHash)).to.be.revertedWith('inactive institution');
  });
  it('revoked institution cannot manage certificates', async () => {
    const id = await issue(); await registry.revokeInstitution(1);
    await expect(cert.connect(school).revokeCertificate(id)).to.be.revertedWith('not authorized manager');
  });
  it('rotation preserves original certificate validity and provenance', async () => {
    const id = await issue(); await registry.rotateInstitutionKey(1, rotated.address);
    const [record, valid] = await cert.verifyCertificate(id);
    expect(valid).to.equal(true); expect(record.originalIssuer).to.equal(school.address);
    expect(await registry.institutionIdOf(rotated.address)).to.equal(1n);
  });
  it('old wallet cannot revoke after rotation; new wallet can', async () => {
    const id = await issue(); await registry.rotateInstitutionKey(1, rotated.address);
    await expect(cert.connect(school).revokeCertificate(id)).to.be.revertedWith('not authorized manager');
    await cert.connect(rotated).revokeCertificate(id);
    expect((await cert.verifyCertificate(id))[2]).to.equal(1n);
  });
  it('new wallet can reissue after revocation, retaining logical history', async () => {
    const id = await issue(); await registry.rotateInstitutionKey(1, rotated.address);
    await cert.connect(rotated).revokeCertificate(id);
    const replacement = await issue(rotated, id, h('corrected-pdf'));
    expect((await cert.verifyCertificate(replacement))[1]).to.equal(true);
    expect((await cert.certificates(replacement)).supersedes).to.equal(id);
    expect((await cert.certificates(replacement)).originalIssuer).to.equal(rotated.address);
  });
  it('rotation cannot be performed by outsiders', async () => {
    await expect(registry.connect(outsider).rotateInstitutionKey(1, rotated.address)).to.be.revertedWith('not authority');
  });
  it('rotation does not permit reusing historical wallet as a new wallet', async () => {
    await registry.rotateInstitutionKey(1, rotated.address);
    await expect(registry.rotateInstitutionKey(1, school.address)).to.be.revertedWith('wallet in use');
  });
  it('suspension state persists through key rotation', async () => {
    const id = await issue(); await registry.setSuspended(1, true);
    await registry.rotateInstitutionKey(1, rotated.address);
    expect((await cert.verifyCertificate(id))[1]).to.equal(true);
    await expect(cert.connect(rotated).issueCertificate(h('other'), commitment, pdf, ethers.ZeroHash)).to.be.revertedWith('inactive institution');
    await cert.connect(rotated).revokeCertificate(id);
  });
  it('two institutions can use the same logical ID independently', async () => {
    await registry.connect(outsider).requestRegistration('Second Demo University', 'SDU', '');
    await registry.approveRegistration(outsider.address);
    const first = await issue(); const second = await issue(outsider);
    expect(first).not.to.equal(second);
    expect((await cert.verifyCertificate(first))[1]).to.equal(true);
    expect((await cert.verifyCertificate(second))[1]).to.equal(true);
  });
  it('rejects duplicate active certificate issuance', async () => {
    await issue();
    await expect(cert.connect(school).issueCertificate(logical, commitment, pdf, ethers.ZeroHash)).to.be.revertedWith('wrong predecessor');
  });
  it('unrelated wallet cannot revoke a certificate', async () => {
    const id = await issue();
    await expect(cert.connect(outsider).revokeCertificate(id)).to.be.revertedWith('not authorized manager');
  });
});
