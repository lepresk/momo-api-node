export const tokenSuccess = {
  access_token: 'test-access-token-12345',
  token_type: 'access_token',
  expires_in: 3600,
}

export const paymentPending = {
  amount: '100',
  currency: 'EUR',
  financialTransactionId: null,
  externalId: 'ext-ref-001',
  payer: {
    partyIdType: 'MSISDN',
    partyId: '0242439784',
  },
  payerMessage: 'Test payment',
  payeeNote: 'Thank you',
  status: 'PENDING',
}

export const paymentSuccessful = {
  amount: '100',
  currency: 'EUR',
  financialTransactionId: 'fin-txn-001',
  externalId: 'ext-ref-001',
  payer: {
    partyIdType: 'MSISDN',
    partyId: '0242439784',
  },
  payerMessage: 'Test payment',
  payeeNote: 'Thank you',
  status: 'SUCCESSFUL',
}

export const paymentFailed = {
  amount: '100',
  currency: 'EUR',
  financialTransactionId: null,
  externalId: 'ext-ref-001',
  payer: {
    partyIdType: 'MSISDN',
    partyId: '0242439784',
  },
  payerMessage: 'Test payment',
  payeeNote: 'Thank you',
  status: 'FAILED',
}

export const balance = {
  availableBalance: '1000',
  currency: 'EUR',
}

export const depositPending = {
  amount: '200',
  currency: 'EUR',
  financialTransactionId: null,
  externalId: 'ext-dep-001',
  payee: {
    partyIdType: 'MSISDN',
    partyId: '0242439784',
  },
  payerMessage: 'Deposit funds',
  payeeNote: 'Here are your funds',
  status: 'PENDING',
}

export const depositSuccessful = {
  amount: '200',
  currency: 'EUR',
  financialTransactionId: 'fin-dep-001',
  externalId: 'ext-dep-001',
  payee: {
    partyIdType: 'MSISDN',
    partyId: '0242439784',
  },
  payerMessage: 'Deposit funds',
  payeeNote: 'Here are your funds',
  status: 'SUCCESSFUL',
}

export const transferPending = {
  amount: '300',
  currency: 'EUR',
  financialTransactionId: null,
  externalId: 'ext-xfer-001',
  payee: {
    partyIdType: 'MSISDN',
    partyId: '0242439784',
  },
  payerMessage: 'Transfer',
  payeeNote: 'Transfer for you',
  status: 'PENDING',
}

export const transferSuccessful = {
  amount: '300',
  currency: 'EUR',
  financialTransactionId: 'fin-xfer-001',
  externalId: 'ext-xfer-001',
  payee: {
    partyIdType: 'MSISDN',
    partyId: '0242439784',
  },
  payerMessage: 'Transfer',
  payeeNote: 'Transfer for you',
  status: 'SUCCESSFUL',
}

export const refundPending = {
  amount: '50',
  currency: 'EUR',
  financialTransactionId: null,
  externalId: 'ext-refund-001',
  status: 'PENDING',
}

export const refundSuccessful = {
  amount: '50',
  currency: 'EUR',
  financialTransactionId: 'fin-refund-001',
  externalId: 'ext-refund-001',
  status: 'SUCCESSFUL',
}

export const apiUser = {
  providerCallbackHost: 'https://example.com',
  targetEnvironment: 'sandbox',
}

export const apiKey = {
  apiKey: 'generated-api-key-xyz',
}
