/**
 * Default currency used by the `make()` factories and `quickPay()`.
 * Matches the PHP client (`lepresk/momo-api`), whose primary market is XAF.
 */
export const DEFAULT_CURRENCY = 'XAF'

/**
 * The only currency the MTN sandbox accepts. Payment requests sent to the
 * sandbox carry it whatever currency they were built with.
 */
export const SANDBOX_CURRENCY = 'EUR'
