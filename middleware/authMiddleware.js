// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const sql = require("../config/db").sql;
const AppError = require("../utils/AppError");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Unauthorized, token missing", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from DB
    const users =
      await sql`SELECT id, name, email, role FROM users WHERE id = ${decoded.id}`;
    if (users.length === 0) {
      return next(new AppError("User not found", 404));
    }

    req.user = users[0]; // attach user info to request
    next();
  } catch (err) {
    return next(new AppError("Invalid or expired token", 401));
  }
};

module.exports = authMiddleware;
