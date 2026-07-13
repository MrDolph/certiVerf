import {
  CertificateIssued as CertificateIssuedEvent,
  CertificateRevoked as CertificateRevokedEvent,
} from "../generated/CertificateRegistry/CertificateRegistry"
import { CertificateIssued, CertificateRevoked } from "../generated/schema"

export function handleCertificateIssued(event: CertificateIssuedEvent): void {
  let entity = new CertificateIssued(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.metaHash = event.params.metaHash
  entity.issuer = event.params.issuer
  entity.institutionName = event.params.institutionName
  entity.studentName = event.params.studentName
  entity.studentId = event.params.studentId
  entity.programme = event.params.programme
  entity.issuedAt = event.params.issuedAt

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleCertificateRevoked(event: CertificateRevokedEvent): void {
  let entity = new CertificateRevoked(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.metaHash = event.params.metaHash
  entity.issuer = event.params.issuer
  entity.reason = event.params.reason
  entity.revokedAt = event.params.revokedAt

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
