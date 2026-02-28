require("dotenv").config();
const app = require("./src/app");
const pool = require("./src/config/db");

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  try {
    await pool.query("SELECT 1");
    console.log(`Server running on port ${PORT}`);
  } catch (err) {
    console.error("Database connection failed", err);
  }
});