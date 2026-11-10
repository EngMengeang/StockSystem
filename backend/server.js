import express from "express";
import "./model/relational/relation.js";
import cors from "cors";
import router from "./routes/post.js";

import sequelize from "./ulits/database.js";
import { beforeSync, afterSync } from "./db/migrate.js";

// the server cannot sign or check logins without a secret, so refuse to start without one
if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is not set. Add it to backend/.env (any long random text) and restart.");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = Number(process.env.PORT) || 4000;

app.use("/api/", router);

// anything that is not an API route, and any error, answers in JSON (the screens expect JSON, never an HTML page)
app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") return res.status(400).json({ message: "The request body is not valid JSON." });
  if (err.type === "entity.too.large") return res.status(413).json({ message: "That request is too large." });
  console.error("Unhandled error:", err.message);
  res.status(500).json({ message: "Something went wrong on the server. Please try again." });
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully.");

    await beforeSync();                       // tidy old data first
    await sequelize.sync({ alter: true });
    await afterSync();                        // then move data + add DB rules
    console.log("Tables created or altered as needed.");

    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (error) {
    console.error(`❌ Could not start: ${error.message}`);
    process.exit(1); // stop the app if the database is not reachable
  }
})();
