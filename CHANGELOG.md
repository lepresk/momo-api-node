# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.0] - 2026-10-07

Caller-supplied reference ids. Anyone who retries writes after a timeout or 5xx
should upgrade: with a random id, a lost response could not be queried and a
retry could pay twice.

### Added
- Write methods take an optional caller-supplied id: `referenceId` on MTN
  `requestToPay()`, `quickPay()`, `deposit()`, `transfer()` and `refund()`
  (sent as `X-Reference-Id`), `transactionId` on Airtel `requestToPay()` and
  `transfer()` (sent as `transaction.id`). The id is returned and is what the
  status methods take, so after a timeout or 5xx you can query a payment whose
  response you never saw, and retry with the same id instead of risking a second
  payment ([#8](https://github.com/lepresk/momo-api-node/issues/8)). It must be a
  UUID; anything else throws before a request is sent. Omitting it keeps the
  random UUID, so existing code is unaffected

## [2.2.0] - 2026-09-29

MTN Get Status failures, sandbox currency and callback guidance. Anyone reading
`getReason()` on a failed transaction should upgrade: MTN's documented Get Status
body left it empty.

### Fixed
- A FAILED transaction from Get Status had no reason. Since January 2024 MTN
  reports the business failure in an HTTP 200 body with `reason` as a bare
  string (`"reason": "NOT_ENOUGH_FUNDS"`), but only the `{ code, message }`
  object was parsed. `Transaction.getReason()` now accepts both shapes; a string becomes an
  `ErrorReason` with that code and an empty message
- An `ErrorReason` without a message rendered with a trailing space
  (`"[NOT_ENOUGH_FUNDS] "`); it now renders as `"[NOT_ENOUGH_FUNDS]"`
- Payments in the sandbox failed with the default currency. The sandbox accepts
  EUR only, but `quickPay()` and the request `make()` factories default to XAF.
  Against the sandbox, `requestToPay()`, `quickPay()`, `deposit()`, `transfer()`
  and `refund()` now send `EUR` whatever the request currency; the request
  object is left untouched, and other environments are unaffected
- The README's callback example fulfilled the order straight from the callback
  data. MTN and Airtel do not sign callbacks, so anyone who knows the callback
  URL could mark an unpaid order as paid. The example now re-queries the status
  from MTN or Airtel before fulfilling, for both providers

### Added
- `ErrorReason` constants and predicates for the Get Status failure codes MTN
  documents or returns in production: `LOW_BALANCE_OR_PAYEE_LIMIT_REACHED_OR_NOT_ALLOWED`,
  `COULD_NOT_PERFORM_TRANSACTION`, `SENDER_ACCOUNT_NOT_ACTIVE`,
  `PAYEE_LIMIT_REACHED`, `TRANSACTION_NOT_FOUND`, `VALIDATION_ERROR`
- `ErrorReason.isPayerFundingFailure()`: true for `NOT_ENOUGH_FUNDS`,
  `PAYER_LIMIT_REACHED` and `LOW_BALANCE_OR_PAYEE_LIMIT_REACHED_OR_NOT_ALLOWED`.
  MTN Congo returns the last one instead of `NOT_ENOUGH_FUNDS`, so
  `isNotEnoughFunds()` alone misses an insufficient balance there
- `SANDBOX_CURRENCY`: `'EUR'`, the only currency the sandbox accepts

## [2.1.1] - 2026-08-22

### Fixed
- Three README examples did not compile as shown: `AirtelConfig` was imported but
  never used, and `MomoException` and `CollectionApi` were used without being
  imported. No source change — 2.1.0 and 2.1.1 ship identical code, but npm
  serves the README from the tarball, so the published page carried the broken
  snippets

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
