const { PORT } = require('./config/env.cjs');
const { createApp } = require('./app.cjs');

const app = createApp();

app.listen(PORT, () => {
  console.log(`API server is running on http://localhost:${PORT}`);
});
