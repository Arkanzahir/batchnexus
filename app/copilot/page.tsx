"use client";
import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { DefaultChatTransport } from "ai";

const chatTransport = new DefaultChatTransport({
    api: "/api/ai/copilot",
});

export default function CopilotPage() {
    const [input, setInput] = useState("");
    const { messages, sendMessage, status } = useChat({
        transport: chatTransport,
    });
    const isLoading = status === "submitted" || status === "streaming";

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;
        sendMessage({ text: input });
        setInput("");
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)]">
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl border border-outline-variant shadow-sm flex items-center justify-between mb-8">
                <div className="flex items-center gap-4 text-primary">
                    <span className="material-symbols-outlined text-3xl">smart_toy</span>
                    <div>
                        <h2 className="font-bold text-xl text-on-surface">Ops Copilot</h2>
                        <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Intelligent Factory Assistant</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors"><span className="material-symbols-outlined">history</span></button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-8 pb-8 px-4 scroll-smooth hide-scrollbar">
                <div className="max-w-4xl mx-auto flex flex-col gap-8">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-48 text-on-surface-variant">
                            <span className="material-symbols-outlined text-4xl mb-4">forum</span>
                            <p>Ask Copilot about any Lot or Factory operations.</p>
                        </div>
                    )}
                    
                    {messages.map((m) => (
                        <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} gap-2`}>
                            {m.role === 'assistant' && (
                                <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest ml-1">
                                    <span className="material-symbols-outlined icon-fill text-sm">smart_toy</span> Copilot Response
                                </div>
                            )}
                            
                            <div className={`${
                                m.role === 'user' 
                                    ? 'bg-primary text-on-primary px-6 py-3 rounded-t-xl rounded-bl-xl shadow-sm' 
                                    : 'bg-white border border-outline-variant px-8 py-6 rounded-t-xl rounded-br-xl shadow-md w-full max-w-2xl'
                            } text-sm leading-relaxed whitespace-pre-wrap`}>
                                {m.parts.map((part, idx) => {
                                    if (part.type === "text") {
                                        return <span key={idx}>{part.text}</span>;
                                    }
                                    if (part.type === "reasoning") {
                                        return (
                                            <div key={idx} className="text-xs text-outline italic mb-2 border-l-2 border-outline/30 pl-2">
                                                {part.text}
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                            
                            {m.role === 'assistant' && (
                                <div className="flex gap-4 pl-1 mt-2">
                                    <button className="text-outline hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">thumb_up</span> Helpful</button>
                                    <button className="text-outline hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">thumb_down</span> Not Helpful</button>
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {isLoading && (
                         <div className="flex flex-col items-start gap-2">
                             <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest ml-1">
                                 <span className="material-symbols-outlined icon-fill text-sm">smart_toy</span> Thinking...
                             </div>
                             <div className="bg-white border border-outline-variant px-8 py-6 rounded-t-xl rounded-br-xl shadow-md w-full max-w-2xl text-on-surface-variant">
                                 <span className="material-symbols-outlined animate-spin">sync</span>
                             </div>
                         </div>
                    )}
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-lg mt-auto">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-4">
                    <div className="flex-1 relative">
                        <input 
                            className="w-full bg-surface-container-low border-b-2 border-primary border-x-0 border-t-0 py-4 pl-4 pr-12 focus:ring-0 text-sm font-bold placeholder:text-outline/50" 
                            placeholder="Ask about a lot, material, QC status..." 
                            type="text"
                            value={input}
                            onChange={handleInputChange}
                            disabled={isLoading}
                        />
                        <button 
                            type="submit"
                            disabled={isLoading || !input}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-on-primary flex items-center justify-center rounded-sm shadow-sm hover:opacity-90 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined">send</span>
                        </button>
                    </div>
                </form>
                <div className="mt-4 flex justify-center gap-6 text-[10px] font-bold text-outline uppercase tracking-widest">
                    <button className="hover:text-primary" onClick={() => setInput("Where is LOT-2026-049?")}>Find LOT-2026-049</button>
                    <span>•</span>
                    <button className="hover:text-primary" onClick={() => setInput("What is the daily summary?")}>Daily Summary</button>
                </div>
            </div>
        </div>
    );
}
