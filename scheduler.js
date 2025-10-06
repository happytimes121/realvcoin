
const cron = require("node-cron");
const axios = require("axios");
const blockchain = require("./blockchain-instance");

// Example projects array; replace with real DB queries
const projects = [
  {
    name: "Demo Project",
    url: "https://example-render-project.onrender.com",
    ownerWalletPubKey: "userPublicKey1"
  },
  {
    name: "Another Project",
    url: "https://example2.onrender.com",
    ownerWalletPubKey: "userPublicKey2"
  }
];

/**
 * Check if project URL is up
 */
async function checkProjectUp(url) {
  try {
    const res = await axios.get(url, { timeout: 5000 });
    return res.status >= 200 && res.status < 300;
  } catch (e) {
    return false;
  }
}

/**
 * Scheduler task: every 15 minutes, check uptime and award vcoin
 */
cron.schedule("*/15 * * * *", async () => {
  console.log("[Scheduler] Checking project uptime and awarding vcoin...");
  for (const project of projects) {
    const isUp = await checkProjectUp(project.url);
    if (isUp) {
      // Award 0.1 vcoin for being up
      blockchain.createReward(project.ownerWalletPubKey, 0.1);
      console.log(`Awarded 0.1 vcoin to ${project.name} (${project.ownerWalletPubKey})`);
    } else {
      console.log(`${project.name} is down. No reward.`);
    }
  }

  // Optionally, mine a block to include these rewards immediately
  // Example: use first project owner as miner
  if (projects.length > 0) {
    blockchain.minePendingTransactions(projects[0].ownerWalletPubKey);
    console.log("[Scheduler] Mined a new block with pending rewards.");
  }
});
