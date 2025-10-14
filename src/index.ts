import app from "./app.js";

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({ message: "Server is running!" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
