#[cfg(test)]
mod tests {
    use bs58;
    use solana_client::rpc_client::RpcClient;
    use solana_program::{pubkey::Pubkey, system_instruction::transfer};
    use std::io::{self, BufRead};

    use solana_sdk::{
        hash::hash,
        instruction::{AccountMeta, Instruction},
        message::Message,
        signature::{Keypair, Signer, read_keypair_file},
        system_program,
        transaction::Transaction,
    };
    use std::str::FromStr;

    const RPC_URL: &str = "https://turbine-solanad-4cde.devnet.rpcpool.com/9a9da9cf-6db1-47dc-839a-55aca5c9c80a";

    #[test]
    fn keygen() {
        let kp = Keypair::new();

        println!(
            "You have generated a new Solana wallet :{}",
            kp.pubkey().to_string()
        );
        println!("");
        println!("To save your wallet, copy and paste the following into a JSON file:");
        println!("{:?}", kp.to_bytes());
    }

    #[test]
    fn base58_to_wallet() {
        println!("Input your private key as a base58 string:");
        let stdin = io::stdin();
        let base58 = stdin.lock().lines().next().unwrap().unwrap();
        println!("Your wallet file format is:");
        let wallet = bs58::decode(base58).into_vec().unwrap();
        println!("{:?}", wallet);
    }

    #[test]
    fn wallet_to_base58() {
        println!("Input your private key as a JSON byte array (e.g. [12,34,...]):");
        let stdin = io::stdin();
        let wallet = stdin
            .lock()
            .lines()
            .next()
            .unwrap()
            .unwrap()
            .trim_start_matches('[')
            .trim_end_matches(']')
            .split(',')
            .map(|s| s.trim().parse::<u8>().unwrap())
            .collect::<Vec<u8>>();

        println!("Your Base58-encoded private key is:");
        let base58 = bs58::encode(wallet).into_string();
        println!("{}", base58);
    }

    #[test]
    fn airdrop() {
        let keypair = read_keypair_file("dev-wallet.json").expect("Couldn't find wallet file");

        let client = RpcClient::new(RPC_URL);

        match client.request_airdrop(&keypair.pubkey(), 2_000_000_000u64) {
            Ok(sig) => {
                println!("Success! Check your TX here:");
                println!("https://explorer.solana.com/tx/{}?cluster=devnet", sig);
            }
            Err(err) => {
                println!("Airdrop failed: {}", err);
            }
        }
    }

    #[test]
    fn check_balance() {
        let keypair = read_keypair_file("dev-wallet.json").expect("Couldn't find wallet file");

        let client = RpcClient::new(RPC_URL);

        match client.get_balance(&keypair.pubkey()) {
            Ok(balance) => {
                println!("Wallet: {}", keypair.pubkey());
                println!("Balance: {} lamports", balance);
                println!("Balance: {} SOL", balance as f64 / 1_000_000_000.0);
            }
            Err(err) => {
                println!("Failed to get balance: {}", err);
            }
        }
    }

    #[test]
    fn transfer_sol() {
        let keypair = read_keypair_file("dev-wallet.json").expect("Couldn't find wallet file");

        let pubkey = keypair.pubkey();
        println!("Source wallet: {}", pubkey);

        let message_bytes = b"I verify my Solana Keypair!";
        let sig = keypair.sign_message(message_bytes);
        let sig_hashed = hash(sig.as_ref());

        match sig.verify(&pubkey.to_bytes(), &sig_hashed.to_bytes()) {
            true => println!(" Signature verified"),
            false => println!(" Verification failed"),
        }

        let to_pubkey = Pubkey::from_str("EqUdYmC6nSETUfwXatSvy9VBMHiozjftvPkGniDZs5hs").unwrap();
        println!("Destination wallet: {}", to_pubkey);

        let rpc_client = RpcClient::new(RPC_URL);

        let recent_blockhash = rpc_client
            .get_latest_blockhash()
            .expect("Failed to get recent blockhash");

        let balance = rpc_client
            .get_balance(&keypair.pubkey())
            .expect("Failed to get balance");
        println!("Current balance: {} SOL", balance as f64 / 1_000_000_000.0);

        let transaction = Transaction::new_signed_with_payer(
            &[transfer(&keypair.pubkey(), &to_pubkey, 100_000_000)], // 0.1 SOL
            Some(&keypair.pubkey()),
            &vec![&keypair],
            recent_blockhash,
        );

        let signature = rpc_client
            .send_and_confirm_transaction(&transaction)
            .expect("Failed to send transaction");

        println!(
            "Success! Check out your TX here: https://explorer.solana.com/tx/{}/?cluster=devnet",
            signature
        );

        let new_balance = rpc_client
            .get_balance(&keypair.pubkey())
            .expect("Failed to get balance");
        println!("New balance: {} SOL", new_balance as f64 / 1_000_000_000.0);
    }

    #[test]
    fn empty_wallet() {
        let keypair = read_keypair_file("dev-wallet.json").expect("Couldn't find wallet file");

        let to_pubkey = Pubkey::from_str("EqUdYmC6nSETUfwXatSvy9VBMHiozjftvPkGniDZs5hs").unwrap();

        let rpc_client = RpcClient::new(RPC_URL);

        let recent_blockhash = rpc_client
            .get_latest_blockhash()
            .expect("Failed to get recent blockhash");

        let balance = rpc_client
            .get_balance(&keypair.pubkey())
            .expect("Failed to get balance");

        println!(
            "Current balance: {} SOL ({} lamports)",
            balance as f64 / 1_000_000_000.0,
            balance
        );

        let message = Message::new_with_blockhash(
            &[transfer(&keypair.pubkey(), &to_pubkey, balance)],
            Some(&keypair.pubkey()),
            &recent_blockhash,
        );

        let fee = rpc_client
            .get_fee_for_message(&message)
            .expect("Failed to get fee calculator");

        println!("Transaction fee: {} lamports", fee);
        println!(
            "Amount to transfer: {} SOL ({} lamports)",
            (balance - fee) as f64 / 1_000_000_000.0,
            balance - fee
        );

        let transaction = Transaction::new_signed_with_payer(
            &[transfer(&keypair.pubkey(), &to_pubkey, balance - fee)],
            Some(&keypair.pubkey()),
            &vec![&keypair],
            recent_blockhash,
        );

        let signature = rpc_client
            .send_and_confirm_transaction(&transaction)
            .expect("Failed to send final transaction");

        println!(
            "Success! Entire balance transferred: https://explorer.solana.com/tx/{}/?cluster=devnet",
            signature
        );

        let final_balance = rpc_client
            .get_balance(&keypair.pubkey())
            .expect("Failed to get final balance");

        println!(
            "Final balance: {} SOL ({} lamports)",
            final_balance as f64 / 1_000_000_000.0,
            final_balance
        );

        if final_balance == 0 {
            println!(" Wallet successfully emptied!");
        } else {
            println!(" Wallet still has {} lamports remaining", final_balance);
        }
    }

    #[test]
    fn submit_turbin3_completion()  {
    let rpc_client = RpcClient::new(RPC_URL);
    let signer = read_keypair_file("turbin3-wallet.json")
        .expect("Couldn't find wallet file");
    
    let mint = Keypair::new();

    let turbin3_prereq_program =
        Pubkey::from_str("TRBZyQHB3m68FGeVsqTK39Wm4xejadjVhP5MAZaKWDM").unwrap();
    let collection =
        Pubkey::from_str("5ebsp5RChCGK7ssRZMVMufgVZhd2kFbNaotcZ5UvytN2").unwrap();
    let mpl_core_program =
        Pubkey::from_str("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d").unwrap();
    let system_program = system_program::id();

    
    let signer_pubkey = signer.pubkey(); 
    let seeds = &[b"prereqs", signer_pubkey.as_ref()];
    let (prereq_pda, _bump) = Pubkey::find_program_address(seeds, &turbin3_prereq_program);

    
    let authority_seeds = &[b"collection", collection.as_ref()];
    let (authority, _authority_bump) = Pubkey::find_program_address(authority_seeds, &turbin3_prereq_program);

    
    let data = vec![77, 124, 82, 163, 21, 133, 181, 206];

    let accounts = vec![
        AccountMeta::new(signer.pubkey(), true),        // user signer
        AccountMeta::new(prereq_pda, false),            // PDA account
        AccountMeta::new(mint.pubkey(), true),          // mint keypair
        AccountMeta::new(collection, false),            // collection
        AccountMeta::new_readonly(authority, false),    // authority (PDA)
        AccountMeta::new_readonly(mpl_core_program, false), // mpl core program
        AccountMeta::new_readonly(system_program, false),   // system program
    ];

    let blockhash = rpc_client
        .get_latest_blockhash()
        .expect("Failed to get recent blockhash");

    let instruction = Instruction {
        program_id: turbin3_prereq_program,
        accounts,
        data,
    };

    let transaction = Transaction::new_signed_with_payer(
        &[instruction],
        Some(&signer.pubkey()),
        &[&signer, &mint],
        blockhash,
    );

    let signature = rpc_client
        .send_and_confirm_transaction(&transaction)
        .expect("Failed to send transaction");
    
    println!(
        " Success! Check out your TX here:\nhttps://explorer.solana.com/tx/{}/?cluster=devnet",
        signature
    );
    
    println!(" Your Rust NFT mint: {}", mint.pubkey());
    println!(" Prereq account: {}", prereq_pda);
}

}
