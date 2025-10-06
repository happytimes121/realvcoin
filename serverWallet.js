const { createKeyPair } = require("./wallet");
const fs = require("fs");
const path = require("path");

// Path to store server key locally
const keyPath = path.join(__dirname, "server_key.json");

let serverKey;

// Load existing key if it exists
if (fs.existsSync(keyPath)) {
  serverKey = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
  console.log("Loaded existing server key.");
} else {
  // Otherwise, create a new keypair and save it
  serverKey = createKeyPair();
  fs.writeFileSync(keyPath, JSON.stringify(serverKey, null, 2));
  console.log("Generated new server key and saved to server_key.json");
}

module.exports = serverKey;

