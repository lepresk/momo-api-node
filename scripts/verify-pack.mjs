/**
 * Pack the package, install the tarball into a scratch project, and import it
 * the way a consumer would.
 *
 * The test suite checks `dist/` through a relative path, which never consults
 * Node's package resolver — so it cannot catch a broken `exports` map, a stray
 * `.npmignore`, or a `files` entry that drops something. This can.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const { name, version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const scratch = mkdtempSync(join(tmpdir(), 'momo-verify-'))
const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString()

try {
  const tarball = run('npm', ['pack', root, '--silent'], scratch).trim().split('\n').pop()

  writeFileSync(join(scratch, 'package.json'), JSON.stringify({ type: 'module' }))
  run('npm', ['install', '--silent', '--no-audit', '--no-fund', join(scratch, tarball)], scratch)

  writeFileSync(
    join(scratch, 'consume.mjs'),
    `import * as pkg from '${name}'
     const required = ['MomoApi', 'AirtelApi', 'CollectionApi', 'DisbursementApi',
       'AirtelTransaction', 'ErrorReason', 'MomoException', 'encryptAirtelPin']
     const missing = required.filter((n) => !(n in pkg))
     if (missing.length) throw new Error('missing exports: ' + missing.join(', '))
     if (pkg.AirtelTransaction.parse({ status: 'TI' }).isPending() !== true) {
       throw new Error('installed package misbehaves')
     }
     console.log('imported ' + Object.keys(pkg).length + ' exports')`
  )

  const out = run('node', ['consume.mjs'], scratch).trim()
  console.log(`verify:pack OK — ${name}@${version}, ${out}`)
} catch (error) {
  console.error('verify:pack FAILED\n', error.stderr?.toString() || error.message)
  process.exitCode = 1
} finally {
  rmSync(scratch, { recursive: true, force: true })
}
