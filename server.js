const express = require("express");
const http = require("http");
const path = require("path");
const WebSocket = require("ws");
const bodyParser = require("body-parser");
const cors = require("cors");

// Routes
const authRoutes = require("./routes/auth");
const webhookRoutes = require("./routes/webhooks");
const apiRoutes = require("./routes/api");

// Scheduler
require("./scheduler");

// Blockchain singleton
const Blockchain = require("./blockchain");
const blockchain = new Blockchain();
module.exports = blockchain; // so other modules can import same instance

// Express setup
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/auth", authRoutes);
app.use("/webhooks", webhookRoutes);
app.use("/api", apiRoutes);

// Fallback route to serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// HTTP server
const server = http.createServer(app);

// WebSocket server
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("New WebSocket connection established.");

  // Send current blockchain state on connection
  ws.send(JSON.stringify({ type: "chain", data: blockchain.chain }));

  // Optional: receive messages from clients
  ws.on("message", (message) => {
    console.log("Received message from client:", message);
  });
});

// Function to broadcast blockchain updates to all connected clients
function broadcastUpdate() {
  const data = JSON.stringify({ type: "chain", data: blockchain.chain });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Broadcast whenever a new block is mined (patch minePendingTransactions)
const originalMine = blockchain.minePendingTransactions.bind(blockchain);
blockchain.minePendingTransactions = (minerAddress) => {
  const block = originalMine(minerAddress);
  broadcastUpdate();
  return block;
};

// Start server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

