import "dotenv/config";
import cron from "node-cron";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { markAbsentees } from "./jobs/markAbsentees.js";

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Dayflow API listening on port ${PORT}`);
  });

  // Just after midnight, mark yesterday's no-show employees Absent — see
  // jobs/markAbsentees.js.
  cron.schedule("5 0 * * *", () => {
    markAbsentees().catch((err) => console.error("markAbsentees failed:", err));
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
