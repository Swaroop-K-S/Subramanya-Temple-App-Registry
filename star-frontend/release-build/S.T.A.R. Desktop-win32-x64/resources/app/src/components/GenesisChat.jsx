import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, MessageSquare, ChevronRight, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

const GenesisChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'system', content: "Namaste. I am Daiva-Setu. How may I assist you with the Temple Registry today?" }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const audioRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/genesis/invoke`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ query: userMsg.content })
            });

            const data = await response.json();

            // Artificial delay for "Thinking" feel if response is too fast
            await new Promise(r => setTimeout(r, 600));

            const botMsg = {
                role: 'assistant',
                content: data.answer,
                actions: data.suggested_actions
            };
            setMessages(prev => [...prev, botMsg]);

            // Play subtle chime sound (optional, if we had assets)

        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I seem to have lost connection to the spiritual plane (Server Error). Please try again."
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <>
            {/* 1. THE DIVINE SPARK (Floating Orb) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    fixed bottom-6 right-6 z-[60] 
                    w-14 h-14 rounded-full 
                    bg-gradient-to-br from-amber-400 to-orange-600 
                    shadow-[0_0_30px_rgba(245,158,11,0.4)] 
                    flex items-center justify-center 
                    text-white transition-all duration-500 hover:scale-110 
                    ${isOpen ? 'rotate-90 scale-0 opacity-0' : 'scale-100 opacity-100 animate-pulse-slow'}
                `}
            >
                <Sparkles size={24} className="animate-[spin_4s_linear_infinite]" />
            </button>

            {/* 2. THE GLASS SCROLL (Chat Interface) */}
            <div className={`
                fixed bottom-6 right-6 z-[60] 
                w-[90vw] md:w-96 h-[600px] max-h-[80vh]
                bg-slate-900/95 backdrop-blur-3xl 
                border border-amber-500/30 rounded-[2rem] shadow-2xl 
                flex flex-col overflow-hidden 
                transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) origin-bottom-right
                ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}
            `}>

                {/* Header */}
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-amber-900/20 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <Sparkles size={16} className="text-amber-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm tracking-wide">Daiva-Setu</h3>
                            <p className="text-[10px] text-amber-200/60 uppercase tracking-widest">Genesis AI Protocol</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Chat Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-amber-900/50 scrollbar-track-transparent">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`
                                max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed
                                ${msg.role === 'user'
                                    ? 'bg-amber-600 text-white rounded-br-none shadow-lg'
                                    : 'bg-white/5 border border-white/10 text-slate-200 rounded-bl-none'}
                            `}>
                                <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-amber-400 font-bold">$1</strong>') }} />

                                {/* Suggested Actions */}
                                {msg.actions && msg.actions.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {msg.actions.map((act, i) => (
                                            <button
                                                key={i}
                                                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-300 text-xs font-bold transition-all flex items-center gap-1 group"
                                            >
                                                {act.label} <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-bl-none flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce" />
                                <span className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce delay-75" />
                                <span className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce delay-150" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-black/20 border-t border-white/10">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask about Sevas, Panchangam..."
                            className="w-full bg-slate-800/50 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder-slate-500"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="absolute right-2 top-2 p-1.5 bg-amber-500 rounded-lg text-white disabled:opacity-50 disabled:bg-slate-700 transition-all hover:scale-105"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default GenesisChat;
