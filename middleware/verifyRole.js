// Role guards — run AFTER verifyJWT (which sets req.user from the token).

function verifyAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
}

function verifyVendor(req, res, next) {
  if (req.user?.role !== "vendor") {
    return res.status(403).json({ message: "Vendors only" });
  }
  next();
}

module.exports = { verifyAdmin, verifyVendor };
