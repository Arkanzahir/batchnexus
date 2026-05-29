"use client";
import { useEffect, useState } from "react";
import { fetchItems } from "@/lib/api/client";

interface AuditEvent {
    id: string;
    time: string;
    actor: string;
    action: string;
    entity: string;
    change: string;
    timestamp: number;
}

export default function AuditLogPage() {
    const [events, setEvents] = useState<AuditEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        // Fetch all operational data to build the unified audit log
        Promise.all([
            fetchItems<any>("inbound_receipts", { limit: 20 }),
            fetchItems<any>("qc_inspections", { limit: 20 }),
            fetchItems<any>("inventory_moves", { limit: 20 }),
            fetchItems<any>("lots", { limit: 20 })
        ]).then(([inboundRes, qcRes, movesRes, lotsRes]) => {
            const unifiedEvents: AuditEvent[] = [];

            // Map Inbound
            inboundRes.data.forEach((item: any) => {
                unifiedEvents.push({
                    id: `inb-${item.id}`,
                    time: new Date(item.arrival_date || item.date_created || Date.now()).toLocaleString(),
                    actor: "System AI / Operator",
                    action: "Intake",
                    entity: `RECEIPT-${item.id.substring(0,6).toUpperCase()}`,
                    change: `Recorded inbound material intake. Status: ${item.status}`,
                    timestamp: new Date(item.arrival_date || item.date_created || Date.now()).getTime()
                });
            });

            // Map QC
            qcRes.data.forEach((item: any) => {
                unifiedEvents.push({
                    id: `qc-${item.id}`,
                    time: new Date(item.date_created || Date.now()).toLocaleString(),
                    actor: "QC Inspector",
                    action: "QC Review",
                    entity: item.lot_number_generated ? `LOT-${item.lot_number_generated}` : `QC-${item.id.substring(0,4)}`,
                    change: `Human Decision: ${item.human_decision}. Color Score: ${item.ai_color_score}`,
                    timestamp: new Date(item.date_created || Date.now()).getTime()
                });
            });

            // Map Moves
            movesRes.data.forEach((item: any) => {
                unifiedEvents.push({
                    id: `mov-${item.id}`,
                    time: new Date(item.date_created || Date.now()).toLocaleString(),
                    actor: "Warehouse Staff",
                    action: "Slot Assignment",
                    entity: item.lot_id,
                    change: `Moved to bin ${item.to_bin_id}`,
                    timestamp: new Date(item.date_created || Date.now()).getTime()
                });
            });

            // Sort chronologically (newest first)
            unifiedEvents.sort((a, b) => b.timestamp - a.timestamp);
            setEvents(unifiedEvents);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    const handleGenerateSummary = async () => {
        setGenerating(true);
        try {
            const res = await fetch("/api/ai/summary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // Only send the top 15 events to avoid huge payloads
                body: JSON.stringify({ logs: events.slice(0, 15) })
            });
            const data = await res.json();
            setSummary(data.text);
        } catch (error) {
            console.error(error);
            setSummary("Failed to generate summary.");
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32 text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin mr-3 text-3xl">sync</span>
                Compiling Unified Audit Logs...
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest">Enterprise Feature</span>
                    </div>
                    <h2 className="font-display font-bold text-3xl text-primary">Operations Audit & Summary</h2>
                    <p className="text-on-surface-variant mt-1">Immutable compliance tracking for all system critical actions.</p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={handleGenerateSummary}
                        disabled={generating}
                        className="bg-primary text-on-primary font-bold py-3 px-6 rounded-sm text-xs uppercase tracking-widest flex items-center gap-2 shadow-sm hover:opacity-90 disabled:opacity-50"
                    >
                        {generating ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : <span className="material-symbols-outlined text-sm">smart_toy</span>} 
                        Generate AI Summary
                    </button>
                    <button className="bg-white border border-primary text-primary font-bold py-3 px-6 rounded-sm text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-surface-container-low transition-colors">
                        <span className="material-symbols-outlined text-sm">download</span> Export CSV
                    </button>
                </div>
            </div>

            {summary && (
                <div className="bg-primary-container text-on-primary-container p-6 rounded-xl border border-primary/20 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <h3 className="font-bold flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined">analytics</span> Executive Operations Summary
                    </h3>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium opacity-90">
                        {summary}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden mt-4">
                <table className="w-full text-left">
                    <thead className="bg-surface-container-low text-[10px] font-bold text-on-surface-variant uppercase tracking-widest border-b border-outline-variant">
                        <tr>
                            <th className="px-6 py-4">Timestamp</th>
                            <th className="px-6 py-4">Actor</th>
                            <th className="px-6 py-4">Action</th>
                            <th className="px-6 py-4">Entity</th>
                            <th className="px-6 py-4">Change Detail</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-outline-variant/30">
                        {events.map((row, idx) => (
                            <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                                <td className="px-6 py-4 text-xs text-outline">{row.time}</td>
                                <td className="px-6 py-4 font-bold">{row.actor}</td>
                                <td className="px-6 py-4 font-bold text-primary">{row.action}</td>
                                <td className="px-6 py-4">
                                    <span className="bg-surface-container-highest px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-widest border border-outline-variant truncate max-w-[150px] inline-block">
                                        {row.entity}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-on-surface-variant">{row.change}</td>
                            </tr>
                        ))}
                        {events.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-on-surface-variant">No audit logs found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
