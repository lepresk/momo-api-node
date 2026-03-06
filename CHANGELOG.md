# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
