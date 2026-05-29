"use client";
import { useEffect, useState } from "react";
import { fetchItems, updateItem } from "@/lib/api/client";

interface Lot {
    id: string;
    lot_number: string;
    quantity: number;
    status: string;
    material_id: { name: string } | string | null;
    date_created: string;
}

const COLUMNS = [
    { id: "Pending QC", label: "Awaiting QC", color: "bg-outline" },
    { id: "QC Released", label: "QC Released", color: "bg-secondary" },
    { id: "Ready", label: "Ready", color: "bg-primary" },
    { id: "Blocked", label: "Blocked", color: "bg-error" }
];

export default function PPICPage() {
    const [lots, setLots] = useState<Lot[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchItems<any>("lots", { sort: "-date_created", limit: 100 })
            .then(res => {
                setLots(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load lots", err);
                setLoading(false);
            });
    }, []);

    const handleDragStart = (e: React.DragEvent, lotId: string) => {
        e.dataTransfer.setData("lotId", lotId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
        e.preventDefault();
        const lotId = e.dataTransfer.getData("lotId");
        if (!lotId) return;
        
        // Optimistic UI update
        setLots(prev => prev.map(lot => lot.id === lotId ? { ...lot, status: targetStatus } : lot));
        
        // Persist to DaaS backend
        try {
            await updateItem("lots", lotId, { status: targetStatus });
        } catch (error) {
            console.error("Failed to update lot status", error);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getMaterialName = (mat: any) => {
        if (!mat) return "Unknown Material";
        if (typeof mat === 'object' && mat.name) return mat.name;
        return "Material ID";
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="font-display font-bold text-3xl text-primary">PPIC Board</h2>
                    <p className="text-on-surface-variant mt-1">Production planning and inventory control status.</p>
                </div>
                <div className="flex gap-4">
                    <button className="bg-primary text-on-primary font-bold py-3 px-6 rounded-sm text-xs uppercase tracking-widest">New Batch</button>
                </div>
            </div>

            <div className="bg-primary-container text-on-primary-container p-4 rounded-lg flex items-start gap-4 ambient-shadow">
                <span className="material-symbols-outlined text-secondary-fixed">auto_awesome</span>
                <div className="flex-1">
                    <h4 className="font-bold mb-1">Copilot Suggestion</h4>
                    <p className="text-sm opacity-90">Suggested next production batch: <span className="font-bold text-primary-fixed">LOT-2026-051</span> based on QC release and priority.</p>
                </div>
                <button className="bg-secondary-fixed text-on-secondary-fixed font-bold text-[10px] uppercase tracking-widest px-4 py-2 rounded-sm">Apply</button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="flex overflow-x-auto gap-6 pb-6 h-[600px] items-start">
                    {COLUMNS.map((col, idx) => {
                        const columnLots = lots.filter(lot => lot.status === col.id);
                        
                        return (
                            <div 
                                key={idx} 
                                className="flex-shrink-0 w-80 flex flex-col bg-surface-container-low rounded-xl border border-outline-variant h-full overflow-hidden"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, col.id)}
                            >
                                <div className="p-4 border-b border-outline-variant flex items-center justify-between sticky top-0 bg-surface-container-low z-10">
                                    <h3 className="font-bold text-sm flex items-center gap-2">
                                        <span className={`w-3 h-3 rounded-full ${col.color}`}></span>
                                        {col.label}
                                    </h3>
                                    <span className="bg-surface-container-highest px-2 py-0.5 rounded-full text-[10px] font-bold text-on-surface-variant">{columnLots.length}</span>
                                </div>
                                <div className="p-4 space-y-4 overflow-y-auto">
                                    {columnLots.length > 0 ? columnLots.map((item, i) => (
                                        <div 
                                            key={item.id} 
                                            className="bg-white rounded-lg border border-outline-variant p-4 shadow-sm hover:border-primary transition-colors cursor-grab active:cursor-grabbing"
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, item.id)}
                                        >
                                            <div className="flex justify-between mb-3">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest bg-surface-variant text-on-surface-variant`}>Normal</span>
                                            </div>
                                            <p className="font-bold text-sm">{getMaterialName(item.material_id)}</p>
                                            <p className="text-xs text-outline font-mono mt-1">{item.lot_number || item.id.substring(0,8)}</p>
                                            <div className="mt-4 pt-4 border-t border-outline-variant/30 flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                                                <span>Qty: {item.quantity}</span>
                                                <span>{formatDate(item.date_created)}</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-outline-variant opacity-50">
                                            <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                                            <p className="text-xs">Drop items here</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
