import { Connection,Keypair,LAMPORTS_PER_SOL } from "@solana/web3.js";
import wallet from "./dev-wallet.json"

const keypair = Keypair.fromSecretKey(new Uint8Array(wallet))

const connection = new Connection("https://api.devnet.solana.com", "confirmed")

;(async () => {
  try {
    console.log(`Requesting airdrop to: ${keypair.publicKey.toBase58()}`)
    const txhash = await connection.requestAirdrop(
      keypair.publicKey,
      2 * LAMPORTS_PER_SOL
    )

    console.log(` Success! View your TX here:`)
    console.log(`https://explorer.solana.com/tx/${txhash}?cluster=devnet`)
  } catch (e) {
    console.error(` Oops, something went wrong:\n${e}`)
  }
})()