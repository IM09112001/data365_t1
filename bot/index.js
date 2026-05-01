import 'dotenv/config';
import express from 'express';
import { handleUpdate } from './handler.js';

const app = express();
app.use(express.json());

app.get('/health', (_, res) => res.json({ ok: true, service: 'tangaflow-bot' }));

app.post('/webhook', async (req, res) => {
  res.sendStatus(200); // ack immediately
  try {
    await handleUpdate(req.body);
  } catch (err) {
    console.error('webhook error:', err);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`TangaFlow bot on port ${PORT}`));
