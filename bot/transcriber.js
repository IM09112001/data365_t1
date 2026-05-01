import 'dotenv/config';
import Groq from 'groq-sdk';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import os from 'os';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function transcribe(fileUrl) {
  const res = await fetch(fileUrl);
  const buffer = Buffer.from(await res.arrayBuffer());
  const tmpPath = path.join(os.tmpdir(), `tflow_${Date.now()}.ogg`);
  fs.writeFileSync(tmpPath, buffer);

  try {
    const result = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tmpPath),
      model: 'whisper-large-v3',
      response_format: 'text',
    });
    return typeof result === 'string' ? result.trim() : (result?.text ?? '').trim();
  } finally {
    try { fs.unlinkSync(tmpPath); } catch {}
  }
}
