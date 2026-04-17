function registerAuthRoutes(app, { readJson, usersFile, authToken }) {
  app.post('/api/auth/login', (req, res) => {
    const { emailOrUsername, password } = req.body || {};

    if (!emailOrUsername || !password) {
      return res.status(400).json({
        success: false,
        message: 'emailOrUsername and password are required',
      });
    }

    const normalizedInput = String(emailOrUsername).trim().toLowerCase();
    const users = readJson(usersFile, []);

    const matchedUser = Array.isArray(users)
      ? users.find((user) => {
          if (!user || typeof user !== 'object') {
            return false;
          }

          const usernameMatch =
            typeof user.username === 'string' &&
            user.username.toLowerCase() === normalizedInput;
          const emailMatch =
            typeof user.email === 'string' &&
            user.email.toLowerCase() === normalizedInput;
          const passwordMatch =
            typeof user.password === 'string' &&
            user.password === String(password);

          return (usernameMatch || emailMatch) && passwordMatch;
        })
      : undefined;

    if (!matchedUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password',
      });
    }

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token: authToken,
        user: {
          username: matchedUser.username,
          email: matchedUser.email,
        },
      },
    });
  });
}

module.exports = {
  registerAuthRoutes,
};
