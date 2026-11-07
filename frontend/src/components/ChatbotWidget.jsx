import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, X, Send, Sparkles, User, Mic, MicOff, Volume2, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../services/api';

// Helper function to strip Markdown & emojis for clean text-to-speech audio
const cleanTextForSpeech = (text) => {
  if (!text) return '';
  return text
    .replace(/[#*_~`]/g, '') // remove markdown symbols
    .replace(/^[\*\-•]\s+/gm, '') // remove bullet points
    .replace(/^\d+\.\s+/gm, '') // remove numbered list prefixes
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // replace markdown links with label
    // remove emojis so TTS doesn't read out emoji descriptions
    .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
    .trim();
};

// Map i18n language to BCP 47 voice code
const getVoiceLang = (lang) => {
  if (lang === 'mr') return 'mr-IN';
  if (lang === 'hi') return 'hi-IN';
  return 'en-IN';
};

// Pick best matching voice from browser speech synthesis
const getBestVoice = (langCode) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const prefix = langCode.split('-')[0].toLowerCase();
  let matched = voices.find((v) => v.lang && v.lang.toLowerCase() === langCode.toLowerCase());
  if (!matched) {
    matched = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(prefix));
  }
  return matched || null;
};

// Helper function to convert raw Markdown text from Gemini AI into clean HTML elements
const renderFormattedText = (text) => {
  if (!text) return null;

  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    let trimmed = line.trim();

    if (!trimmed) {
      return <div key={lineIdx} style={{ height: '6px' }} />;
    }

    // 1. Handle Markdown Headers (###, ##, #)
    let isHeader = false;
    if (trimmed.startsWith('#')) {
      trimmed = trimmed.replace(/^#+\s*/, '');
      isHeader = true;
    }

    // 2. Handle Horizontal Dividers (---, ***, ___)
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      return <hr key={lineIdx} style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />;
    }

    // 3. Handle Bullet Points (* , - , • )
    let isBullet = false;
    if (/^[\*\-•]\s+/.test(trimmed)) {
      trimmed = trimmed.replace(/^[\*\-•]\s+/, '');
      isBullet = true;
    }

    // 4. Handle Numbered Lists (1. , 2. )
    let numberPrefix = null;
    const numMatch = trimmed.match(/^(\d+\.)\s+/);
    if (numMatch) {
      numberPrefix = numMatch[1];
      trimmed = trimmed.replace(/^(\d+\.)\s+/, '');
    }

    // Parse inline bold (**text**), backticks (`code`), and italics (*text*)
    const parseInline = (str) => {
      str = str.replace(/`/g, '');
      const parts = str.split(/(\*\*[^*]+\*\*)/g);
      return parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.slice(2, -2);
          return <strong key={pIdx} style={{ fontWeight: '700', color: 'inherit' }}>{boldText}</strong>;
        }
        const subParts = part.split(/(\*[^*]+\*)/g);
        return subParts.map((sub, sIdx) => {
          if (sub.startsWith('*') && sub.endsWith('*')) {
            return <em key={sIdx}>{sub.slice(1, -1)}</em>;
          }
          return sub;
        });
      });
    };

    if (isHeader) {
      return (
        <div key={lineIdx} style={{ fontWeight: '800', fontSize: '0.96rem', marginTop: '8px', marginBottom: '4px', color: 'inherit' }}>
          {parseInline(trimmed)}
        </div>
      );
    }

    if (isBullet) {
      return (
        <div key={lineIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginLeft: '4px', margin: '3px 0' }}>
          <span style={{ color: '#0B6B3A', fontWeight: '800', fontSize: '0.8rem', lineHeight: '1.5' }}>•</span>
          <div style={{ flex: 1 }}>{parseInline(trimmed)}</div>
        </div>
      );
    }

    if (numberPrefix) {
      return (
        <div key={lineIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginLeft: '4px', margin: '3px 0' }}>
          <span style={{ fontWeight: '700', color: '#0B6B3A', fontSize: '0.88rem', minWidth: '20px' }}>{numberPrefix}</span>
          <div style={{ flex: 1 }}>{parseInline(trimmed)}</div>
        </div>
      );
    }

    return (
      <div key={lineIdx} style={{ margin: '2px 0' }}>
        {parseInline(trimmed)}
      </div>
    );
  });
};

const ChatbotWidget = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  
  const currentLang = i18n.language || 'en';

  const getGreeting = () => {
    if (currentLang === 'mr') {
      return 'नमस्कार! 🥦 मी ग्रीनी, तुमचा फ्रेशफार्म एआय सहाय्यक आहे. मला इंग्रजी, हिंदी किंवा मराठीमध्ये ताज्या भाज्या, शेती, पेमेंट, डिलिव्हरी किंवा पाककृतींबद्दल काहीही विचारा किंवा बोला!';
    }
    if (currentLang === 'hi') {
      return 'नमस्ते! 🥦 मैं ग्रीनी, आपका फ्रेशफार्म एआई सहायक हूँ। मुझसे अंग्रेजी, हिंदी या मराठी में ताज़ा सब्ज़ियों, खेती, पेमेंट, डिलीवरी या रेसिपी के बारे में कुछ भी पूछें या बोलें!';
    }
    return 'Namaste! 🥦 I am Greeny, your FreshFarm AI Assistant. Ask me anything about fresh vegetables, farming, prices, recipes, delivery tracking, or payments in English, Hindi, or Marathi by typing or speaking!';
  };

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: getGreeting()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // ── Voice Support State ──
  const [isListening, setIsListening] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const recognitionRef = useRef(null);

  const isSpeechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const isTtsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Preload browser TTS voices
  useEffect(() => {
    if (isTtsSupported) {
      const loadVoices = () => {
        window.speechSynthesis.getVoices();
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [isTtsSupported]);

  // Stop any active TTS audio
  const stopSpeech = useCallback(() => {
    if (isTtsSupported) {
      window.speechSynthesis.cancel();
    }
    setSpeakingIdx(null);
  }, [isTtsSupported]);

  // Stop listening helper
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  }, []);

  // Cleanup audio & mic when closing chat or unmounting
  useEffect(() => {
    if (!isOpen) {
      stopSpeech();
      stopListening();
    }
  }, [isOpen, stopSpeech, stopListening]);

  useEffect(() => {
    return () => {
      stopSpeech();
      stopListening();
    };
  }, [stopSpeech, stopListening]);

  // Update greeting when language changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].sender === 'bot') {
        return [{ sender: 'bot', text: getGreeting() }];
      }
      return prev;
    });
  }, [i18n.language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    // Stop speaking old audio when user sends a new message
    stopSpeech();

    const userMsg = { sender: 'user', text: query };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await API.post('/chatbot/ask', {
        message: query
      });

      const replyText = res.data.reply || res.data.text;
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: replyText }
      ]);
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: currentLang === 'mr' ? 'क्षमस्व, ग्रीन एआय सध्या कनेक्ट होऊ शकत नाही.' : currentLang === 'hi' ? 'क्षमा करें, ग्रीनी एआई अभी कनेक्ट नहीं हो पा रहा है।' : 'Sorry, Greeny AI is having trouble connecting right now. Please try again!' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Play / Replay or Stop TTS audio for a specific bot response
  const speakMessage = useCallback((text, idx) => {
    if (!isTtsSupported) return;

    // If already speaking this message, toggle stop
    if (speakingIdx === idx) {
      stopSpeech();
      return;
    }

    // Stop any currently playing audio
    stopSpeech();

    const cleaned = cleanTextForSpeech(text);
    if (!cleaned) return;

    const utterance = new SpeechSynthesisUtterance(cleaned);
    const langCode = getVoiceLang(currentLang);
    utterance.lang = langCode;

    const voice = getBestVoice(langCode);
    if (voice) {
      utterance.voice = voice;
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setSpeakingIdx(null);
    };
    utterance.onerror = () => {
      setSpeakingIdx(null);
    };

    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
  }, [currentLang, speakingIdx, stopSpeech, isTtsSupported]);

  // Speech-to-Text Microphone Handler
  const startListening = () => {
    if (!isSpeechSupported) {
      alert(
        currentLang === 'mr'
          ? 'तुमचा ब्राउझर व्हॉइस इनपुटला सपोर्ट करत नाही. कृपया Google Chrome वापरा.'
          : currentLang === 'hi'
          ? 'आपका ब्राउज़र वॉयस इनपुट का समर्थन नहीं करता है। कृपया Google Chrome का उपयोग करें।'
          : 'Your browser does not support voice input. Please use Google Chrome.'
      );
      return;
    }

    // Stop any ongoing TTS audio so mic doesn't capture speaker output
    stopSpeech();

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = getVoiceLang(currentLang);
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((r) => r[0].transcript)
          .join('');
        setInput(transcript);

        if (event.results[0] && event.results[0].isFinal) {
          setIsListening(false);
          if (transcript.trim()) {
            handleSend(transcript.trim());
          }
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition notice:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  const getQuickPrompts = () => {
    if (currentLang === 'mr') {
      return [
        "आज कोणत्या भाज्या उपलब्ध आहेत?",
        "भाजीपाल्याची ताजी डिलिव्हरी कशी ट्रॅक करावी?",
        "ऑर्डरचे पेमेंट कसे करावे?",
        "शेतकरी म्हणून नोंदणी कशी करावी?"
      ];
    }
    if (currentLang === 'hi') {
      return [
        "आज कौन सी सब्जियां उपलब्ध हैं?",
        "सब्जियों की डिलीवरी कैसे ट्रैक करें?",
        "ऑर्डर के लिए पेमेंट कैसे करें?",
        "किसान के रूप में पंजीकरण कैसे करें?"
      ];
    }
    return [
      "What vegetables are available today?",
      "How to track my order delivery?",
      "How to make online payment?",
      "How to register as a farmer?"
    ];
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
      {/* Responsive Enlarged Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              width: '420px',
              maxWidth: 'calc(100vw - 32px)',
              height: '620px',
              maxHeight: 'calc(100vh - 100px)',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              boxShadow: '0 20px 50px rgba(11, 107, 58, 0.22), 0 4px 16px rgba(0, 0, 0, 0.08)',
              border: '1px solid #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              marginBottom: '16px'
            }}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #0B6B3A, #16A34A)',
              color: 'white',
              padding: '18px 22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(8px)',
                  padding: '10px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <Bot size={24} color="white" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', fontFamily: 'Poppins', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '-0.3px' }}>
                    Greeny AI <Sparkles size={16} color="#facc15" />
                  </h4>
                  <span style={{ fontSize: '0.78rem', opacity: 0.92, fontWeight: '500' }}>
                    {t('chatbot.title') || 'Voice & Text Assistant (EN • HI • MR)'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Message Scroll Area */}
            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '88%'
                  }}
                >
                  {msg.sender === 'bot' && (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#0B6B3A',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                      boxShadow: '0 2px 6px rgba(11, 107, 58, 0.2)'
                    }}>
                      <Bot size={18} />
                    </div>
                  )}

                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '18px',
                    fontSize: '0.92rem',
                    lineHeight: '1.55',
                    backgroundColor: msg.sender === 'user' ? '#0B6B3A' : '#ffffff',
                    color: msg.sender === 'user' ? '#ffffff' : '#0f172a',
                    boxShadow: msg.sender === 'bot' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                    border: msg.sender === 'bot' ? '1px solid #e2e8f0' : 'none',
                    borderTopLeftRadius: msg.sender === 'bot' ? '4px' : '18px',
                    borderTopRightRadius: msg.sender === 'user' ? '4px' : '18px',
                    wordBreak: 'break-word',
                    position: 'relative'
                  }}>
                    {renderFormattedText(msg.text)}

                    {/* Speaker Button on Bot Responses */}
                    {msg.sender === 'bot' && isTtsSupported && (
                      <div style={{
                        marginTop: '8px',
                        paddingTop: '6px',
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end'
                      }}>
                        <button
                          type="button"
                          onClick={() => speakMessage(msg.text, idx)}
                          title={
                            speakingIdx === idx
                              ? (currentLang === 'mr' ? 'आवाज थांबवा' : currentLang === 'hi' ? 'आवाज रोकें' : 'Stop Audio')
                              : (currentLang === 'mr' ? 'ऐका / पुन्हा ऐका' : currentLang === 'hi' ? 'सुनें / पुनः सुनें' : 'Listen / Replay Audio')
                          }
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 9px',
                            borderRadius: '12px',
                            border: '1px solid',
                            borderColor: speakingIdx === idx ? '#0B6B3A' : '#cbd5e1',
                            backgroundColor: speakingIdx === idx ? '#dcfce7' : '#f8fafc',
                            color: speakingIdx === idx ? '#0B6B3A' : '#64748b',
                            fontSize: '0.74rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {speakingIdx === idx ? (
                            <>
                              <Square size={12} fill="#0B6B3A" />
                              <span>{currentLang === 'mr' ? 'थांबवा' : currentLang === 'hi' ? 'रोकें' : 'Stop Audio'}</span>
                            </>
                          ) : (
                            <>
                              <Volume2 size={13} />
                              <span>{currentLang === 'mr' ? 'ऐका' : currentLang === 'hi' ? 'सुनें' : 'Listen'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {msg.sender === 'user' && (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#ff9800',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      <User size={18} />
                    </div>
                  )}
                </div>
              ))}

              {/* Animated Typing Indicator */}
              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '88%' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#0B6B3A',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Bot size={18} />
                  </div>
                  <div style={{
                    padding: '12px 18px',
                    borderRadius: '18px',
                    borderTopLeftRadius: '4px',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0'
                  }}>
                    <span style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: '600', fontStyle: 'italic' }}>
                      {currentLang === 'mr' ? 'ग्रीन एआय टाइप करत आहे...' : currentLang === 'hi' ? 'ग्रीनी एआई टाइप कर रहा है...' : 'Greeny AI is typing...'}
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Listening Banner when microphone is active */}
            {isListening && (
              <div style={{
                background: '#fef2f2',
                borderTop: '1px solid #fecaca',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#dc2626',
                fontSize: '0.82rem',
                fontWeight: '600'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#dc2626',
                    display: 'inline-block',
                    boxShadow: '0 0 8px #dc2626'
                  }} />
                  <span>
                    {currentLang === 'mr'
                      ? 'मी ऐकत आहे... कृपया बोला...'
                      : currentLang === 'hi'
                      ? 'सुन रहा हूँ... कृपया बोलिए...'
                      : 'Listening... speak your question now...'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={stopListening}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc2626',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    textDecoration: 'underline'
                  }}
                >
                  {currentLang === 'mr' ? 'थांबवा' : currentLang === 'hi' ? 'रोकें' : 'Stop'}
                </button>
              </div>
            )}

            {/* Quick Prompts Bar */}
            <div style={{
              padding: '10px 14px',
              background: '#ffffff',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              scrollbarWidth: 'none'
            }}>
              {getQuickPrompts().map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  style={{
                    whiteSpace: 'nowrap',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    padding: '6px 14px',
                    borderRadius: '16px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#334155',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Container */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                background: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                gap: '8px'
              }}
            >
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                background: '#f1f5f9',
                borderRadius: '26px',
                padding: '4px 6px 4px 18px',
                minHeight: '48px',
                border: isListening ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                transition: 'border 0.2s ease'
              }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isListening
                      ? (currentLang === 'mr' ? 'बोलणे चालू आहे...' : currentLang === 'hi' ? 'बोल रहे हैं...' : 'Listening...')
                      : (t('chatbot.placeholder') || 'Ask in EN, HI, MR...')
                  }
                  disabled={loading}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.95rem',
                    color: '#0f172a',
                    background: 'transparent',
                    fontFamily: 'inherit'
                  }}
                />

                {/* Microphone Button */}
                {isSpeechSupported && (
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    disabled={loading}
                    title={
                      isListening
                        ? (currentLang === 'mr' ? 'बोलणे थांबवा' : currentLang === 'hi' ? 'बोलना बंद करें' : 'Stop listening')
                        : (currentLang === 'mr' ? 'माईक चालू करा (मराठी/हिंदी/इंग्रजी)' : currentLang === 'hi' ? 'माइक चालू करें (हिंदी/मराठी/अंग्रेजी)' : 'Speak in English, Hindi, or Marathi')
                    }
                    style={{
                      background: isListening ? '#ef4444' : '#ffffff',
                      color: isListening ? '#ffffff' : '#0B6B3A',
                      border: isListening ? 'none' : '1px solid #cbd5e1',
                      borderRadius: '50%',
                      width: '38px',
                      height: '38px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: loading ? 'default' : 'pointer',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                      marginRight: '4px',
                      boxShadow: isListening ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none'
                    }}
                  >
                    {isListening ? <MicOff size={17} /> : <Mic size={17} />}
                  </button>
                )}

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  style={{
                    background: input.trim() ? '#0B6B3A' : '#cbd5e1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: input.trim() ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                >
                  <Send size={17} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Launcher Button */}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0B6B3A, #ff9800)',
          color: 'white',
          border: 'none',
          boxShadow: '0 10px 28px rgba(11, 107, 58, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          float: 'right'
        }}
      >
        {isOpen ? <X size={30} /> : <Bot size={32} />}
      </motion.button>
    </div>
  );
};

export default ChatbotWidget;
