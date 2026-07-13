import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Bytes, Address, BigInt } from "@graphprotocol/graph-ts"
import { CertificateIssued } from "../generated/schema"
import { CertificateIssued as CertificateIssuedEvent } from "../generated/CertificateRegistry/CertificateRegistry"
import { handleCertificateIssued } from "../src/certificate-registry"
import { createCertificateIssuedEvent } from "./certificate-registry-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let metaHash = Bytes.fromI32(1234567890)
    let issuer = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let institutionName = "Example string value"
    let studentName = "Example string value"
    let studentId = "Example string value"
    let programme = "Example string value"
    let issuedAt = BigInt.fromI32(234)
    let newCertificateIssuedEvent = createCertificateIssuedEvent(
      metaHash,
      issuer,
      institutionName,
      studentName,
      studentId,
      programme,
      issuedAt
    )
    handleCertificateIssued(newCertificateIssuedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("CertificateIssued created and stored", () => {
    assert.entityCount("CertificateIssued", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "CertificateIssued",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "metaHash",
      "1234567890"
    )
    assert.fieldEquals(
      "CertificateIssued",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "issuer",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "CertificateIssued",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "institutionName",
      "Example string value"
    )
    assert.fieldEquals(
      "CertificateIssued",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "studentName",
      "Example string value"
    )
    assert.fieldEquals(
      "CertificateIssued",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "studentId",
      "Example string value"
    )
    assert.fieldEquals(
      "CertificateIssued",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "programme",
      "Example string value"
    )
    assert.fieldEquals(
      "CertificateIssued",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "issuedAt",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
