import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  RegistrationApproved,
  RegistrationRejected,
  RegistrationRequested
} from "../generated/InstitutionRegistry/InstitutionRegistry"

export function createRegistrationApprovedEvent(
  wallet: Address,
  name: string,
  timestamp: BigInt
): RegistrationApproved {
  let registrationApprovedEvent =
    changetype<RegistrationApproved>(newMockEvent())

  registrationApprovedEvent.parameters = new Array()

  registrationApprovedEvent.parameters.push(
    new ethereum.EventParam("wallet", ethereum.Value.fromAddress(wallet))
  )
  registrationApprovedEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  )
  registrationApprovedEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return registrationApprovedEvent
}

export function createRegistrationRejectedEvent(
  wallet: Address,
  name: string
): RegistrationRejected {
  let registrationRejectedEvent =
    changetype<RegistrationRejected>(newMockEvent())

  registrationRejectedEvent.parameters = new Array()

  registrationRejectedEvent.parameters.push(
    new ethereum.EventParam("wallet", ethereum.Value.fromAddress(wallet))
  )
  registrationRejectedEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  )

  return registrationRejectedEvent
}

export function createRegistrationRequestedEvent(
  wallet: Address,
  name: string,
  acronym: string
): RegistrationRequested {
  let registrationRequestedEvent =
    changetype<RegistrationRequested>(newMockEvent())

  registrationRequestedEvent.parameters = new Array()

  registrationRequestedEvent.parameters.push(
    new ethereum.EventParam("wallet", ethereum.Value.fromAddress(wallet))
  )
  registrationRequestedEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  )
  registrationRequestedEvent.parameters.push(
    new ethereum.EventParam("acronym", ethereum.Value.fromString(acronym))
  )

  return registrationRequestedEvent
}
