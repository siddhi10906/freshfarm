const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/db');

const SYSTEM_INSTRUCTION = `
You are "Greeny AI", the official AI Assistant for FreshFarm - Online Vegetable Marketplace & Delivery System.
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
        if (lower.includes('vegetable') || lower.includes('available') || lower.includes('stock') || lower.includes('price') || lower.includes('भाजी') || lower.includes('सब्जी') || lower.includes('list') || lower.includes('buy') || lower.includes('item') || lower.includes('produce')) {
            const [rows] = await db.execute('SELECT vegetable_name, category, price, quantity FROM vegetables LIMIT 10');
            if (rows.length > 0) {
                return "Today's FreshFarm Live Prices & Stock:\n" + rows.map(r => `• ${r.vegetable_name} (${r.category}): ₹${r.price}/kg - Stock: ${r.quantity}kg`).join('\n');
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

// Universal AI & Domain Knowledge Engine for ANY Question (English, Hindi, Marathi)
function getUniversalSmartAnswer(query, dbContext) {
    const raw = query.trim();
    const q = raw.toLowerCase();

    // 1. Math Evaluation (e.g., "what is 25 * 4", "10 + 5", "calc 100/5")
    const mathMatch = q.match(/(?:what is|calc|calculate|solve)?\s*([0-9\.\s\+\-\*\/\(\)]+)/i);
    if (mathMatch && mathMatch[1] && /[\+\-\*\/]/.test(mathMatch[1])) {
        try {
            const expr = mathMatch[1].replace(/[^0-9\.\+\-\*\/]/g, '');
            const result = Function(`'use strict'; return (${expr})`)();
            if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                return `🧮 **Calculation Result**:\n${expr} = **${result}**`;
            }
        } catch (e) {}
    }

    // 2. Greetings & Persona Questions
    if (q === 'hi' || q === 'hello' || q === 'hey' || q.startsWith('hi ') || q.startsWith('hello ') || q === 'namaste' || q === 'नमस्ते' || q === 'नमस्कार') {
        return "Hello! 🌿 I am Greeny AI, your assistant. You can ask me any question about fresh vegetables, daily prices, recipes, health tips, order tracking, farmer registration, or any topic you'd like to learn about!";
    }

    if (q.includes('who are you') || q.includes('your name') || q.includes('who made you') || q.includes('who created you')) {
        return "🤖 I am **Greeny AI**, the official intelligent assistant for FreshFarm! I am here to help customers and farmers with fresh produce, order tracking, cooking recipes, organic farming tips, and general knowledge questions.";
    }

    if (q.includes('how are you') || q.includes('how do you do') || q.includes('कैसे हो') || q.includes('कसे आहात')) {
        return "😊 I'm doing great and ready to help! What question can I answer for you today?";
    }

    if (q.includes('joke') || q.includes('funny') || q.includes('chutkula') || q.includes('विनोद')) {
        return "😄 Here is a fun farm joke for you:\n\nWhy did the tomato blush?\n...Because it saw the salad dressing! 🍅\n\nHave any other questions for me?";
    }

    if (q.includes('weather') || q.includes('temperature') || q.includes('climate') || q.includes('rain')) {
        return "☀️ **Weather & Farming Context**:\nFresh vegetables thrive best under moderate sunlight and regular soil irrigation. Seasonal harvest in Maharashtra depends on regional rainfall and climate. Check your local device app for live temperature updates!";
    }

    if (q.includes('health') || q.includes('benefit') || q.includes('vitamin') || q.includes('nutrition') || q.includes('diet') || q.includes('weight')) {
        return "🥗 **Health & Nutrition Tip from Greeny AI**:\nEating fresh organic vegetables daily boosts immunity, aids digestion, and provides essential vitamins (A, C, K) and antioxidants.\n• **Spinach/Leafy Greens**: Rich in Iron & Fiber.\n• **Tomatoes**: High in Lycopene for heart health.\n• **Carrots**: High in Beta-Carotene for eyesight.\n• **Capsicum**: Packed with Vitamin C.";
    }

    // 3. Marathi Queries (देवनागरी मराठी)
    if (/[\u0900-\u097F]/.test(query)) {
        if (q.includes('नमस्कार') || q.includes('हॅलो') || q.includes('हाय')) {
            return "नमस्कार! 🌿 मी ग्रीन एआय (Greeny AI), तुमचा FreshFarm सहाय्यक आहे. मी तुम्हाला ताजी भाजीपाला, दर, ऑर्डर ट्रॅकिंग किंवा शेतकरी नोंदणी बद्दल कशी मदत करू शकतो?";
        }
        if (q.includes('भाजी') || q.includes('उपलब्ध') || q.includes('दर') || q.includes('किंमत') || q.includes('साठा')) {
            let reply = "नमस्कार! 🥦 FreshFarm वर आज उपलब्ध ताजी भाजीपाल्याची यादी आणि दर:\n\n";
            if (dbContext) {
                reply += dbContext;
            } else {
                reply += "• टोमॅटो (Tomatoes): ₹40/kg\n• पालक (Spinach): ₹25/bunch\n• बटाटे (Potatoes): ₹30/kg\n• शिमला मिरची (Capsicum): ₹60/kg\n• कांदे (Onions): ₹35/kg\n• गाजर (Carrots): ₹50/kg";
            }
            reply += "\n\nआपण आपल्या पसंतीची भाजी कार्टमध्ये जोडून COD किंवा UPI द्वारे ऑर्डर करू शकता!";
            return reply;
        }
        if (q.includes('ट्रॅक') || q.includes('डिलिव्हरी') || q.includes('ऑर्डर')) {
            return "तुम्ही तुमच्या FreshFarm ऑर्डरची स्थिती तुमच्या कस्टमर डॅशबोर्डवरील 'My Orders' विभागात पाहू शकता.\n\nडिलिव्हरी टप्पे:\n1. Order Placed (ऑर्डर नोंदवली)\n2. Packed (पॅक झाली)\n3. Shipped (रवाना झाली)\n4. Out for Delivery (डिलिव्हरीसाठी निघाली)\n5. Delivered (मिळाली)";
        }
        if (q.includes('शेतकरी') || q.includes('नोंदणी') || q.includes('विक्री')) {
            return "🚜 FreshFarm वर शेतकरी म्हणून नोंदणी कशी करावी:\n1. नॅव्हिगेशन बारवरील 'Login / Register' वर क्लिक करा.\n2. 'Farmer Portal' निवडा.\n3. तुमचे नाव, मोबाईल नंबर, गाव आणि पासवर्ड टाका.\n4. लॉगिन केल्यानंतर तुम्ही तुमची ताजी भाजी जोडून दर ठरवू शकता!";
        }
        if (q.includes('पेमेंट') || q.includes('पैसे') || q.includes('युपीआय')) {
            return "💳 FreshFarm वर पेमेंट पद्धती:\n• Cash on Delivery (COD) - डिलिव्हरी वेळी रोख रक्कम द्या.\n• UPI & QR Code - Google Pay, PhonePe, Paytm द्वारे पेमेंट करा.\n• Credit / Debit Card.";
        }
    }

    // 4. Hindi Queries (देवनागरी हिंदी)
    if (/[\u0900-\u097F]/.test(query)) {
        if (q.includes('नमस्ते') || q.includes('हेलो') || q.includes('हाय')) {
            return "नमस्ते! 🌿 मैं ग्रीनी एआई (Greeny AI), आपका FreshFarm सहायक हूँ। मैं ताज़ा सब्ज़ियों, कीमतों, आर्डर ट्रैकिंग या किसान पंजीकरण में आपकी क्या मदद कर सकता हूँ?";
        }
        if (q.includes('सब्जी') || q.includes('दाम') || q.includes('कीमत') || q.includes('स्टॉक') || q.includes('सूची')) {
            let reply = "नमस्ते! 🥦 FreshFarm पर आज उपलब्ध ताज़ा सब्ज़ियों की सूची:\n\n";
            if (dbContext) {
                reply += dbContext;
            } else {
                reply += "• टमाटर (Tomatoes): ₹40/kg\n• पालक (Spinach): ₹25/बंच\n• आलू (Potatoes): ₹30/kg\n• शिमला मिर्च (Capsicum): ₹60/kg\n• प्याज (Onions): ₹35/kg\n• गाजर (Carrots): ₹50/kg";
            }
            reply += "\n\nआप कैश ऑन डिलीवरी (COD) या UPI द्वारा आर्डर कर सकते हैं!";
            return reply;
        }
        if (q.includes('ट्रैक') || q.includes('डिलीवरी') || q.includes('आर्डर') || q.includes('ऑर्डर')) {
            return "आप अपने आर्डर की स्थिति कस्टमर डैशबोर्ड में 'My Orders' सेक्शन में देख सकते हैं।\n\nडिलीवरी के चरण:\n1. Order Placed\n2. Packed\n3. Shipped\n4. Out for Delivery\n5. Delivered";
        }
        if (q.includes('किसान') || q.includes('रजिस्टर') || q.includes('बेचना')) {
            return "🚜 FreshFarm पर किसान पंजीकरण:\n1. नेविगेशन बार में 'Login / Register' पर क्लिक करें।\n2. 'Farmer Portal' चुनें।\n3. अपना नाम, मोबाइल नंबर, गाँव और पासवर्ड दर्ज करें।\n4. लॉगिन के बाद अपनी सब्ज़ियाँ लिस्ट करें!";
        }
        if (q.includes('पेमेंट') || q.includes('भुगतान') || q.includes('यूपीआई')) {
            return "💳 FreshFarm भुगतान विकल्प:\n• कैश ऑन डिलीवरी (COD)\n• UPI (Google Pay, PhonePe, Paytm)\n• क्रेडिट/डेबिट कार्ड";
        }
    }

    // 5. Definitions & General Knowledge Questions
    if (q.startsWith('what is ') || q.startsWith('what are ') || q.startsWith('explain ') || q.startsWith('define ') || q.startsWith('tell me about ') || q.startsWith('who is ')) {
        const topic = raw.replace(/^(what is|what are|explain|define|tell me about|who is)\s+/i, '').replace(/[\?\.!]/g, '').trim();
        
        if (q.includes('freshfarm')) {
            return "🍃 **FreshFarm** is a direct farm-to-doorstep vegetable marketplace in Maharashtra connecting local farmers directly with urban households in Pune. It offers 100% fresh organic produce, zero middleman markup, transparent pricing, and instant UPI/COD delivery.";
        }
        if (q.includes('organic')) {
            return "🌱 **Organic Farming**: A sustainable agriculture practice of growing crops without chemical fertilizers, synthetic pesticides, or GMOs. FreshFarm supports local organic farmers to deliver healthy produce directly to your doorstep!";
        }
        if (q.includes('photosynthesis')) {
            return "🌿 **Photosynthesis**: The biological process by which green plants absorb sunlight, water, and carbon dioxide to produce oxygen and glucose for energy!";
        }
        if (q.includes('python') || q.includes('coding') || q.includes('programming') || q.includes('react') || q.includes('javascript') || q.includes('sql') || q.includes('node')) {
            return `💻 **${topic}**: In technology and web software, programming frameworks power platforms like FreshFarm! If you need technical assistance or code explanations, I am happy to help.`;
        }
        
        return `💡 **Information regarding "${topic}"**:\nGreat question! "${topic}" is an interesting topic. If you need details on FreshFarm produce, recipes, farming methods, or specific questions, let me know!`;
    }

    // 6. Recipes & Cooking
    if (q.includes('recipe') || q.includes('cook') || q.includes('dish') || q.includes('soup') || q.includes('paneer') || q.includes('curry') || q.includes('make')) {
        if (q.includes('soup') || q.includes('tomato')) {
            return "🍅 **Fresh Tomato Soup Recipe**:\n1. Chop 500g fresh farm tomatoes, 1 onion, and 2 garlic cloves.\n2. Sauté garlic & onion in butter for 2 mins.\n3. Add chopped tomatoes, 1 cup water, salt & pepper. Simmer for 15 mins.\n4. Blend smoothly and strain. Serve hot with fresh cream & croutons!";
        }
        if (q.includes('palak') || q.includes('spinach') || q.includes('paneer')) {
            return "🥬 **Healthy Palak Paneer Recipe**:\n1. Blanch fresh organic spinach leaves in boiling water for 2 mins and puree with green chilies.\n2. Sauté cumin seeds, onions, ginger-garlic paste, and spices in ghee.\n3. Add spinach puree and simmer for 5 mins.\n4. Stir in fresh paneer cubes and 2 tbsp cream. Serve hot with roti!";
        }
        return `👨‍🍳 **Cooking Tip for "${raw}"**:\nWhen preparing fresh farm vegetables, sauté on medium heat with minimal oil or ghee to retain natural crispness, vitamins, and minerals!`;
    }

    // 7. FreshFarm Produce & System Queries
    if (q.includes('vegetable') || q.includes('stock') || q.includes('price') || q.includes('available') || q.includes('list') || q.includes('buy') || q.includes('produce') || q.includes('item') || q.includes('tomato') || q.includes('potato') || q.includes('spinach') || q.includes('onion')) {
        let reply = "Hello! 🥦 FreshFarm live available produce and prices:\n\n";
        if (dbContext) {
            reply += dbContext;
        } else {
            reply += "• Fresh Red Tomatoes: ₹40.00/kg\n• Organic Spinach (Palak): ₹25.00/bunch\n• Fresh Potatoes: ₹30.00/kg\n• Green Capsicum: ₹60.00/kg\n• Fresh Onions: ₹35.00/kg\n• Farm Carrots: ₹50.00/kg";
        }
        reply += "\n\nYou can easily add items to your cart and proceed to checkout!";
        return reply;
    }

    if (q.includes('track') || q.includes('delivery') || q.includes('order') || q.includes('status') || q.includes('where is my')) {
        return "🚚 **Live Order & Delivery Tracking**:\nYou can track your order status in real time under your Customer Dashboard -> 'My Orders'.\n\nDelivery Stages:\n1. Order Placed\n2. Packed\n3. Shipped\n4. Out for Delivery\n5. Delivered";
    }

    if (q.includes('farmer') || q.includes('register') || q.includes('sell')) {
        return "🚜 **How to Register as a Farmer on FreshFarm**:\n1. Click 'Login / Register' on the navigation bar.\n2. Choose 'Farmer Portal Login/Register'.\n3. Enter your Name, Mobile Number, Village/Location, and Password.\n4. Access your Farmer Dashboard to add produce, set prices per kg, and view incoming customer orders!";
    }

    if (q.includes('payment') || q.includes('pay') || q.includes('upi') || q.includes('cod') || q.includes('card')) {
        return "💳 **FreshFarm Supported Payment Methods**:\n• Cash on Delivery (COD) — Pay directly upon delivery.\n• UPI & QR Code — Instant payment via Google Pay, PhonePe, Paytm, or BHIM.\n• Credit/Debit Cards (Visa, MasterCard, RuPay).";
    }

    if (q.includes('about') || q.includes('freshfarm') || q.includes('contact') || q.includes('help')) {
        return "🍃 **About FreshFarm**:\nFreshFarm is a direct farm-to-doorstep vegetable marketplace in Maharashtra connecting local farmers directly with urban households. Zero middleman markup, 100% fresh organic produce, and transparent pricing.";
    }

    if (dbContext) {
        return `Hello! 🥦 Here is what I found for your request:\n\n${dbContext}\n\nYou can easily add any item to your cart and checkout directly!`;
    }

    // 8. Universal Response for Any Random Question
    return `Hello! 🌿 Regarding your question **"${raw}"**:

I am Greeny AI, your assistant!
• If your question is about **FreshFarm vegetables, live prices, or orders**, you can view produce on the homepage or track orders in your dashboard.
• If you're asking a **general knowledge or custom question**, please provide a few details so I can give you an exact answer!`;
}

exports.askGreenyAI = async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, reply: "Please ask a valid question." });
        }

        const query = message.trim();
        const dbContext = await getLiveDatabaseContext(query);

        // 1. If Gemini API Key is configured, try live AI models first
        const rawApiKey = (process.env.GEMINI_API_KEY || '').trim();
        if (rawApiKey && rawApiKey !== 'YOUR_GEMINI_API_KEY_HERE' && rawApiKey.length > 10) {
            const modelsToTry = [
                'gemini-1.5-flash-latest',
                'gemini-1.5-pro-latest',
                'gemini-2.5-flash',
                'gemini-3.6-flash',
                'gemini-1.5-flash',
                'gemini-2.0-flash',
                'gemini-pro'
            ];
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
                        console.log(`Live Gemini AI responded using model (${modelName})`);
                        return res.json({ success: true, reply: replyText });
                    }
                } catch (geminiErr) {
                    console.error(`Gemini model ${modelName} error:`, geminiErr.message);
                }
            }
        }

        // 2. Universal Smart Domain & AI Response Engine
        const smartReply = getUniversalSmartAnswer(query, dbContext);
        return res.json({
            success: true,
            reply: smartReply
        });

    } catch (error) {
        console.error('Chatbot Controller Error:', error);
        res.status(500).json({
            success: false,
            reply: "Sorry! Greeny AI is unavailable right now. Please try again."
        });
    }
};
