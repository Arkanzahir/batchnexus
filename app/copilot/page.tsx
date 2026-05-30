"use client";
import { useState } from "react";
import { createItem } from "@/lib/api/client";
import { useRole } from "@/lib/rbac";

interface SourceRecord {
    type: string;
    id: string;
    desc: string;
}

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    sources?: SourceRecord[];
}

export default function CopilotPage() {
    const { role } = useRole();
    const [messages, setMessages] = useState<Message[]>([{
        id: "1",
        role: "assistant",
        content: "Hello! I am Ops Copilot. I can help you query real-time operational records, audit logs, and status updates across the facility."
    }]);
    const [input, setInput] = useState("");
    const [isThinking, setIsThinking] = useState(false);

    const suggestedPrompts = [
        "Where is LOT-2026-051?",
        "Which samples used LOT-2026-051?",
        "What batches are blocked today?",
        "Any cold-chain alerts today?",
        "Is REC-2026-002 ready for production?"
    ];

    const getDeterministicAnswer = (query: string): { content: string, sources: SourceRecord[] } => {
        const q = query.toLowerCase();
        
        if (q.includes("where is lot-2026-051")) {
            return {
                content: "LOT-2026-051 is stored in HAZ-D-04. It contains Citrus Peel Extract from Java Citrus Farm. QC was released on 28 May 2026 at 10:42 WIB and two sample dispatch records are linked to this lot.",
                sources: [
                    { type: "Lot record", id: "LOT-2026-051", desc: "Stored in HAZ-D-04" },
                    { type: "Warehouse move", id: "MOVE-2026-001", desc: "Assigned by Andi Saputra" },
                    { type: "QC inspection", id: "QC-2026-002", desc: "Approved release" },
                    { type: "Dispatch records", id: "DSP-001, DSP-002", desc: "Samples" }
                ]
            };
        }
        
        if (q.includes("which samples used lot-2026-051")) {
            return {
                content: "LOT-2026-051 has been used in two sample dispatches: DSP-001 (Export — Singapore to AromaWell Singapore) and DSP-002 (Local — Jakarta to Nusantara Beverage Lab).",
                sources: [
                    { type: "Dispatch", id: "DSP-001", desc: "AromaWell Singapore" },
                    { type: "Dispatch", id: "DSP-002", desc: "Nusantara Beverage Lab" }
                ]
            };
        }

        if (q.includes("blocked today")) {
            return {
                content: "There are currently 0 blocked batches today. However, there is 1 lot under quarantine (HOLD-QC) awaiting recheck.",
                sources: [
                    { type: "Inventory report", id: "INV-STAT", desc: "Daily Blocked Items" }
                ]
            };
        }

        if (q.includes("cold-chain alerts")) {
            return {
                content: "Yes, there is 1 active cold-chain alert today in zone FRZ-C (Freezer storage). The current temperature reading is -3°C, which is outside the safe threshold of -20°C to -4°C.",
                sources: [
                    { type: "Sensor reading", id: "TEMP-001", desc: "FRZ-C at -3°C" },
                    { type: "Zone policy", id: "FRZ-C", desc: "Target -20°C to -4°C" }
                ]
            };
        }

        if (q.includes("is rec-2026-002 ready")) {
            return {
                content: "Yes, REC-2026-002 has been QC Released and converted into LOT-2026-051. It is currently Stored in HAZ-D-04 and is ready for production scheduling.",
                sources: [
                    { type: "Receipt record", id: "REC-2026-002", desc: "Status: QC Released" },
                    { type: "Lot record", id: "LOT-2026-051", desc: "Status: Stored" }
                ]
            };
        }

        return {
            content: "No matching operational record found. Try a lot number, receipt number, or material name.",
            sources: []
        };
    };

    const handleSend = async (text: string) => {
        if (!text.trim()) return;

        const newMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
        setMessages(prev => [...prev, newMsg]);
        setInput("");
        setIsThinking(true);

        // Record to audit log
        try {
            await createItem("audit_logs", {
                timestamp: new Date().toISOString(),
                actor: "Current User",
                role: role,
                action: "Queried Ops Copilot",
                entity: "Copilot",
                change_detail: `Asked: "${text}"`
            });
        } catch (e) {}

        // Simulate network delay for effect
        setTimeout(() => {
            const answer = getDeterministicAnswer(text);
            const responseMsg: Message = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: answer.content,
                sources: answer.sources
            };
            setMessages(prev => [...prev, responseMsg]);
            setIsThinking(false);
        }, 1000);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto w-full">
            <div className="mb-6">
                <h2 className="font-display font-bold text-3xl text-primary">Ops Copilot</h2>
                <p className="text-on-surface-variant mt-1">AI-assisted natural language queries for manufacturing operations.</p>
            </div>

            <div className="flex-1 bg-white border border-outline-variant rounded-xl shadow-sm flex flex-col overflow-hidden">
                {/* Chat History */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl p-5 ${msg.role === 'user' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface border border-outline-variant'}`}>
                                <div className="flex items-center gap-2 mb-2 opacity-80">
                                    <span className="material-symbols-outlined text-[16px]">
                                        {msg.role === 'user' ? 'person' : 'smart_toy'}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">
                                        {msg.role === 'user' ? 'You' : 'Ops Copilot'}
                                    </span>
                                </div>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-outline-variant/50">
                                        <p className="text-[10px] font-bold uppercase tracking-widest mb-2 opacity-70">Source Records</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {msg.sources.map((src, i) => (
                                                <div key={i} className="bg-white p-2 rounded border border-outline-variant text-xs shadow-sm flex items-start gap-2">
                                                    <span className="material-symbols-outlined text-[14px] text-primary">description</span>
                                                    <div>
                                                        <span className="font-bold block text-[10px] uppercase opacity-70">{src.type}</span>
                                                        <span className="font-mono text-primary font-bold">{src.id}</span>
                                                        <span className="block opacity-80 mt-0.5 truncate max-w-[150px]">{src.desc}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 flex items-start gap-1.5 text-[10px] opacity-70 bg-surface-variant/30 p-2 rounded">
                                            <span className="material-symbols-outlined text-[12px]">security</span>
                                            <p>Answers are generated from operational records. Verify before external reporting.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isThinking && (
                        <div className="flex justify-start">
                            <div className="bg-surface-container-low text-on-surface border border-outline-variant rounded-2xl p-5 flex items-center gap-3">
                                <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                                <span className="text-xs font-bold uppercase tracking-widest opacity-70 animate-pulse">Analyzing Records...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-outline-variant bg-surface-container-lowest">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {suggestedPrompts.map((p, i) => (
                            <button 
                                key={i}
                                onClick={() => handleSend(p)}
                                disabled={isThinking}
                                className="px-3 py-1.5 rounded-full border border-outline-variant text-xs hover:border-primary hover:text-primary transition-colors bg-white disabled:opacity-50"
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 bg-white border border-outline-variant rounded-lg px-4 py-3 text-sm focus:border-primary focus:ring-1"
                            placeholder="Ask about a lot, material, or receipt..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend(input)}
                            disabled={isThinking}
                        />
                        <button 
                            onClick={() => handleSend(input)}
                            disabled={!input.trim() || isThinking}
                            className="bg-primary text-on-primary w-12 h-12 rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined">send</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
