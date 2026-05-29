"use client";
import { useEffect, useState } from "react";
import { fetchItems, createItem, updateItem } from "@/lib/api/client";

interface Lot {
    id: string;
    lot_number: string;
    quantity: number;
    status: string;
    material_id: { id: string; name: string } | string | null;
    date_created: string;
}

interface Material {
    id: string;
    name: string;
    type: string;
}

const COLUMNS = [
    { id: "Pending QC", label: "Awaiting QC", color: "bg-outline" },
    { id: "QC Released", label: "QC Released", color: "bg-secondary" },
    { id: "Ready", label: "Ready", color: "bg-primary" },
    { id: "Blocked", label: "Blocked", color: "bg-error" }
];

// Map "Stored" lots into "Ready" column for display
function getDisplayStatus(status: string): string {
    if (status === "Stored") return "Ready";
    return status;
}

export default function PPICPage() {
    const [lots, setLots] = useState<Lot[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);

    // New Batch Modal state
    const [showNewBatch, setShowNewBatch] = useState(false);
    const [newMaterialId, setNewMaterialId] = useState("");
    const [newQty, setNewQty] = useState("");
    const [creating, setCreating] = useState(false);

    // Apply Copilot state
    const [applying, setApplying] = useState(false);
    const [copilotLot, setCopilotLot] = useState<Lot | null>(null);

    useEffect(() => {
        Promise.all([
            fetchItems<any>("lots", { sort: "-date_created", limit: 100 }),
            fetchItems<any>("materials", {})
        ]).then(([lotsRes, matRes]) => {
            const matMap = new Map(matRes.data.map((m: any) => [m.id, m]));
            const merged = lotsRes.data.map((l: any) => ({
                ...l,
                material_id: matMap.get(l.material_id) || l.material_id,
            }));
            setLots(merged);
            setMaterials(matRes.data);

            // Find the best copilot suggestion: first QC Released lot
            const qcReleasedLots = merged.filter((l: Lot) => l.status === "QC Released");
            if (qcReleasedLots.length > 0) {
                setCopilotLot(qcReleasedLots[0]);
            }
            setLoading(false);
        }).catch(err => {
            console.error("Failed to load PPIC data", err);
            setLoading(false);
        });
    }, []);

    // Drag & Drop handlers
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
        setLots(prev => prev.map(lot => lot.id === lotId ? { ...lot, status: targetStatus } : lot));
        try { await updateItem("lots", lotId, { status: targetStatus }); } catch (err) { console.error(err); }
    };

    // New Batch handler
    const handleCreateBatch = async () => {
        if (!newMaterialId || !newQty) return;
        setCreating(true);
        try {
            const lotNumber = `LOT-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
            const res = await createItem<any>("lots", {
                lot_number: lotNumber,
                quantity: Number(newQty),
                status: "Pending QC",
                material_id: newMaterialId,
            });
            // Add to local state with material info
            const mat = materials.find(m => m.id === newMaterialId);
            setLots(prev => [{ ...res.data, material_id: mat || newMaterialId }, ...prev]);
            setShowNewBatch(false);
            setNewMaterialId("");
            setNewQty("");
            alert(`✅ Batch ${lotNumber} created and added to QC queue!`);
        } catch (err) {
            console.error(err);
            alert("❌ Failed to create batch.");
        } finally {
            setCreating(false);
        }
    };

    // Apply Copilot: move the suggested lot to "Ready"
    const handleApplyCopilot = async () => {
        if (!copilotLot) return;
        setApplying(true);
        try {
            await updateItem("lots", copilotLot.id, { status: "Ready" });
            setLots(prev => prev.map(l => l.id === copilotLot.id ? { ...l, status: "Ready" } : l));
            alert(`✅ ${copilotLot.lot_number || "Lot"} moved to Ready for production!`);
            // Find next suggestion
            const remaining = lots.filter(l => l.status === "QC Released" && l.id !== copilotLot.id);
            setCopilotLot(remaining.length > 0 ? remaining[0] : null);
        } catch (err) {
            console.error(err);
            alert("❌ Failed to apply suggestion.");
        } finally {
            setApplying(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    const getMaterialName = (mat: any) => {
        if (!mat) return "Unknown Material";
        if (typeof mat === 'object' && mat.name) return mat.name;
        return "Material";
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="font-display font-bold text-3xl text-primary">PPIC Board</h2>
                    <p className="text-on-surface-variant mt-1">Production planning and inventory control status.</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setShowNewBatch(true)} className="bg-primary text-on-primary font-bold py-3 px-6 rounded-sm text-xs uppercase tracking-widest hover:opacity-90 transition-opacity">New Batch</button>
                </div>
            </div>

            {/* Copilot Suggestion */}
            {copilotLot ? (
                <div className="bg-primary-container text-on-primary-container p-4 rounded-lg flex items-start gap-4 ambient-shadow">
                    <span className="material-symbols-outlined text-secondary-fixed">auto_awesome</span>
                    <div className="flex-1">
                        <h4 className="font-bold mb-1">Copilot Suggestion</h4>
                        <p className="text-sm opacity-90">Suggested next production batch: <span className="font-bold text-primary-fixed">{copilotLot.lot_number || copilotLot.id.substring(0,8)}</span> ({getMaterialName(copilotLot.material_id)}) — Move to Ready for production.</p>
                    </div>
                    <button 
                        onClick={handleApplyCopilot} 
                        disabled={applying}
                        className="bg-secondary-fixed text-on-secondary-fixed font-bold text-[10px] uppercase tracking-widest px-4 py-2 rounded-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                        {applying ? "Applying..." : "Apply"}
                    </button>
                </div>
            ) : (
                <div className="bg-surface-container-low text-on-surface-variant p-4 rounded-lg flex items-center gap-4 border border-outline-variant">
                    <span className="material-symbols-outlined">check_circle</span>
                    <p className="text-sm font-bold">All QC Released batches have been scheduled. No pending suggestions.</p>
                </div>
            )}

            {/* New Batch Modal */}
            {showNewBatch && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNewBatch(false)}>
                    <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="font-display font-bold text-xl text-primary mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined">add_circle</span> Create New Batch
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-2">Material</label>
                                <select 
                                    value={newMaterialId} 
                                    onChange={e => setNewMaterialId(e.target.value)}
                                    className="w-full border border-outline-variant rounded-sm p-3 text-sm focus:ring-primary focus:border-primary"
                                >
                                    <option value="">Select material...</option>
                                    {materials.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-2">Quantity (kg)</label>
                                <input 
                                    type="number" 
                                    value={newQty} 
                                    onChange={e => setNewQty(e.target.value)}
                                    placeholder="e.g. 500"
                                    className="w-full border border-outline-variant rounded-sm p-3 text-sm focus:ring-primary focus:border-primary"
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button onClick={() => setShowNewBatch(false)} className="flex-1 border border-outline-variant text-on-surface font-bold py-3 rounded-sm text-xs uppercase tracking-widest hover:bg-surface-container-low transition-colors">Cancel</button>
                            <button 
                                onClick={handleCreateBatch} 
                                disabled={creating || !newMaterialId || !newQty}
                                className="flex-1 bg-primary text-on-primary font-bold py-3 rounded-sm text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-opacity"
                            >
                                {creating ? "Creating..." : "Create Batch"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Kanban Board */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="flex overflow-x-auto gap-6 pb-6 h-[600px] items-start">
                    {COLUMNS.map((col, idx) => {
                        const columnLots = lots.filter(lot => getDisplayStatus(lot.status) === col.id);
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
                                    {columnLots.length > 0 ? columnLots.map((item) => (
                                        <div 
                                            key={item.id} 
                                            className="bg-white rounded-lg border border-outline-variant p-4 shadow-sm hover:border-primary transition-colors cursor-grab active:cursor-grabbing"
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, item.id)}
                                        >
                                            <div className="flex justify-between mb-3">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest bg-surface-variant text-on-surface-variant">
                                                    {item.quantity > 100 ? "High" : "Normal"}
                                                </span>
                                            </div>
                                            <p className="font-bold text-sm">{getMaterialName(item.material_id)}</p>
                                            <p className="text-xs text-outline font-mono mt-1">{item.lot_number || item.id.substring(0,8)}</p>
                                            <div className="mt-4 pt-4 border-t border-outline-variant/30 flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                                                <span>Qty: {item.quantity}kg</span>
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
