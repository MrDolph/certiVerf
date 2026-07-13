import {
  RegistrationApproved as RegistrationApprovedEvent,
  RegistrationRejected as RegistrationRejectedEvent,
  RegistrationRequested as RegistrationRequestedEvent
} from "../generated/InstitutionRegistry/InstitutionRegistry"
import {
  RegistrationApproved,
  RegistrationRejected,
  RegistrationRequested
} from "../generated/schema"

export function handleRegistrationApproved(
  event: RegistrationApprovedEvent
): void {
  let entity = new RegistrationApproved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.wallet = event.params.wallet
  entity.name = event.params.name
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRegistrationRejected(
  event: RegistrationRejectedEvent
): void {
  let entity = new RegistrationRejected(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.wallet = event.params.wallet
  entity.name = event.params.name

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRegistrationRequested(
  event: RegistrationRequestedEvent
): void {
  let entity = new RegistrationRequested(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.wallet = event.params.wallet
  entity.name = event.params.name
  entity.acronym = event.params.acronym

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
