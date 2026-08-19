import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as src from '../src/index.js'
import * as dist from '../dist/index.js'

/**
 * Every other suite imports from `src/`, which vitest resolves directly — so
 * none of them exercise what consumers install. These import the build output.
 *
 * This exists because 1.1.0 shipped with no `dist/` at all and 2.0.0 shipped
 * CommonJS inside a `"type": "module"` package: both were unusable once
 * installed, and the suite was green throughout.
 *
 * `npm test` rebuilds first via `pretest`. A bare `vitest`/watch run does not,
 * so these assertions are only as fresh as the last build in that mode. The
 * check that matters for a release is `npm run verify:pack`, which installs a
 * real tarball; CI runs both.
 */
const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8')
)

describe('published package', () => {
  it('is built as ES modules, matching "type": "module"', () => {
    const entry = readFileSync(
      fileURLToPath(new URL('../dist/index.js', import.meta.url)),
      'utf8'
    )

    expect(pkg.type).toBe('module')
    expect(entry).toMatch(/^export /m)
    expect(entry).not.toMatch(/Object\.defineProperty\(exports/)
    expect(entry).not.toMatch(/\brequire\(/)
  })

  it('points its entry points at files the build produces', () => {
    expect(pkg.main).toBe('dist/index.js')
    expect(pkg.types).toBe('dist/index.d.ts')
    expect(pkg.exports['.'].import).toBe('./dist/index.js')
    expect(pkg.exports['.'].types).toBe('./dist/index.d.ts')
  })

  it('ships every file the sourcemaps point at', () => {
    // dist/*.map reference ../src/**, so shipping dist without src leaves
    // consumers with dangling maps and no go-to-definition
    expect(pkg.files).toContain('dist')
    expect(pkg.files).toContain('src')
  })

  it('exposes exactly the surface src exports, nothing dropped by the build', () => {
    expect(Object.keys(dist)).toEqual(Object.keys(src))
  })

  it('works end to end from the build output', () => {
    const { AirtelTransaction, cleanPhoneNumber, MomoApi, ENVIRONMENT_MTN_CONGO } = dist

    expect(AirtelTransaction.parse({ status: 'TI' }).isPending()).toBe(true)
    expect(cleanPhoneNumber('+242 06 851 1358')).toBe('068511358')
    expect(
      MomoApi.collection({
        environment: ENVIRONMENT_MTN_CONGO,
        subscriptionKey: 'a',
        apiUser: 'b',
        apiKey: 'c',
      }).getBaseUrl()
    ).toBe('https://proxy.momoapi.mtn.com')
  })
})
