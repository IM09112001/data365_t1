import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CATEGORIES = [
  'Fuel', 'Tolls', 'Customs', 'Driver Salary', 'Vehicle Maintenance',
  'Warehouse', 'Delivery Costs', 'Client Payment', 'Delivery Revenue', 'Contract Payment',
];

const SYSTEM = `You are a transaction parser for a logistics company in Uzbekistan.
Parse the message and return ONLY a JSON object — no markdown, no explanation.

Known categories: ${CATEGORIES.join(', ')}

JSON structure:
{
  "intent": "log" | "query" | "undo",
  "type": "income" | "expense" | null,
  "amount": number | null,
  "currency": "USD" | "UZS",
  "category": string | null,
  "date": "YYYY-MM-DD" | "today" | null,
  "note": string | null,
  "confidence": number,
  "query_period": "today" | "this_week" | "this_month" | "last_month" | null,
  "query_category": string | null
}

Rules:
- "undo", "delete last", "cancel" → intent "undo"
- "how much", "total", "show", "what did we spend/earn" → intent "query"
- Amounts: "5 million" = 5000000, "300 ming" = 300000, "1.2 mln" = 1200000
- "received", "got", "income", "payment in" → type "income"
- "paid", "spent", "expense", "cost" → type "expense"
- No explicit type and no clear signal → type "expense" (logistics default)
- No date mentioned → date "today"
- Currency: "$100", "100$", "100 USD", "100 usd" → currency "USD"; everything else → currency "UZS"
- confidence: 0.0–1.0 based on message clarity`;

export async function parse(text) {
  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: SYSTEM,
      messages: [{ role: 'user', content: text }],
    });

    const raw = msg.content[0].text.trim()
      .replace(/^```json?\s*/i, '')
      .replace(/```$/, '')
      .trim();

    return JSON.parse(raw);
  } catch (err) {
    console.error('parse error:', err.message);
    return {
      intent: 'log', type: 'expense', amount: null, currency: 'UZS',
      category: null, date: 'today', note: null, confidence: 0,
    };
  }
}
