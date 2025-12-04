export const requestLogger = (req, res, next) => {
  const token = req.headers.authorization || "NO_TOKEN";

  console.log("====================================");
  console.log("📌 Route Hit:", req.method, req.originalUrl);

  console.log("====================================");

  // Attach token to the request (backend can use it)

  next();
};
