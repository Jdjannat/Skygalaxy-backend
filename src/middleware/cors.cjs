function createCorsMiddleware({ allowAllOrigins, allowedOrigins }) {
  function isAllowedOrigin(origin) {
    if (!origin) {
      return true;
    }

    if (allowAllOrigins) {
      return true;
    }

    if (allowedOrigins.length === 0) {
      return true;
    }

    return allowedOrigins.includes(origin);
  }

  return function corsMiddleware(req, res, next) {
    const requestOrigin = req.headers.origin;

    if (isAllowedOrigin(requestOrigin)) {
      res.setHeader(
        'Access-Control-Allow-Origin',
        allowAllOrigins ? '*' : requestOrigin || (allowedOrigins[0] || '*')
      );

      if (!allowAllOrigins) {
        res.setHeader('Vary', 'Origin');
      }
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return isAllowedOrigin(requestOrigin) ? res.sendStatus(204) : res.sendStatus(403);
    }

    return next();
  };
}

module.exports = {
  createCorsMiddleware,
};
