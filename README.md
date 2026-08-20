# @lepresk/momo-api

[![npm](https://img.shields.io/npm/v/@lepresk/momo-api)](https://www.npmjs.com/package/@lepresk/momo-api)
[![CI](https://github.com/lepresk/momo-api-node/actions/workflows/ci.yml/badge.svg)](https://github.com/lepresk/momo-api-node/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MTN Mobile Money and Airtel Money API client for Node.js — collections, disbursements and remittances.

This is a port of the PHP package [`lepresk/momo-api`](https://github.com/lepresk/momo-api) to Node.js/TypeScript. See the original article at [lepresk.com/blog](https://lepresk.com/blog).

## Requirements

- Node.js 22 or later (uses native `fetch` and `crypto.randomUUID`)
- An MTN MoMo developer account with API credentials (for MTN)
- An Airtel Money developer account with OAuth2 credentials (for Airtel)

## Installation

```bash
npm install @lepresk/momo-api
# or
pnpm add @lepresk/momo-api
# or
yarn add @lepresk/momo-api
```

## Getting started

### Sandbox setup

Before making live API calls you need to provision a sandbox user and API key via the `SandboxApi`:

```typescript
import { MomoApi, ENVIRONMENT_SANDBOX } from '@lepresk/momo-api'
import { generateUUID } from '@lepresk/momo-api'

const momo = MomoApi.create(ENVIRONMENT_SANDBOX)
const sandbox = momo.sandbox('your-subscription-key')

const apiUser = generateUUID()
await sandbox.createApiUser(apiUser, 'https://your-callback-host.com')
const apiKey = await sandbox.createApiKey(apiUser)

console.log('API User:', apiUser)
console.log('API Key:', apiKey)
```

## Collection

The Collection product allows you to request payments from customers.

```typescript
import { MomoApi, ENVIRONMENT_SANDBOX, Config, PaymentRequest } from '@lepresk/momo-api'

const config = Config.collection(
  'your-subscription-key',
  'your-api-user',
  'your-api-key',
  'https://your-callback-host.com/webhook'
)

const collection = MomoApi.create(ENVIRONMENT_SANDBOX).getCollection(config)

// Request a payment
const request = PaymentRequest.make(
  '100',          // amount
  '0242439784',   // payer phone number (MSISDN)
  'order-123',    // external reference ID
  'EUR',          // currency (optional, defaults to XAF)
  'Payment for order #123',  // payer message (optional)
  'Thank you'                // payee note (optional)
)

const referenceId = await collection.requestToPay(request)
console.log('Payment initiated, reference ID:', referenceId)

// Check payment status
const transaction = await collection.getPaymentStatus(referenceId)

if (transaction.isSuccessful()) {
  console.log('Payment successful:', transaction.getFinancialTransactionId())
} else if (transaction.isPending()) {
  console.log('Payment is still pending')
} else {
  console.log('Payment failed')
}

// Get account balance
const balance = await collection.getBalance()
console.log(`Balance: ${balance.getAvailableBalance()} ${balance.getCurrency()}`)

// Quick pay shorthand
// currency is optional and defaults to XAF
const refId = await collection.quickPay('50', '0242439784', 'quick-order-456', 'EUR')
```

## Disbursement

The Disbursement product allows you to send money to customers.

```typescript
import { MomoApi, ENVIRONMENT_SANDBOX, Config, PaymentRequest, TransferRequest, RefundRequest } from '@lepresk/momo-api'

const config = Config.disbursement(
  'your-subscription-key',
  'your-api-user',
  'your-api-key',
  'https://your-callback-host.com/webhook'
)

const disbursement = MomoApi.create(ENVIRONMENT_SANDBOX).getDisbursement(config)

// Deposit funds to a customer
const depositRequest = PaymentRequest.make('200', '0242439784', 'dep-001', 'EUR', 'Deposit', 'Here are your funds')
const depositRefId = await disbursement.deposit(depositRequest)
const deposit = await disbursement.getDepositStatus(depositRefId)

// Transfer funds
const transferRequest = TransferRequest.make('300', '0242439784', 'xfer-001', 'EUR', 'Transfer', 'For you')
const transferRefId = await disbursement.transfer(transferRequest)
const transfer = await disbursement.getTransferStatus(transferRefId)

// Refund a previous payment
const refundRequest = RefundRequest.make('50', 'original-payment-reference-id', 'refund-001', 'EUR')
const refundRefId = await disbursement.refund(refundRequest)
const refund = await disbursement.getRefundStatus(refundRefId)

// Get disbursement account balance
const balance = await disbursement.getBalance()
console.log(`Balance: ${balance.getAvailableBalance()} ${balance.getCurrency()}`)
```

## Airtel Money

### Airtel Collection (Receive Payments)

```typescript
import { AirtelApi } from '@lepresk/momo-api'

const collection = AirtelApi.collection('staging', {
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
  callbackUri: 'https://your-callback-host.com/webhook',
  country: 'CG',    // optional, defaults to 'CG'
  currency: 'XAF',  // optional, defaults to 'XAF'
})

// Request a payment
const externalId = await collection.requestToPay('5000', '068511358', 'ORDER-001')

// Check payment status
const transaction = await collection.getPaymentStatus(externalId)

if (transaction.isSuccessful()) {
  console.log('Payment received! Airtel Money ID:', transaction.getAirtelMoneyId())
} else if (transaction.isPending()) {
  console.log('Payment pending...')
} else if (transaction.isFailed()) {
  console.log('Payment failed')
}

// Check balance
const balance = await collection.getBalance()
console.log(`Available: ${balance.getAvailableBalance()} ${balance.getCurrency()}`)
```

### Airtel Disbursement (Send Money)

```typescript
import { AirtelApi } from '@lepresk/momo-api'

const disbursement = AirtelApi.disbursement('production', {
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
  encryptedPin: 'YOUR_ENCRYPTED_PIN',
  callbackUri: 'https://your-callback-host.com/webhook',
})

// Transfer money
const externalId = await disbursement.transfer('10000', '068511358', 'PAY-001')

// Check transfer status
const transaction = await disbursement.getTransferStatus(externalId)

if (transaction.isSuccessful()) {
  console.log('Transfer completed!')
}
```

### Airtel disbursement PIN

The transfer endpoint takes an RSA-encrypted PIN, never the PIN itself. Encrypt
it with the public key Airtel gives you:

```typescript
import { AirtelApi, encryptAirtelPin } from '@lepresk/momo-api'

const disbursement = AirtelApi.disbursement('production', {
  clientId: process.env.AIRTEL_CLIENT_ID!,
  clientSecret: process.env.AIRTEL_CLIENT_SECRET!,
  encryptedPin: encryptAirtelPin('1234', process.env.AIRTEL_PUBLIC_KEY!),
})
```

The key is accepted base64-encoded or as PEM.

### Airtel phone numbers

Airtel expects a national MSISDN. Numbers are normalised for you — passing
`242068511358` or `068511358` sends `068511358` either way. `cleanPhoneNumber()`
is exported if you need the same normalisation elsewhere.

### Airtel failures

Airtel reports business failures with HTTP 200 and `status.success: false`, so
`requestToPay()` and `transfer()` raise a `MomoException` in that case rather
than returning an externalId for a refused request:

```typescript
import { MomoException } from '@lepresk/momo-api'

try {
  await disbursement.transfer('10000', '068511358', 'PAY-001')
} catch (err) {
  if (err instanceof MomoException) {
    console.error(err.message, err.code)  // "Invalid PIN", "ESB000008"
  }
}
```

Status codes: `TS` successful, `TF` failed, `TIP` and `TI` both pending.

### Airtel environments

| Mode | URL | Use Case |
|------|-----|----------|
| `staging` | `https://openapiuat.airtel.cg` | Testing |
| `production` | `https://openapi.airtel.cg` | Production (Congo) |

## Static factory methods

`MomoApi.collection()` and `MomoApi.disbursement()` build a product from flat
credentials, in any environment:

```typescript
import { MomoApi, ENVIRONMENT_MTN_GHANA } from '@lepresk/momo-api'

const collection = MomoApi.collection({
  environment: ENVIRONMENT_MTN_GHANA,   // optional, defaults to sandbox
  subscriptionKey: 'your-subscription-key',
  apiUser: 'your-api-user',
  apiKey: 'your-api-key',
  callbackUrl: 'https://your-callback-host.com/webhook',  // optional
})

const disbursement = MomoApi.disbursement({
  subscriptionKey: 'your-subscription-key',
  apiUser: 'your-api-user',
  apiKey: 'your-api-key',
})
```

Missing credentials throw immediately (`subscriptionKey is required`), and an
environment outside the table below throws `Unknown environment: '...'` rather
than silently pointing at production.

They also accept a `Config` instance, with the environment as a second argument:

```typescript
const momo = MomoApi.create(ENVIRONMENT_MTN_GHANA)
const collection = momo.getCollection(config)

// equivalent
const same = MomoApi.collection(config, ENVIRONMENT_MTN_GHANA)
```

## Custom HTTP client

Every product uses the global `fetch` by default. Supply your own
`fetch`-compatible function to add timeouts, retries, proxying or logging:

```typescript
import { MomoApi, AirtelApi, CollectionApi } from '@lepresk/momo-api'

const withTimeout: typeof fetch = (input, init) =>
  fetch(input, { ...init, signal: AbortSignal.timeout(10_000) })

// with the static factories
const collection = MomoApi.collection({ ...credentials, fetchImpl: withTimeout })

// with a client, inherited by every product it builds
const momo = MomoApi.create(ENVIRONMENT_MTN_GHANA, withTimeout)

// Airtel
const airtel = AirtelApi.create('production', withTimeout)

// or directly, as the last constructor argument
const direct = new CollectionApi(config, baseUrl, environment, withTimeout)
```

The implementation is scoped to the client you pass it to — nothing is installed
process-wide, so two libraries using this package cannot affect each other.

## Supported environments

| Constant                    | Value               |
|-----------------------------|---------------------|
| `ENVIRONMENT_MTN_CONGO`     | `mtncongo`          |
| `ENVIRONMENT_MTN_UGANDA`    | `mtnuganda`         |
| `ENVIRONMENT_MTN_GHANA`     | `mtnghana`          |
| `ENVIRONMENT_IVORY_COAST`   | `mtnivorycoast`     |
| `ENVIRONMENT_ZAMBIA`        | `mtnzambia`         |
| `ENVIRONMENT_CAMEROON`      | `mtncameroon`       |
| `ENVIRONMENT_BENIN`         | `mtnbenin`          |
| `ENVIRONMENT_SWAZILAND`     | `mtnswaziland`      |
| `ENVIRONMENT_GUINEACONAKRY` | `mtnguineaconakry`  |
| `ENVIRONMENT_SOUTHAFRICA`   | `mtnsouthafrica`    |
| `ENVIRONMENT_LIBERIA`       | `mtnliberia`        |
| `ENVIRONMENT_SANDBOX`       | `sandbox`           |

## Error handling

All API errors are surfaced as typed exceptions that extend `MomoException`:

```typescript
import {
  MomoException,
  BadRequestException,
  InvalidSubscriptionKeyException,
  ResourceNotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@lepresk/momo-api'

try {
  const referenceId = await collection.requestToPay(request)
} catch (err) {
  if (err instanceof InvalidSubscriptionKeyException) {
    console.error('Check your subscription key and API credentials')
  } else if (err instanceof BadRequestException) {
    console.error('Invalid request parameters')
  } else if (err instanceof MomoException) {
    console.error(`MoMo API error (${err.statusCode}):`, err.message)
  }
}
```

`MomoException` carries the parsed API payload: `message` is the API's own
message, `reason` an `ErrorReason` with the helpers described below, `code` its
machine-readable code (`NOT_ENOUGH_FUNDS`, ...) and `body` the raw response.

```typescript
catch (err) {
  if (err instanceof MomoException && err.reason?.isNotEnoughFunds()) {
    console.error('Payer has insufficient funds')
  }
}
```

### Why a payment failed

A failed transaction carries an `ErrorReason`:

```typescript
import { ErrorReason } from '@lepresk/momo-api'

const transaction = await collection.getPaymentStatus(referenceId)

if (transaction.isFailed()) {
  const reason = transaction.getReason()
  // every MTN failure code has a predicate, or use reason.is(ErrorReason.X)

  if (reason?.isNotEnoughFunds()) {
    console.error('Payer has insufficient funds')
  } else if (reason?.isExpired()) {
    console.error('The payment request expired')
  } else {
    console.error(String(reason))   // "[APPROVAL_REJECTED] ..."
  }
}
```

## API reference

### CollectionApi

| Method | Description |
|---|---|
| `requestToPay(request)` | Initiate a payment request; returns the reference ID |
| `getPaymentStatus(paymentId)` | Get the status of a payment |
| `getBalance()` | Get the collection account balance |
| `quickPay(amount, phone, reference, currency?)` | Shorthand to initiate a payment |
| `getAccessToken()` | Retrieve an OAuth access token |

### DisbursementApi

| Method | Description |
|---|---|
| `deposit(request)` | Deposit funds to a customer; returns the reference ID |
| `getDepositStatus(depositId)` | Get the status of a deposit |
| `transfer(request)` | Transfer funds; returns the reference ID |
| `getTransferStatus(transferId)` | Get the status of a transfer |
| `refund(request)` | Refund a previous payment; returns the reference ID |
| `getRefundStatus(refundId)` | Get the status of a refund |
| `getBalance()` | Get the disbursement account balance |
| `getAccessToken()` | Retrieve an OAuth access token |

### AirtelCollectionApi

| Method | Description |
|---|---|
| `requestToPay(amount, phone, reference)` | Request payment from customer; returns the external ID |
| `getPaymentStatus(externalId)` | Check payment status (returns `AirtelTransaction`) |
| `getBalance()` | Get account balance |
| `getAccessToken()` | Get OAuth token (cached automatically) |

### AirtelDisbursementApi

| Method | Description |
|---|---|
| `transfer(amount, phone, reference)` | Transfer money (requires `encryptedPin`); returns the external ID |
| `getTransferStatus(externalId)` | Check transfer status (returns `AirtelTransaction`) |
| `getBalance()` | Get account balance |
| `getAccessToken()` | Get OAuth token (cached automatically) |

### SandboxApi

| Method | Description |
|---|---|
| `createApiUser(apiUser, callbackHost)` | Provision a sandbox API user |
| `getApiUser(apiUser)` | Get sandbox API user details |
| `createApiKey(apiUser)` | Generate an API key for a sandbox user |

## Ecosystem

The same client is available for multiple languages:

| Language | Package | Install |
|----------|---------|---------|
| **PHP** | [`lepresk/momo-api`](https://github.com/lepresk/momo-api) | `composer require lepresk/momo-api` |
| **Node.js / TypeScript** | [`@lepresk/momo-api`](https://github.com/lepresk/momo-api-node) | `npm install @lepresk/momo-api` |
| **Python** | [`mtn-momo-client`](https://github.com/lepresk/momo-api-python) | `pip install mtn-momo-client` |

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the full history of changes.

## License

MIT
