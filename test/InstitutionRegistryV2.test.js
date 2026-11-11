const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('InstitutionRegistryV2', function () {
  let registry, authority, school, other, replacement;
  beforeEach(async function () {
    [authority, school, other, replacement] = await ethers.getSigners();
    registry = await (await ethers.getContractFactory('InstitutionRegistryV2')).deploy(authority.address);
    await registry.waitForDeployment();
  });
  async function approve() {
    await registry.connect(school).requestRegistration('Demo University', 'DU', 'https://example.invalid');
    await registry.connect(authority).approveRegistration(school.address);
  }
  it('rejects a zero authority', async () => {
    await expect((await ethers.getContractFactory('InstitutionRegistryV2')).deploy(ethers.ZeroAddress)).to.be.revertedWith('zero authority');
  });
  it('records a registration request', async () => {
    await registry.connect(school).requestRegistration('Demo University', 'DU', '');
    expect((await registry.requests(school.address)).exists).to.equal(true);
  });
  it('rejects empty institution names', async () => {
    await expect(registry.connect(school).requestRegistration('', 'DU', '')).to.be.revertedWith('empty institution');
  });
  it('rejects empty acronyms', async () => {
    await expect(registry.connect(school).requestRegistration('Demo', '', '')).to.be.revertedWith('empty institution');
  });
  it('rejects duplicate requests', async () => {
    await registry.connect(school).requestRegistration('Demo', 'DU', '');
    await expect(registry.connect(school).requestRegistration('Demo', 'DU', '')).to.be.revertedWith('already known');
  });
  it('does not allow an unrelated wallet to approve', async () => {
    await registry.connect(school).requestRegistration('Demo', 'DU', '');
    await expect(registry.connect(other).approveRegistration(school.address)).to.be.revertedWith('not authority');
  });
  it('rejects approval without a request', async () => {
    await expect(registry.approveRegistration(school.address)).to.be.revertedWith('no request');
  });
  it('approves a requested institution', async () => {
    await approve();
    expect(await registry.isRegistered(school.address)).to.equal(true);
    expect((await registry.requests(school.address)).exists).to.equal(false);
  });
  it('rejects requests and allows a fresh request afterward', async () => {
    await registry.connect(school).requestRegistration('Demo', 'DU', '');
    await registry.rejectRegistration(school.address);
    await registry.connect(school).requestRegistration('Demo2', 'D2', '');
    expect((await registry.requests(school.address)).exists).to.equal(true);
  });
  it('prevents non-authority rejection', async () => {
    await registry.connect(school).requestRegistration('Demo', 'DU', '');
    await expect(registry.connect(other).rejectRegistration(school.address)).to.be.revertedWith('not authority');
  });
  it('suspends and reinstates an approved institution', async () => {
    await approve();
    await registry.setSuspended(school.address, true);
    expect(await registry.isRegistered(school.address)).to.equal(false);
    await registry.setSuspended(school.address, false);
    expect(await registry.isRegistered(school.address)).to.equal(true);
  });
  it('rejects suspension of an unapproved wallet', async () => {
    await expect(registry.setSuspended(other.address, true)).to.be.revertedWith('not approved');
  });
  it('prevents non-authority suspension', async () => {
    await approve();
    await expect(registry.connect(other).setSuspended(school.address, true)).to.be.revertedWith('not authority');
  });
  it('revokes an approved institution', async () => {
    await approve();
    await registry.revokeInstitution(school.address);
    expect(await registry.isRegistered(school.address)).to.equal(false);
  });
  it('prevents non-authority revocation', async () => {
    await approve();
    await expect(registry.connect(other).revokeInstitution(school.address)).to.be.revertedWith('not authority');
  });
  it('rejects a zero next owner', async () => {
    await expect(registry.transferOwnership(ethers.ZeroAddress)).to.be.revertedWith('zero address');
  });
  it('prevents unauthorized ownership nomination', async () => {
    await expect(registry.connect(other).transferOwnership(other.address)).to.be.revertedWith('not authority');
  });
  it('requires nominated owner to accept ownership', async () => {
    await registry.transferOwnership(other.address);
    await expect(registry.connect(school).acceptOwnership()).to.be.revertedWith('not nominated');
    await registry.connect(other).acceptOwnership();
    expect(await registry.owner()).to.equal(other.address);
    expect(await registry.pendingOwner()).to.equal(ethers.ZeroAddress);
  });
  it('rotates an approved institution key', async () => {
    await approve();
    await registry.rotateInstitutionKey(school.address, replacement.address);
    expect(await registry.isRegistered(school.address)).to.equal(false);
    expect(await registry.isRegistered(replacement.address)).to.equal(true);
  });
  it('rejects rotation to zero address', async () => {
    await approve();
    await expect(registry.rotateInstitutionKey(school.address, ethers.ZeroAddress)).to.be.revertedWith('invalid wallet');
  });
  it('rejects rotation to the same address', async () => {
    await approve();
    await expect(registry.rotateInstitutionKey(school.address, school.address)).to.be.revertedWith('invalid wallet');
  });
  it('rejects rotation to an already used address', async () => {
    await approve();
    await registry.connect(replacement).requestRegistration('Another', 'AN', '');
    await expect(registry.rotateInstitutionKey(school.address, replacement.address)).to.be.revertedWith('new wallet in use');
  });
  it('prevents unauthorized key rotation', async () => {
    await approve();
    await expect(registry.connect(other).rotateInstitutionKey(school.address, replacement.address)).to.be.revertedWith('not authority');
  });
});
