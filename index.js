const fs = require("fs");
const { exec } = require("child_process");

// ===== CONFIG =====
const FILE_PATH = "./wallets.txt";
const OUTPUT_ALL = "./result-all.json";
const OUTPUT_HITS = "./result-hits.json";

const BATCH_SIZE = 5;
const DELAY = 1000;
const RETRY = 2;

// ==================

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// load wallets
function loadWallets() {
    return fs.readFileSync(FILE_PATH, "utf-8")
        .split("\n")
        .map(x => x.trim())
        .filter(Boolean);
}

// curl request
function curlRequest(address) {
    return new Promise((resolve) => {
        const cmd = `curl -s "https://forgotteneth.com/api/check?address=${address}"`;

        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                return resolve({ address, error: error.message });
            }

            try {
                const json = JSON.parse(stdout);
                resolve({ address, data: json });
            } catch (e) {
                resolve({ address, error: "Invalid JSON / blocked" });
            }
        });
    });
}

// retry wrapper
async function fetchWallet(address, attempt = 1) {
    const res = await curlRequest(address);

    if (res.error && attempt <= RETRY) {
        console.log(`🔁 Retry (${attempt}) ${address}`);
        await delay(500);
        return fetchWallet(address, attempt + 1);
    }

    return res;
}

// filter (sementara generic)
function isInteresting(result) {
    if (!result.data) return false;

    const d = result.data;

    return (
        d.balance > 0 ||
        d.hasBalance === true ||
        d.claimable === true ||
        (d.tokens && d.tokens.length > 0)
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
                console.log("❌", res.error);
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

        await delay(DELAY);
    }

    // simpan
    fs.writeFileSync(OUTPUT_ALL, JSON.stringify(allResults, null, 2));
    fs.writeFileSync(OUTPUT_HITS, JSON.stringify(hits, null, 2));

    console.log("\n====================");
    console.log("✅ SELESAI");
    console.log(`📁 ${OUTPUT_ALL}`);
    console.log(`💰 Hits: ${hits.length}`);
}

main();
