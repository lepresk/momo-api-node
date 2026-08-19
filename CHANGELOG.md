# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-08-19

Airtel Money corrections, taken from a production integration of the same API.
Anyone using the Airtel products should upgrade: the previous release could
report a refused payment as accepted.

### Fixed
- `TI` ("transaction initiated") was not recognised as a pending status. A `TI`
  transaction answered `false` to `isPending()`, `isSuccessful()` **and**
  `isFailed()`, leaving the caller with a transaction in no state at all
- Airtel reports business failures — insufficient funds, invalid PIN, unknown
  transaction — with HTTP 200 and `status.success: false` in the body. Those were
  read as successes: `requestToPay()` and `transfer()` returned an externalId for
  a request Airtel had refused. They now raise a `MomoException` carrying the
  Airtel message and result code
- The MSISDN was sent verbatim. Airtel expects a national number, so a
  country-prefixed one (`242068511358`) was rejected. It is now stripped before
  the request; an already-national number is untouched
- `AirtelTransaction` exposed no `reference_id`, the identifier Airtel actually
  returns, and carried an unused private `request_id`

- **The published package was unusable.** `tsconfig.json` emitted CommonJS while
  `package.json` declares `"type": "module"`, so `import` failed with "does not
  provide an export named ..." and `require` failed with "exports is not defined
  in ES module scope". 2.0.0 was broken in every consumer, and 1.1.0 shipped with
  no `dist/` at all. The build now emits ESM (`module: NodeNext`), `prepack`
  rebuilds before every tarball, and a test suite consumes `dist/` rather than
  `src/` so this cannot regress unnoticed

### Changed
- **BREAKING** — requires Node.js 22 or later. Node 18 reached end of life in
  April 2025 and Node 20 in April 2026; both are unsupported and receive no
  security fixes. CI now covers 22 (LTS maintenance) and 24 (active LTS)

### Added
- `encryptAirtelPin(pin, publicKey)` — RSA/PKCS1 encryption of a disbursement
  PIN with Airtel's public key, accepted base64-encoded or as PEM. The transfer
  endpoint requires an encrypted PIN and there was previously no way to produce
  one
- `AirtelResponseStatus` — the `status` envelope Airtel returns alongside `data`,
  with `getResultCode()`, `getResponseCode()`, `getCode()` and `getMessage()`
- `cleanPhoneNumber()` and `AIRTEL_COUNTRY_CODES`, exported so callers can
  normalise numbers themselves
- `AirtelTransaction.getReferenceId()`, and the status codes as constants
  (`STATUS_SUCCESSFUL`, `STATUS_FAILED`, `STATUS_PENDING`, `STATUS_IN_PROGRESS`)

## [2.0.0] - 2026-08-19

Alignment release: brings the Node client to parity with the production-proven
PHP client (`lepresk/momo-api` 1.2.0).

### Added
- `ErrorReason` — the failure reason attached to a transaction, with the 17 MTN
  failure codes as constants and `isNotEnoughFunds()`, `isPayerLimitReached()`,
  `isPayeeNotFound()`, `is()` helpers
- `Transaction.getReason()` — returns the `ErrorReason` of a failed transaction, or `null`
- `MomoException.reason` — the failure as an `ErrorReason`, so a caught exception and
  a failed `Transaction` answer "why" with the same vocabulary; plus
  `MomoException.code` and `MomoException.body`
- `BadResourceException` — malformed reference id
- Injectable HTTP client, scoped per client rather than process-wide:
  `MomoApi.create(environment, fetchImpl)`, a `fetchImpl` option on
  `MomoApi.collection()` / `disbursement()`, `AirtelApi.create(mode, fetchImpl)`, and a
  `fetchImpl` argument on every product constructor — for timeouts, retries, proxying
  and testing
- `MTN_ENVIRONMENTS` — the list of accepted environments
- `Config.withCallbackUri()` — derive a config with a different callback url
- `MomoApi.getBaseUrl()`, plus `getEnvironment()`, `getBaseUrl()`, `getConfig()` and
  `getSubscriptionKey()` on `CollectionApi` and `DisbursementApi`
- `DEFAULT_CURRENCY` export, and `ConfigOptions` / `MomoApiOptions` / `FetchLike` types
- `AbstractApiProduct` and `AbstractAirtelApi` base classes, mirroring the PHP client —
  they carry the shared credentials, token cache, headers, response handling and the
  endpoints Collection and Disbursement have in common
- `AbstractRequest` base class and the `msisdn()` helper, shared by `PaymentRequest`,
  `TransferRequest` and `RefundRequest`
- A predicate for every MTN failure code on `ErrorReason` (`isExpired()`,
  `isApprovalRejected()`, `isServiceUnavailable()`, ...), replacing the previous
  three-of-seventeen subset

### Changed
- **BREAKING** — `MomoApi.collection()` and `MomoApi.disbursement()` now take flat
  credentials (`{ environment, subscriptionKey, apiUser, apiKey, callbackUrl }`) and
  honour the requested environment. They previously forced sandbox regardless of
  input. Passing a `Config` instance still works, with the environment as an
  optional second argument
- **BREAKING** — default currency of `PaymentRequest.make()`, `TransferRequest.make()`,
  `RefundRequest.make()` and `quickPay()` is now `XAF` instead of `EUR`, matching the
  PHP client
- **BREAKING** — `requestToPay()`, `deposit()`, `transfer()` and `refund()` now require
  HTTP 202 exactly, as the PHP client does; any other 2xx raises a `MomoException`
- **BREAKING** — API error messages are extracted from the JSON payload's `message`
  field instead of being the raw response body
- `AirtelCollectionApi.getPaymentStatus()` and `AirtelDisbursementApi.getTransferStatus()`
  now raise `ResourceNotFoundException` when the response carries no transaction node.
  The disbursement side previously raised a bare `Error`; the collection side crashed
  with a `TypeError`
- Every MTN request now sends `Accept: application/json`, token and sandbox endpoints
  included
- `AirtelTransaction.parse()` coerces missing `id` and `status` to `''` instead of
  leaving them `undefined`
- `Config` callback uri is now optional and defaults to `''`

### Fixed
- Unknown environments no longer resolve silently to the production host —
  `MomoApi.create()`, `MomoApi.getBaseUrl()` and the static factories throw
  `Unknown environment: '...'`
- `MomoApi.sandbox()` refuses to run against a non-sandbox environment
- `MomoApi.collection()` / `disbursement()` validate that `subscriptionKey`,
  `apiUser` and `apiKey` are present

## [1.1.0] - 2026-03-29

### Added
- **Airtel Money support**: `AirtelApi`, `AirtelCollectionApi`, `AirtelDisbursementApi`
  - `AirtelCollectionApi.requestToPay()`, `getPaymentStatus()`, `getBalance()`
  - `AirtelDisbursementApi.transfer()`, `getTransferStatus()`, `getBalance()`
  - `AirtelConfig` with static `collection()` and `disbursement()` factories
  - `AirtelTransaction` with `isSuccessful()`, `isPending()`, `isFailed()` helpers
- **Token caching**: `CollectionApi` and `DisbursementApi` now cache access tokens for their TTL
- `CollectionApi.checkAccountHolder()` — verify an MSISDN is active
- `DisbursementApi.checkAccountHolder()` — verify an MSISDN is active
- `TokenCache` utility for in-memory token TTL management

## [1.0.0] - 2025-02-27

### Added
- Initial release — port of [`lepresk/momo-api`](https://github.com/lepresk/momo-api) (PHP) to Node.js/TypeScript
- `CollectionApi`: `requestToPay()`, `quickPay()`, `getPaymentStatus()`, `getBalance()`, `getAccessToken()`
- `DisbursementApi`: `deposit()`, `getDepositStatus()`, `transfer()`, `getTransferStatus()`, `refund()`, `getRefundStatus()`, `getBalance()`, `getAccessToken()`
- `SandboxApi`: `createApiUser()`, `getApiUser()`, `createApiKey()`
- Static factory methods: `MomoApi.collection()`, `MomoApi.disbursement()`
- `Config.collection()` and `Config.disbursement()` builder helpers
- `PaymentRequest.make()`, `TransferRequest.make()`, `RefundRequest.make()` factories
- `Transaction` with `isSuccessful()`, `isPending()`, `isFailed()` helpers
- Typed exception hierarchy: `BadRequestException`, `InvalidSubscriptionKeyException`, `ResourceNotFoundException`, `ConflictException`, `InternalServerErrorException`
- Support for 12 MTN environments (sandbox + 11 production markets)
- Full TypeScript types and declaration files
- `generateUUID()` utility using native `crypto.randomUUID`
- Uses native `fetch` (Node 18+) — zero runtime dependencies
