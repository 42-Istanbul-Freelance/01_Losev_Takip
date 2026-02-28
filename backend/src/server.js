const express = require('express');
const cors = require('cors');
const apiRouter = require('./routes');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'LÖSEV İnci Gönüllülük API is running' });
});

app.use('/api', apiRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
