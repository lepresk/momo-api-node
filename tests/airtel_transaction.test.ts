import { describe, it, expect } from 'vitest'
import { AirtelTransaction } from '../src/models/AirtelTransaction.js'

describe('AirtelTransaction status codes', () => {
  it('treats TI as pending, like TIP', () => {
    const transaction = AirtelTransaction.parse({ id: 'ext-1', status: 'TI' })

    expect(transaction.isPending()).toBe(true)
    expect(transaction.isSuccessful()).toBe(false)
    expect(transaction.isFailed()).toBe(false)
  })

  it('treats TIP as pending', () => {
    expect(AirtelTransaction.parse({ status: 'TIP' }).isPending()).toBe(true)
  })

  it('treats TS as successful', () => {
    const transaction = AirtelTransaction.parse({ status: 'TS' })

    expect(transaction.isSuccessful()).toBe(true)
    expect(transaction.isPending()).toBe(false)
  })

  it('treats TF as failed', () => {
    const transaction = AirtelTransaction.parse({ status: 'TF' })

    expect(transaction.isFailed()).toBe(true)
    expect(transaction.isPending()).toBe(false)
  })

  it('leaves an unknown status in no state rather than guessing', () => {
    const transaction = AirtelTransaction.parse({ status: 'XX' })

    expect(transaction.isSuccessful()).toBe(false)
    expect(transaction.isPending()).toBe(false)
    expect(transaction.isFailed()).toBe(false)
    expect(transaction.getStatus()).toBe('XX')
  })
})

describe('AirtelTransaction fields', () => {
  it('exposes reference_id, the field the API actually returns', () => {
    const transaction = AirtelTransaction.parse({
      id: 'ext-1',
      reference_id: 'ref-99',
      airtel_money_id: 'AM-1',
      message: 'Success',
      status: 'TS',
    })

    expect(transaction.getId()).toBe('ext-1')
    expect(transaction.getReferenceId()).toBe('ref-99')
    expect(transaction.getAirtelMoneyId()).toBe('AM-1')
    expect(transaction.getMessage()).toBe('Success')
  })

  it('returns null for absent optional fields', () => {
    const transaction = AirtelTransaction.parse({ id: 'ext-1', status: 'TS' })

    expect(transaction.getReferenceId()).toBeNull()
    expect(transaction.getAirtelMoneyId()).toBeNull()
    expect(transaction.getMessage()).toBeNull()
  })
})
