import {
    Transaction,
    SystemProgram,
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction
} from "@solana/web3.js";
import wallet from "./dev-wallet.json"

const from = Keypair.fromSecretKey(new Uint8Array(wallet));
const to = new PublicKey("EqUdYmC6nSETUfwXatSvy9VBMHiozjftvPkGniDZs5hs");

const connection = new Connection("https://api.devnet.solana.com","confirmed");

; (async () => {
    try {
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: from.publicKey,
                toPubkey: to,
                lamports: LAMPORTS_PER_SOL / 100,
            })
        )

        transaction.recentBlockhash = (
            await connection.getLatestBlockhash('confirmed')
        ).blockhash;
        transaction.feePayer = from.publicKey

        const signature = await sendAndConfirmTransaction(connection, transaction, [from])

        console.log("Success! Check your transaction here:")
        console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`)
    } catch (e) {
        console.error(`Oops! Something went wrong:\n${e}`)
    }
})()