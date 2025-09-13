require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { connect } = require("./db");
const accountsRouter = require("./routes/accounts");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Mount all /api routes
app.use("/api", accountsRouter);

// Test route
app.get("/", (req, res) => res.send("USDT Backend is running 🚀"));

// Start server after DB connection
const PORT = process.env.PORT || 5000;
connect().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}).catch(err => {
  console.error("❌ Failed to connect to DB", err);
});
