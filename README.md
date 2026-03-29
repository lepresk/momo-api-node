# @lepresk/momo-api

[![npm](https://img.shields.io/npm/v/@lepresk/momo-api)](https://www.npmjs.com/package/@lepresk/momo-api)
[![CI](https://github.com/lepresk/momo-api-node/actions/workflows/ci.yml/badge.svg)](https://github.com/lepresk/momo-api-node/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MTN Mobile Money and Airtel Money API client for Node.js — collections, disbursements and remittances.

This is a port of the PHP package [`lepresk/momo-api`](https://github.com/lepresk/momo-api) to Node.js/TypeScript. See the original article at [lepresk.com/blog](https://lepresk.com/blog).

## Requirements

- Node.js 18 or later (uses native `fetch` and `crypto.randomUUID`)
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
  'EUR',          // currency
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

### Airtel environments

| Mode | URL | Use Case |
|------|-----|----------|
| `staging` | `https://openapiuat.airtel.cg` | Testing |
| `production` | `https://openapi.airtel.cg` | Production (Congo) |

## Static factory methods

For convenience, `MomoApi` provides static factory methods that default to sandbox:

```typescript
const collection = MomoApi.collection(config)
const disbursement = MomoApi.disbursement(config)
```

For production or non-sandbox environments, use `MomoApi.create`:

```typescript
import { MomoApi, ENVIRONMENT_MTN_GHANA } from '@lepresk/momo-api'

const momo = MomoApi.create(ENVIRONMENT_MTN_GHANA)
const collection = momo.getCollection(config)
```

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
