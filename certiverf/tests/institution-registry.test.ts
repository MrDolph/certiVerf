import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { RegistrationApproved } from "../generated/schema"
import { RegistrationApproved as RegistrationApprovedEvent } from "../generated/InstitutionRegistry/InstitutionRegistry"
import { handleRegistrationApproved } from "../src/institution-registry"
import { createRegistrationApprovedEvent } from "./institution-registry-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let wallet = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let name = "Example string value"
    let timestamp = BigInt.fromI32(234)
    let newRegistrationApprovedEvent = createRegistrationApprovedEvent(
      wallet,
      name,
      timestamp
    )
    handleRegistrationApproved(newRegistrationApprovedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("RegistrationApproved created and stored", () => {
    assert.entityCount("RegistrationApproved", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "RegistrationApproved",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "wallet",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "RegistrationApproved",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "name",
      "Example string value"
    )
    assert.fieldEquals(
      "RegistrationApproved",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "timestamp",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
