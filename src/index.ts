import "dotenv/config";
import app from "./app.js";
import logger from "./utils/logger.js";

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({ message: "Server is running!" });
});

app.listen(PORT, () => {
  logger.info(`Server running at http://localhost:${PORT}`);
});
