import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createSignerFromKeypair, signerIdentity, generateSigner, percentAmount } from "@metaplex-foundation/umi"
import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";

import wallet from "../turbin3-wallet.json"
import base58 from "bs58";

const RPC_ENDPOINT = "https://api.devnet.solana.com";
const umi = createUmi(RPC_ENDPOINT);

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const myKeypairSigner = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(myKeypairSigner));
umi.use(mplTokenMetadata())

const mint = generateSigner(umi);

(async () => {
    try {
        let tx = createNft(umi, {
            mint,
            name: "jeff the rugger",
            uri: "https://arweave.net/9HZ4XgyZarGRTQebv5RUht59k3ZJjWqZa56kJku7HAXT",
            sellerFeeBasisPoints: percentAmount(5),
            symbol: "JFX"
        })
        
        let result = await tx.sendAndConfirm(umi);
        const signature = base58.encode(result.signature);
        console.log(`Successfully Minted! Check out your TX here:\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`)
        console.log("Mint Address: ", mint.publicKey);
    }
    catch(error) {
        console.log("Oops.. Something went wrong", error);
    }
})();