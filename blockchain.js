const crypto = require("crypto");

class Block {
  constructor(index, timestamp, transactions, nonce, previousHash) {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.nonce = nonce;
    this.previousHash = previousHash;
    this.hash = this.computeHash();
  }

  computeHash() {
    const blockString =
      this.index +
      this.timestamp +
      JSON.stringify(this.transactions) +
      this.nonce +
      this.previousHash;
    return crypto.createHash("sha256").update(blockString).digest("hex");
  }
}

class Blockchain {
  constructor(difficulty = 3) {
    this.chain = [];
    this.pendingTransactions = [];
    this.difficulty = difficulty;
    this.createGenesisBlock();
  }

  createGenesisBlock() {
    const genesis = new Block(0, Date.now(), [], 0, "0");
    this.chain.push(genesis);
  }

  getLastBlock() {
    return this.chain[this.chain.length - 1];
  }

  createTransaction(tx) {
    this.pendingTransactions.push(tx);
    return this.getLastBlock().index + 1;
  }

  createReward(recipient, amount) {
    const tx = { from: "network", to: recipient, amount };
    this.pendingTransactions.push(tx);
    return this.getLastBlock().index + 1;
  }

  minePendingTransactions(minerAddress) {
    const lastBlock = this.getLastBlock();
    const index = lastBlock.index + 1;
    const timestamp = Date.now();
    const transactions = [...this.pendingTransactions];

    // Add a miner reward transaction
    const rewardTx = { from: "network", to: minerAddress, amount: 1 };
    transactions.push(rewardTx);

    const { nonce, hash } = this.proofOfWork(
      index,
      timestamp,
      transactions,
      lastBlock.hash
    );

    const block = new Block(index, timestamp, transactions, nonce, lastBlock.hash);
    block.hash = hash;

    this.chain.push(block);
    this.pendingTransactions = [];
    return block;
  }

  proofOfWork(index, timestamp, transactions, previousHash) {
    let nonce = 0;
    while (true) {
      const blockString =
        index + timestamp + JSON.stringify(transactions) + nonce + previousHash;
      const hash = crypto.createHash("sha256").update(blockString).digest("hex");
      if (hash.substring(0, this.difficulty) === "0".repeat(this.difficulty)) {
        return { nonce, hash };
      }
      nonce++;
    }
  }

  getBalance(address) {
    let balance = 0;
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.from === address) balance -= tx.amount;
        if (tx.to === address) balance += tx.amount;
      }
    }
    for (const tx of this.pendingTransactions) {
      if (tx.from === address) balance -= tx.amount;
      if (tx.to === address) balance += tx.amount;
    }
    return balance;
  }
}

module.exports = Blockchain;

