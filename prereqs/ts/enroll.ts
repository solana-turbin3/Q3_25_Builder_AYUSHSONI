import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { Program, Wallet, AnchorProvider } from "@coral-xyz/anchor";
import { IDL, Turbin3Prereq } from "./programs/Turbin3_prereq";
import wallet from "./turbin3-wallet.json";

const MPL_CORE_PROGRAM_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
const SYSTEM_PROGRAM_ID = SystemProgram.programId;

const PROGRAM_ID = new PublicKey("TRBZyQHB3m68FGeVsqTK39Wm4xejadjVhP5MAZaKWDM");


const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));


const connection = new Connection("https://api.devnet.solana.com");


const provider = new AnchorProvider(connection, new Wallet(keypair), {
  commitment: "confirmed"
});

const program = new Program(IDL, provider);


const account_seeds = [
  Buffer.from("prereqs"),
  keypair.publicKey.toBuffer(),
];
const [account_key, account_bump] =
  PublicKey.findProgramAddressSync(account_seeds, program.programId);


const mintCollection = new PublicKey("5ebsp5RChCGK7ssRZMVMufgVZhd2kFbNaotcZ5UvytN2");


const mintTs = Keypair.generate();


const authority_seeds = [
  Buffer.from("collection"), 
  mintCollection.toBuffer(),  
];
const [authority_key, authority_bump] =
  PublicKey.findProgramAddressSync(authority_seeds, program.programId);


async function initialize() {
  try {
    const txhash = await program.methods
      .initialize("ayushsoni02") 
      .accountsPartial({
        user: keypair.publicKey,
        account: account_key,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([keypair])
      .rpc();
    console.log(`Initialize Success! Check out your TX here:
https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
  } catch (e) {
    console.error(`Initialize failed: ${e}`);
  }
}



async function submitTs() {
  try {
    const txhash = await program.methods
      .submitTs()
      .accountsPartial({
        user: keypair.publicKey,
        account: account_key,
        mint: mintTs.publicKey,
        collection: mintCollection,
        authority: authority_key, 
        mplCoreProgram: MPL_CORE_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([keypair, mintTs])
      .rpc();
    console.log(`Submit TS Success! Check out your TX here:
https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
  } catch (e) {
    console.error(`Submit TS failed: ${e}`);
  }
}

(async () => {
  console.log("Starting Turbin3 enrollment process...");
  console.log(`Your public key: ${keypair.publicKey.toBase58()}`);
  console.log(`Account PDA: ${account_key.toBase58()}`);
  console.log(`Authority PDA: ${authority_key.toBase58()}`);
  console.log(`Mint address: ${mintTs.publicKey.toBase58()}`);

 
  console.log("\n== Running Initialize ==");
  await initialize();

  
  console.log("\n Waiting 3 seconds before submitting TS...");
  await new Promise(resolve => setTimeout(resolve, 3000));

 
  console.log("\n== Running Submit TS ==");
  await submitTs();

  console.log("\n Enrollment process completed!");
})();