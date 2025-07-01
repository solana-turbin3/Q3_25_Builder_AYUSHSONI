import bs58 from 'bs58'
import prompt from "prompt-sync"

const input = prompt()

console.log("Choose an option:")
console.log("1: Convert Base58 -> Byte Array")
console.log("2: Convert Byte Array -> Base58")

const choice = input("Enter 1 or 2: ")

if (choice === "1") {
 
  const base58Key = input("Enter your Phantom private key (Base58): ")
  try {
    const byteArray = bs58.decode(base58Key)
    console.log("\n Byte array format (Solana CLI):")
    console.log(`[${byteArray.toString()}]`)
  } catch (e) {
    console.error(" Invalid Base58 string.")
  }
} else if (choice === "2") {
 
  const byteArrayString = input("Enter your byte array (comma-separated): ")
  try {
    const byteArray = Uint8Array.from(
      byteArrayString.split(",").map((s) => parseInt(s.trim()))
    )
    const base58 = bs58.encode(byteArray)
    console.log("\n Phantom private key (Base58):")
    console.log(base58)
  } catch (e) {
    console.error(" Invalid byte array.")
  }
} else {
  console.log(" Invalid option.")
}
