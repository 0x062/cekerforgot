const fs = require("fs");
const { Wallet } = require("ethers");

const INPUT_FILE = "./privatekeys.txt";
const OUTPUT_FILE = "./wallets-result.txt";

function normalizePrivateKey(key) {
  const clean = key.trim();
  if (!clean) return null;

  const withPrefix = clean.startsWith("0x") ? clean : `0x${clean}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(withPrefix)) return null;

  return withPrefix;
}

const keys = fs.readFileSync(INPUT_FILE, "utf8")
  .split(/\r?\n/)
  .map(normalizePrivateKey)
  .filter(Boolean);

const addresses = [];

for (const pk of keys) {
  try {
    const wallet = new Wallet(pk);
    addresses.push(wallet.address);
    console.log(wallet.address);
  } catch (e) {
    console.log("ERROR:", e.message);
  }
}

fs.writeFileSync(OUTPUT_FILE, addresses.join("\n"), "utf8");
console.log(`\nTersimpan ke ${OUTPUT_FILE}`);
