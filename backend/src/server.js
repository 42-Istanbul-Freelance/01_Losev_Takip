const express = require('express');
const cors = require('cors');
const config = require('./config');
const apiRouter = require('./routes/router');

const app = express();
const PORT = config.port;

const path = require('path');

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../../frontend')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'LÖSEV İnci Gönüllülük API is running' });
});

app.use('/api', apiRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
