const fs = require("fs");
const axios = require("axios");

const API_BASE = "https://forgotteneth.com/api";
const FILE_PATH = "./wallets.txt";

// delay biar ga kena rate limit
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// baca file txt
function loadWallets() {
    const data = fs.readFileSync(FILE_PATH, "utf-8");
    return data.split("\n").map(w => w.trim()).filter(Boolean);
}

// cek wallet
async function checkWallet(address) {
    try {
        const res = await axios.get(`${API_BASE}/wallet/${address}`, {
            timeout: 15000
        });
        return res.data;
    } catch (err) {
        return { error: err.message };
    }
}

// main
async function main() {
    const wallets = loadWallets();
    console.log(`Total wallet: ${wallets.length}\n`);

    for (let i = 0; i < wallets.length; i++) {
        const address = wallets[i];

        const result = await checkWallet(address);

        console.log(`(${i + 1}/${wallets.length}) ${address}`);
        console.log(result);
        console.log("====================================");

        // delay 1 detik biar aman
        await delay(1000);
    }
}

main();
