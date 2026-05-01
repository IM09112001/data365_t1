import 'dotenv/config';
import { parse } from './parser.js';

const cases = [
  'Fuel 300,000 today',
  'Paid 120,000 for toll',
  'Customs 1,200,000 yesterday',
  'Received payment 5 million',
  'How much did we spend this month?',
  'Total fuel this week?',
  'undo',
  '50,000 received today',       // ambiguous — should ask category
];

for (const msg of cases) {
  const result = await parse(msg);
  console.log(`\nInput:  "${msg}"`);
  console.log('Result:', JSON.stringify(result, null, 2));
}
