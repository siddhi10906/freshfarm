const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/db');

const SYSTEM_INSTRUCTION = `
You are "Greeny", the official AI Assistant for FreshFarm - Online Vegetable Marketplace & Delivery System.
FreshFarm connects local farmers in Maharashtra directly with urban customers, offering fresh, chemical-free vegetables.

Your role & knowledge:
1. FreshFarm Features: Direct farmer-to-customer buying, live inventory, cash on delivery, UPI/Card payments, PDF invoice generation, real-time delivery tracking timeline.
2. Vegetable Knowledge: Freshness tips, nutritional benefits, vegetable recipes, seasonal vegetable suggestions in Maharashtra/India, organic farming practices, storing vegetables.
3. User Support: Guide customers on how to search vegetables, add to cart, checkout, download bills, and track orders. Guide farmers on listing vegetables, editing stock, and viewing earnings.
4. Language Support: Detect the user's language (English, Hindi, or Marathi) and reply in the EXACT SAME LANGUAGE and script!
`;

// Helper to query live MySQL database for fresh vegetable & order info
async function getLiveDatabaseContext(message) {
    const lower = message.toLowerCase();
    try {
        if (lower.includes('vegetable') || lower.includes('available') || lower.includes('stock') || lower.includes('price') || lower.includes('भाजी') || lower.includes('सब्जी') || lower.includes('list') || lower.includes('buy')) {
            const [rows] = await db.execute('SELECT vegetable_name, category, price, quantity FROM vegetables LIMIT 10');
            if (rows.length > 0) {
                return "Current Available Vegetables:\n" + rows.map(r => `• ${r.vegetable_name} (${r.category}): ₹${r.price}/kg (Stock: ${r.quantity}kg)`).join('\n');
            }
        }
        if (lower.includes('order') || lower.includes('track') || lower.includes('delivery') || lower.includes('ट्रॅक') || lower.includes('ट्रैक')) {
            return "Order Tracking Information:\nYou can view live real-time status of your vegetable order in your Customer Dashboard under 'My Orders'. Status timeline: Order Placed -> Packed -> Shipped -> Out for Delivery -> Delivered.";
        }
    } catch (e) {
        console.error('DB Context fetch error:', e.message);
    }
    return null;
}

// Comprehensive intelligent fallback knowledge engine for Marathi, Hindi & English
function getSmartKnowledgeReply(query, dbContext) {
    const q = query.toLowerCase();

    // 1. Marathi Queries
    if (/[\u0900-\u097F]/.test(query) && (q.includes('भाजी') || q.includes('उपलब्ध') || q.includes('दर') || q.includes('किंमत'))) {
        let reply = "नमस्कार! 🥦 FreshFarm वर उपलब्ध ताजी भाजीपाल्याची यादी आणि दर खालीलप्रमाणे आहेत:\n\n";
        if (dbContext) {
            reply += dbContext;
        } else {
            reply += "• टोमॅटो (Tomatoes): ₹40/kg\n• पालक (Spinach): ₹25/bunch\n• बटाटे (Potatoes): ₹30/kg\n• शिमला मिरची (Capsicum): ₹60/kg\n• कांदे (Onions): ₹35/kg\n• गाजर (Carrots): ₹50/kg";
        }
        reply += "\n\nआपण आपल्या पसंतीची भाजी कार्टमध्ये जोडून COD किंवा UPI द्वारे ऑर्डर करू शकता!";
        return reply;
    }

    if (/[\u0900-\u097F]/.test(query) && (q.includes('ट्रॅक') || q.includes('डिलिव्हरी') || q.includes('ऑर्डर'))) {
        return "तुम्ही तुमच्या FreshFarm ऑर्डरची स्थिती तुमच्या कस्टमर डॅशबोर्डवरील 'My Orders' विभागात पाहू शकता.\n\nडिलिव्हरी टप्पे:\n1. Order Placed (ऑर्डर नोंदवली)\n2. Packed (पॅक झाली)\n3. Shipped (रवाना झाली)\n4. Out for Delivery (डिलिव्हरीसाठी निघाली)\n5. Delivered (मिळाली)";
    }

    // 2. Hindi Queries
    if (/[\u0900-\u097F]/.test(query) && (q.includes('सब्जी') || q.includes('दाम') || q.includes('कीमत') || q.includes('पेमेंट'))) {
        let reply = "नमस्ते! 🥦 FreshFarm पर आज उपलब्ध ताज़ा सब्ज़ियों की सूची:\n\n";
        if (dbContext) {
            reply += dbContext;
        } else {
            reply += "• टमाटर (Tomatoes): ₹40/kg\n• पालक (Spinach): ₹25/बंच\n• आलू (Potatoes): ₹30/kg\n• शिमला मिर्च (Capsicum): ₹60/kg\n• प्याज (Onions): ₹35/kg\n• गाजर (Carrots): ₹50/kg";
        }
        reply += "\n\nआप कैश ऑन डिलीवरी (COD) या UPI (Razorpay) द्वारा आर्डर कर सकते हैं!";
        return reply;
    }

    // 3. English Queries
    if (q.includes('recipe') || q.includes('cook') || q.includes('dish') || q.includes('soup') || q.includes('paneer') || q.includes('curry')) {
        if (q.includes('soup') || q.includes('tomato')) {
            return "🍅 Easy Fresh Tomato Soup Recipe:\n1. Chop 500g fresh farm tomatoes, 1 onion, and 2 garlic cloves.\n2. Sauté garlic & onion in butter for 2 mins.\n3. Add chopped tomatoes, 1 cup water, salt & pepper. Simmer for 15 mins.\n4. Blend smoothly and strain. Serve hot with fresh cream & croutons!";
        }
        if (q.includes('palak') || q.includes('spinach')) {
            return "🥬 Healthy Palak Paneer Recipe:\n1. Blanch fresh organic spinach leaves in boiling water for 2 mins and puree with green chilies.\n2. Sauté cumin seeds, onions, ginger-garlic paste, and spices in ghee.\n3. Add spinach puree and simmer for 5 mins.\n4. Stir in fresh paneer cubes and 2 tbsp cream. Enjoy with hot roti!";
        }
        return "🥦 Fresh Organic Cooking Tip:\nFor maximum nutrition, cook fresh vegetables on medium heat with minimal water. Fresh organic produce from FreshFarm retains natural flavors and vitamins best when lightly sautéed!";
    }

    if (q.includes('farmer') || q.includes('register') || q.includes('sell')) {
        return "🚜 How to Register as a Farmer on FreshFarm:\n1. Click 'Login / Register' on the navbar.\n2. Choose 'Farmer Portal Login/Register'.\n3. Enter your Name, Mobile Number, Village/Location, and Password.\n4. After login, access your Farmer Dashboard to add fresh produce, set prices per kg, and view incoming customer orders!";
    }

    if (q.includes('payment') || q.includes('pay') || q.includes('upi') || q.includes('cod')) {
        return "💳 FreshFarm Supported Payment Methods:\n• Cash on Delivery (COD) — Pay directly to delivery executive.\n• Razorpay UPI & QR Code — Pay instantly via Google Pay, PhonePe, Paytm, BHIM, or Netbanking.\n• Credit/Debit Cards & Netbanking.";
    }

    if (dbContext) {
        return `Hello! 🥦 Here is what I found for your request:\n\n${dbContext}\n\nYou can easily add any item to your cart and checkout directly from the homepage!`;
    }

    return `Hello! 🥦 I am Greeny, your FreshFarm AI Assistant.

Here is how I can help you:
• 🛒 **Available Produce & Prices**: Ask "What vegetables are available today?"
• 🚚 **Order Tracking**: Ask "How to track my delivery status?"
• 💳 **Payments & Invoice**: Ask about COD, UPI payments, or PDF invoices.
• 🚜 **Farmer Portal**: Ask "How to register as a farmer?"
• 👨‍🍳 **Recipes & Cooking**: Ask "Share a recipe for Tomato Soup or Palak Paneer!"`;
}

exports.handleChatMessage = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ reply: 'Please enter a valid message or question.' });
        }

        const query = message.trim();

        // 1. Fetch live DB context if relevant
        const dbContext = await getLiveDatabaseContext(query);

        // 2. Check if user provided a valid Gemini API Key
        const rawApiKey = (process.env.GEMINI_API_KEY || '').trim();

        if (rawApiKey && rawApiKey !== 'YOUR_GEMINI_API_KEY_HERE' && rawApiKey.length > 10) {
            const modelsToTry = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-pro'];
            const genAI = new GoogleGenerativeAI(rawApiKey);

            const formattedHistory = [];
            if (history && Array.isArray(history)) {
                history.forEach(item => {
                    if (item.sender === 'user') {
                        formattedHistory.push({ role: 'user', parts: [{ text: item.text }] });
                    } else if (item.sender === 'bot') {
                        formattedHistory.push({ role: 'model', parts: [{ text: item.text }] });
                    }
                });
            }

            // Ensure history starts with 'user' role for Google Generative AI SDK
            while (formattedHistory.length > 0 && formattedHistory[0].role !== 'user') {
                formattedHistory.shift();
            }

            for (const modelName of modelsToTry) {
                try {
                    const model = genAI.getGenerativeModel({
                        model: modelName,
                        systemInstruction: SYSTEM_INSTRUCTION + (dbContext ? `\n\n[LIVE DATABASE INFO]:\n${dbContext}` : '')
                    });

                    const chat = model.startChat({ history: formattedHistory });
                    const result = await chat.sendMessage(query);
                    const response = await result.response;
                    const replyText = response.text();

                    if (replyText && replyText.trim()) {
                        console.log(`Successfully generated response using live Gemini AI model (${modelName})`);
                        return res.status(200).json({ reply: replyText });
                    }
                } catch (geminiErr) {
                    console.error(`Gemini model ${modelName} error:`, geminiErr.message);
                }
            }
        }

        // 3. Smart Domain Knowledge Engine (Multi-Lingual: Marathi, Hindi, English)
        const smartReply = getSmartKnowledgeReply(query, dbContext);
        return res.status(200).json({ reply: smartReply });

    } catch (err) {
        console.error('Chatbot Controller Error:', err.message || err);
        res.status(500).json({
            reply: 'Sorry, I encountered an issue answering your question. Please try asking again!'
        });
    }
};


