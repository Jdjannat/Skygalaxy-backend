function createRequireAuth(authToken) {
  return function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (token !== authToken) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized request',
      });
    }

    return next();
  };
}

module.exports = {
  createRequireAuth,
};
