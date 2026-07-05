const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes middleware
const protect = async (req, res, next) => {
  console.log("\n========== AUTH REQUEST ==========");
  console.log("Method:", req.method);
  console.log("URL:", req.originalUrl);
  console.log("Authorization:", req.headers.authorization);

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'postscan_super_secret_jwt_key_123!'
      );

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found'
        });
      }

      return next();
    } catch (error) {
      console.error("JWT ERROR:", error.message);

      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  console.log("❌ No Authorization header received.");

  return res.status(401).json({
    success: false,
    message: 'Not authorized, no token provided'
  });
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user ? req.user.role : 'none'}' is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
