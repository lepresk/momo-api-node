# momo-api

MTN Mobile Money API client for Node.js — collections, disbursements and remittances.

This is a port of the PHP package [`lepresk/momo-api`](https://github.com/lepresk/momo-api) to Node.js/TypeScript. See the original article at [lepresk.com/blog](https://lepresk.com/blog).

## Requirements

- Node.js 18 or later (uses native `fetch` and `crypto.randomUUID`)
- An MTN MoMo developer account with API credentials

## Installation

```bash
npm install momo-api
# or
pnpm add momo-api
# or
yarn add momo-api
```

## Getting started

### Sandbox setup

Before making live API calls you need to provision a sandbox user and API key via the `SandboxApi`:

```typescript
import { MomoApi, ENVIRONMENT_SANDBOX } from 'momo-api'
import { generateUUID } from 'momo-api'

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
import { MomoApi, ENVIRONMENT_SANDBOX, Config, PaymentRequest } from 'momo-api'

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
import { MomoApi, ENVIRONMENT_SANDBOX, Config, PaymentRequest, TransferRequest, RefundRequest } from 'momo-api'

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

## Static factory methods

For convenience, `MomoApi` provides static factory methods that default to sandbox:

```typescript
const collection = MomoApi.collection(config)
const disbursement = MomoApi.disbursement(config)
```

For production or non-sandbox environments, use `MomoApi.create`:

```typescript
import { MomoApi, ENVIRONMENT_MTN_GHANA } from 'momo-api'

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
} from 'momo-api'

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

### SandboxApi

| Method | Description |
|---|---|
| `createApiUser(apiUser, callbackHost)` | Provision a sandbox API user |
| `getApiUser(apiUser)` | Get sandbox API user details |
| `createApiKey(apiUser)` | Generate an API key for a sandbox user |

## License

MIT
