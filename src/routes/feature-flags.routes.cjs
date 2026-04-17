function registerFeatureFlagRoutes(
  app,
  { readJson, writeJson, flagsFile, defaultFlags, requireAuth }
) {
  app.get('/api/feature-flags', (req, res) => {
    const flags = readJson(flagsFile, defaultFlags);
    return res.json({ success: true, data: flags });
  });

  app.put('/api/feature-flags', requireAuth, (req, res) => {
    const incoming = req.body || {};
    const current = readJson(flagsFile, defaultFlags);
    const updated = { ...current, ...incoming };

    Object.keys(defaultFlags).forEach((key) => {
      updated[key] = Boolean(updated[key]);
    });

    writeJson(flagsFile, updated);

    return res.json({
      success: true,
      message: 'Feature flags updated',
      data: updated,
    });
  });
}

module.exports = {
  registerFeatureFlagRoutes,
};
