import { newMockEvent } from "matchstick-as"
import { ethereum, Bytes, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  CertificateIssued,
  CertificateRevoked
} from "../generated/CertificateRegistry/CertificateRegistry"

export function createCertificateIssuedEvent(
  metaHash: Bytes,
  issuer: Address,
  institutionName: string,
  studentName: string,
  studentId: string,
  programme: string,
  issuedAt: BigInt
): CertificateIssued {
  let certificateIssuedEvent = changetype<CertificateIssued>(newMockEvent())

  certificateIssuedEvent.parameters = new Array()

  certificateIssuedEvent.parameters.push(
    new ethereum.EventParam("metaHash", ethereum.Value.fromFixedBytes(metaHash))
  )
  certificateIssuedEvent.parameters.push(
    new ethereum.EventParam("issuer", ethereum.Value.fromAddress(issuer))
  )
  certificateIssuedEvent.parameters.push(
    new ethereum.EventParam(
      "institutionName",
      ethereum.Value.fromString(institutionName)
    )
  )
  certificateIssuedEvent.parameters.push(
    new ethereum.EventParam(
      "studentName",
      ethereum.Value.fromString(studentName)
    )
  )
  certificateIssuedEvent.parameters.push(
    new ethereum.EventParam("studentId", ethereum.Value.fromString(studentId))
  )
  certificateIssuedEvent.parameters.push(
    new ethereum.EventParam("programme", ethereum.Value.fromString(programme))
  )
  certificateIssuedEvent.parameters.push(
    new ethereum.EventParam(
      "issuedAt",
      ethereum.Value.fromUnsignedBigInt(issuedAt)
    )
  )

  return certificateIssuedEvent
}

export function createCertificateRevokedEvent(
  metaHash: Bytes,
  issuer: Address,
  reason: string,
  revokedAt: BigInt
): CertificateRevoked {
  let certificateRevokedEvent = changetype<CertificateRevoked>(newMockEvent())

  certificateRevokedEvent.parameters = new Array()

  certificateRevokedEvent.parameters.push(
    new ethereum.EventParam("metaHash", ethereum.Value.fromFixedBytes(metaHash))
  )
  certificateRevokedEvent.parameters.push(
    new ethereum.EventParam("issuer", ethereum.Value.fromAddress(issuer))
  )
  certificateRevokedEvent.parameters.push(
    new ethereum.EventParam("reason", ethereum.Value.fromString(reason))
  )
  certificateRevokedEvent.parameters.push(
    new ethereum.EventParam(
      "revokedAt",
      ethereum.Value.fromUnsignedBigInt(revokedAt)
    )
  )

  return certificateRevokedEvent
}
