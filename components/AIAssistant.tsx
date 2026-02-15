import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, Bot, User, Minimize2, AlertCircle } from 'lucide-react';

// Types needed
interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  time: string;
}

const SYSTEM_INSTRUCTION = `
Siz "Star Store" admin panelining aqlli yordamchisisiz. 
Sizning vazifangiz do'kon administratoriga platformani boshqarishda yordam berishdir.
Javoblarni o'zbek tilida, professional va samimiy ohangda bering.

Platforma tuzilishi va imkoniyatlari haqida ma'lumot:
1. Dashboard: Asosiy ko'rsatkichlar. (Jami savdo: $128,430 +12%, Buyurtmalar: 1,245 -2%, Mijozlar: 45,231 +5%).
2. Mahsulotlar (Products): Yangi tovar qo'shish, tahrirlash. Filtrlar: Kategoriya, Brend, Narx, Ombor holati. Ranglarni qidirish va qo'shish imkoniyati bor.
3. Buyurtmalar (Orders): Buyurtmalar ro'yxati. Statuslar: Yetkazildi, Jarayonda, Bekor qilindi. 
4. Moliya (Finance): Tushum va xarajatlar statistikasi, grafiklar.
5. Mijozlar (Customers): Mijozlar bazasi, ularning xarid tarixi.
6. Marketing (CMS): Bannerlarni o'zgartirish, chegirmalar (kuponlar) yaratish.

Agar foydalanuvchi "muammo" yoki "xatolik" haqida so'rasa, unga tinchlantiruvchi javob bering va tizim barqaror ekanligini ayting.
Foydalanuvchi savoliga qarab, qaysi bo'limga kirish kerakligini maslahat bering.
`;

// Helper to safely get API key without crashing in non-Node environments
const getApiKey = () => {
  try {
    // Check global process first (handled by polyfill in index.html)
    // @ts-ignore
    if (typeof window.process !== 'undefined' && window.process.env && window.process.env.API_KEY) {
       // @ts-ignore
       return window.process.env.API_KEY;
    }
    // Fallback standard check
    if (typeof process !== 'undefined' && process.env) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // Ignore errors
  }
  return undefined;
};

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Assalomu alaykum! Men Star AI yordamchisiman. Do'kon boshqaruvida sizga qanday yordam bera olaman?",
      sender: 'ai',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  // Fallback mock logic if API fails or key is missing
  const generateMockResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('mahsulot')) return "Mahsulotlar bo'limida yangi filtrlash tizimi ishga tushdi. Kategoriya va brend bo'yicha saralashingiz mumkin. Yangi tovar qo'shish uchun yuqoridagi 'Yangi Mahsulot' tugmasini bosing.";
    if (lowerInput.includes('savdo') || lowerInput.includes('pul') || lowerInput.includes('foyda')) return "Moliya bo'limi ma'lumotlariga ko'ra, bugungi savdo ko'rsatkichlari: $128,430. O'sish +12%. Batafsil hisobotlarni Moliya sahifasida ko'rishingiz mumkin.";
    if (lowerInput.includes('buyurtma') || lowerInput.includes('zakaz')) return "Buyurtmalar holatini endi to'g'ridan-to'g'ri jadval ichida o'zgartirish mumkin. Jarayondagi buyurtmalarni 'Yetkazildi' yoki 'Bekor qilindi' statusiga o'tkazishingiz mumkin.";
    if (lowerInput.includes('mijoz')) return "Sizda jami 45,231 ta ro'yxatdan o'tgan mijoz mavjud. Eng faol mijozlarni 'Mijozlar' bo'limida ko'rishingiz mumkin.";
    if (lowerInput.includes('salom') || lowerInput.includes('qalay')) return "Yaxshi rahmat! Tizim barqaror ishlamoqda. Biror bo'lim bo'yicha yordam kerakmi?";
    return "Tushunarli. Bu haqda batafsil ma'lumotni tegishli bo'limdan olishingiz mumkin. Yana qanday yordam bera olaman?";
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    
    // Reset offline status to try again
    const apiKey = getApiKey();
    if (!apiKey) setIsOffline(true);

    try {
      if (apiKey) {
        // Dynamic import to prevent initial load crash
        // @ts-ignore
        const { GoogleGenAI } = await import("@google/genai");
        
        const ai = new GoogleGenAI({ apiKey: apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: userMessage.text,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
          },
        });
        
        const aiText = response.text;
        
        const aiMessage: Message = {
          id: Date.now() + 1,
          text: aiText || "Javob olishda xatolik yuz berdi.",
          sender: 'ai',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsOffline(false);
      } else {
        throw new Error("API Key not found");
      }
      
    } catch (err) {
      console.warn("AI API Error, falling back to mock:", err);
      setIsOffline(true);
      
      // Fallback response with delay
      setTimeout(() => {
        const mockResponse = generateMockResponse(userMessage.text);
        const aiMessage: Message = {
          id: Date.now() + 1,
          text: mockResponse,
          sender: 'ai',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMessage]);
      }, 1000);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      
      {/* Chat Window */}
      <div 
        className={`
          pointer-events-auto
          mb-4 w-[350px] sm:w-[380px] 
          bg-white/80 backdrop-blur-xl border border-white/40
          rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)]
          overflow-hidden transition-all duration-300 ease-in-out origin-bottom-right
          ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-10 pointer-events-none h-0'}
        `}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600/90 to-purple-600/90 backdrop-blur-md p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-1.5 rounded-full">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm">Star AI Assistant</h3>
              <p className="text-[10px] text-indigo-100 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-orange-400' : 'bg-green-400 animate-pulse'}`}></span> 
                {isOffline ? 'Demo Mode' : 'Online (Gemini)'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
              <Minimize2 size={16} />
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="h-80 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-white/30">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex items-end gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center shrink-0
                ${msg.sender === 'ai' ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white' : 'bg-slate-200 text-slate-600'}
              `}>
                {msg.sender === 'ai' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className={`
                max-w-[85%] p-3 rounded-2xl text-sm shadow-sm whitespace-pre-line
                ${msg.sender === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-white text-slate-700 rounded-bl-none border border-white/50'}
              `}>
                {msg.text}
                <div className={`text-[9px] mt-1 opacity-70 text-right ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {msg.time}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-white/50 shadow-sm flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
              </div>
            </div>
          )}
          
          {isOffline && messages.length < 3 && (
             <div className="flex justify-center my-2 animate-in fade-in">
               <span className="text-[10px] text-slate-500 bg-slate-100/80 backdrop-blur-sm px-2 py-1 rounded-full border border-slate-200 flex items-center gap-1">
                 <AlertCircle size={10} /> Oflayn rejim (Mock Data)
               </span>
             </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/60 border-t border-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 border border-indigo-100 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
            <input 
              type="text" 
              placeholder="Savol bering..." 
              className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          pointer-events-auto
          group relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300
          ${isOpen ? 'bg-slate-800 text-white rotate-90' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'}
        `}
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} className="animate-pulse" />}
        
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
        )}
      </button>
    </div>
  );
};

export default AIAssistant;