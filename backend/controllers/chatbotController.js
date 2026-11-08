const { GoogleGenAI } = require('@google/genai');
const db = require('../config/db');

const SYSTEM_INSTRUCTION = `You are Greeny AI, the helpful assistant for FreshFarm, a farm-to-home produce marketplace in Maharashtra, India.

Answer the user's actual question directly and helpfully. You may answer general knowledge, education, cooking, farming, technology, and FreshFarm questions. Do not restrict answers to FreshFarm topics.
Reply in the same language as the user's latest message. Support English, Hindi, and Marathi, preserving the appropriate script.
Use the supplied live marketplace information only for current products, prices, and stock. Never invent live prices, order details, or account data. If asked for private order information, direct the customer to My Orders in their account.
Keep answers clear and reasonably concise. If you do not know something, say so instead of guessing.`;

async function getLiveDatabaseContext(message) {
  const asksAboutProducts = /vegetable|fruit|produce|available|stock|price|cost|item|product|सब्ज|फल|उपलब्ध|दाम|कीमत|भाव|साठा|भाजी|किंमत|दर/i.test(message);
  if (!asksAboutProducts) return '';

  try {
    const [rows] = await db.execute(
      'SELECT vegetable_name, category, price, quantity, sold_by FROM vegetables ORDER BY vegetable_name LIMIT 20'
    );
    if (!rows.length) return 'There are currently no product rows in the live catalog.';

    return rows.map((row) => {
      const unit = row.sold_by === 'piece' ? 'piece' : row.sold_by === 'dozen' ? 'dozen' : 'kg';
      return `${row.vegetable_name} (${row.category}): ₹${row.price}/${unit}; stock ${row.quantity} ${unit}`;
    }).join('\n');
  } catch (error) {
    console.error('Chatbot product context query failed:', error.message);
    return '';
  }
}

function cleanHistory(history, currentMessage) {
  if (!Array.isArray(history)) return [];

  const turns = history
    .filter((item) => item && (item.sender === 'user' || item.sender === 'bot') && typeof item.text === 'string')
    .map((item) => ({
      role: item.sender === 'user' ? 'user' : 'model',
      parts: [{ text: item.text.trim().slice(0, 4000) }]
    }))
    .filter((item) => item.parts[0].text)
    .slice(-12);

  // Gemini chat history must begin with a user turn. The widget's opening greeting is a model turn.
  while (turns.length && turns[0].role !== 'user') turns.shift();

  // Avoid sending malformed history if the client has stale/duplicated messages.
  const normalized = [];
  for (const turn of turns) {
    if (normalized.length && normalized[normalized.length - 1].role === turn.role) {
      normalized[normalized.length - 1] = turn;
    } else {
      normalized.push(turn);
    }
  }

  // The client sends only previous turns; append the current question here.
  if (normalized.length && normalized[normalized.length - 1].role === 'user') {
    normalized.pop();
  }
  normalized.push({ role: 'user', parts: [{ text: currentMessage }] });
  return normalized;
}

exports.askGreenyAI = async (req, res) => {
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!message) {
    return res.status(400).json({ success: false, reply: 'Please type a question first.' });
  }
  if (message.length > 4000) {
    return res.status(400).json({ success: false, reply: 'Please keep your question under 4,000 characters.' });
  }

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    console.error('Chatbot is unavailable: GEMINI_API_KEY is not configured.');
    return res.status(503).json({
      success: false,
      reply: 'Greeny AI is temporarily unavailable. Please try again later.'
    });
  }

  try {
    const liveContext = await getLiveDatabaseContext(message);
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      // Keep this configurable so the deployed model can be changed without a code edit.
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      contents: cleanHistory(req.body.history, message),
      config: {
        systemInstruction: liveContext
          ? `${SYSTEM_INSTRUCTION}\n\nLive product catalog (use only when relevant):\n${liveContext}`
          : SYSTEM_INSTRUCTION,
        temperature: 0.7,
        maxOutputTokens: 1200
      }
    });

    const reply = response.text?.trim();
    if (!reply) throw new Error('Gemini returned an empty response.');
    return res.json({ success: true, reply });
  } catch (error) {
    // Keep diagnostics useful without logging API keys or customer message contents.
    console.error('Greeny AI request failed:', {
      message: error.message,
      status: error.status || error.statusCode,
      code: error.code
    });
    return res.status(503).json({
      success: false,
      reply: 'Greeny AI could not answer right now. Please try again in a moment.'
    });
  }
};
