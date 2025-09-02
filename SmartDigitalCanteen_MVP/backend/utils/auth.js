export function requireAdmin(req, res, next) {
  const provided = req.header("x-admin-key");
  const expected = process.env.ADMIN_PASSWORD || "demo_password";
  if (!provided || provided !== expected) {
    return res.status(401).json({ error: "Unauthorized: invalid admin key" });
  }
  next();
}
