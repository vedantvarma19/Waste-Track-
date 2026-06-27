// server/middleware/authMiddleware.js

const checkAuth = (req, res, next) => {
  if (!req.session || !req.session.emp_id) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.session || !roles.includes(req.session.role)) {
      return res.status(403).json({ error: "Not authorized to access this resource" });
    }
    next();
  };
};

module.exports = {
  checkAuth,
  restrictTo
};
