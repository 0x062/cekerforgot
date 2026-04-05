const fs = require("fs");
const axios = require("axios");

// ===== CONFIG =====
const FILE_PATH = "./wallets.txt";
const OUTPUT_ALL = "./result-all.json";
const OUTPUT_HITS = "./result-hits.json";

const BATCH_SIZE = 10;     // jumlah request paralel
const DELAY = 800;         // delay antar batch (ms)
const RETRY = 2;           // retry jika gagal

// ==================

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// load wallets
function loadWallets() {
    return fs.readFileSync(FILE_PATH, "utf-8")
        .split("\n")
        .map(x => x.trim())
        .filter(Boolean);
}

// request ke API
async function fetchWallet(address, attempt = 1) {
    try {
        const res = await axios.get(
            "https://forgotteneth.com/api/check",
            {
                params: { address },
                timeout: 15000
            }
        );
        return { address, data: res.data };
    } catch (err) {
        if (attempt <= RETRY) {
            console.log(`🔁 Retry (${attempt}) ${address}`);
            await delay(500);
            return fetchWallet(address, attempt + 1);
        }
        return { address, error: err.message };
    }
}

// filter hasil (custom sesuai response nanti)
function isInteresting(result) {
    if (!result.data) return false;

    // contoh umum (nanti bisa kita sesuaikan dari response asli)
    const d = result.data;

    return (
        d.balance > 0 ||
        d.hasBalance === true ||
        (d.tokens && d.tokens.length > 0) ||
        d.claimable === true
    );
}

// main
async function main() {
    const wallets = loadWallets();
    console.log(`🔥 Total wallet: ${wallets.length}\n`);

    const allResults = [];
    const hits = [];

    for (let i = 0; i < wallets.length; i += BATCH_SIZE) {
        const batch = wallets.slice(i, i + BATCH_SIZE);

        console.log(`🚀 Batch ${i + 1} - ${i + batch.length}`);

        const results = await Promise.all(
            batch.map(addr => fetchWallet(addr))
        );

        results.forEach((res, index) => {
            const current = i + index + 1;

            console.log(`(${current}/${wallets.length}) ${res.address}`);

            if (res.error) {
                console.log("❌ ERROR:", res.error);
            } else {
                console.log("✅ OK");

                if (isInteresting(res)) {
                    console.log("💰 HIT TERDETEKSI!");
                    hits.push(res);
                }
            }

            console.log("====================================");
        });

        allResults.push(...results);

        // delay antar batch
        await delay(DELAY);
    }

    // simpan file
    fs.writeFileSync(OUTPUT_ALL, JSON.stringify(allResults, null, 2));
    fs.writeFileSync(OUTPUT_HITS, JSON.stringify(hits, null, 2));

    console.log("\n====================");
    console.log(`✅ SELESAI`);
    console.log(`📁 All result: ${OUTPUT_ALL}`);
    console.log(`💰 Hits: ${OUTPUT_HITS}`);
    console.log(`🔥 Total hits: ${hits.length}`);
}

main();
