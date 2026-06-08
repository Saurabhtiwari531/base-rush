// Reset the Base Rush leaderboard (owner-only resetLeaderboard()).
// Your private key is typed into a HIDDEN prompt — it is kept only in memory,
// never written to disk, never printed, never sent anywhere. Run from the
// project folder:   node reset-leaderboard.mjs
import { createWalletClient, createPublicClient, http, fallback } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'
import readline from 'node:readline'

const CONTRACT = '0xf4f87e5f6c559084286a0c993379b1b6b8b7f9e6'
// Multiple RPCs with a longer timeout — the official one was timing out.
const transport = fallback([
  http('https://base.llamarpc.com', { timeout: 20000 }),
  http('https://base-rpc.publicnode.com', { timeout: 20000 }),
  http('https://base.drpc.org', { timeout: 20000 }),
  http('https://mainnet.base.org', { timeout: 20000 }),
], { retryCount: 3 })
const abi = [
  { name: 'owner', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'resetLeaderboard', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { name: 'getTop3', type: 'function', stateMutability: 'view', inputs: [], outputs: [
    { type: 'address' }, { type: 'uint256' }, { type: 'address' }, { type: 'uint256' }, { type: 'address' }, { type: 'uint256' }] },
]

function askHidden(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question(query, (value) => { rl.close(); process.stdout.write('\n'); resolve(value.trim()) })
    rl._writeToOutput = (str) => { rl.output.write(str.includes(query) ? query : '*') }
  })
}

let pk = await askHidden('Paste OWNER wallet private key (hidden), then press Enter: ')
if (!pk.startsWith('0x')) pk = '0x' + pk

let account
try { account = privateKeyToAccount(pk) }
catch { console.log('\n❌ That does not look like a valid private key. Aborting.'); process.exit(1) }

const pub = createPublicClient({ chain: base, transport })
const owner = await pub.readContract({ address: CONTRACT, abi, functionName: 'owner' })

console.log('\nYour wallet : ' + account.address)
console.log('Contract owner: ' + owner)
if (account.address.toLowerCase() !== owner.toLowerCase()) {
  console.log('\n❌ This key is NOT the owner wallet — resetLeaderboard would fail. No transaction sent.')
  process.exit(1)
}
console.log('\n✅ Owner match. Sending resetLeaderboard() ...')

const wallet = createWalletClient({ account, chain: base, transport })
const hash = await wallet.writeContract({ address: CONTRACT, abi, functionName: 'resetLeaderboard' })
console.log('Tx: https://basescan.org/tx/' + hash)
const rcpt = await pub.waitForTransactionReceipt({ hash })
console.log('Status: ' + rcpt.status)

const r = await pub.readContract({ address: CONTRACT, abi, functionName: 'getTop3' })
const top = Number(r[1])
console.log('New #1 score: ' + top.toLocaleString())
console.log(rcpt.status === 'success' && top === 0 ? '\n🎉 LEADERBOARD RESET — fresh week!' : '\n⚠️ Something is off — check the tx above.')
