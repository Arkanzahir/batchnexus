"use client";
import { useEffect, useState } from "react";
import { fetchItems, updateItem, createItem } from "@/lib/api/client";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AIRecommendationCard } from "@/components/shared/AIRecommendationCard";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { useRole, canApproveQC } from "@/lib/rbac";

export default function QCStationPage() {
    const { role } = useRole();
    const [pendingTasks, setPendingTasks] = useState<any[]>([]);
    const [selectedTask, setSelectedTask] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Lookups
    const [materials, setMaterials] = useState<Map<string, any>>(new Map());
    const [suppliers, setSuppliers] = useState<Map<string, any>>(new Map());

    const loadData = async () => {
        setLoading(true);
        try {
            const [matRes, supRes, recRes] = await Promise.all([
                fetchItems<any>("materials", {}),
                fetchItems<any>("suppliers", {}),
                fetchItems<any>("inbound_receipts", { sort: "-date_created", limit: 50 })
            ]);

            setMaterials(new Map(matRes.data.map((m: any) => [m.id, m])));
            setSuppliers(new Map(supRes.data.map((s: any) => [s.id, s])));

            // Filter for QC-relevant statuses
            const relevant = recRes.data.filter((r: any) => ["Pending QC", "Needs Review", "QC Released", "Blocked"].includes(r.status));
            setPendingTasks(relevant);
            
            // Auto-select first pending if available
            const pending = relevant.find((r: any) => r.status === "Pending QC");
            if (pending && !selectedTask) {
                setSelectedTask(pending);
            }
        } catch (err) {
            console.error("Failed to load QC data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const getMaterialName = (id: string | any) => {
        if (typeof id === 'object' && id?.name) return id.name;
        return materials.get(id)?.name || "Unknown Material";
    };

    const getSupplierName = (id: string | any) => {
        if (typeof id === 'object' && id?.name) return id.name;
        return suppliers.get(id)?.name || "Unknown Supplier";
    };

    const handleApprove = async () => {
        if (!selectedTask) return;
        setProcessing(true);
        try {
            // 1. Update receipt status
            await updateItem("inbound_receipts", selectedTask.id, { status: "QC Released" });

            // 2. Create QC Inspection Record (matching actual DaaS schema)
            const lotNo = `LOT-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
            await createItem("qc_inspections", {
                receipt_id: selectedTask.id,
                ai_color_score: 87,
                ai_defect_risk: 0.08,
                ai_foreign_matter_risk: 0.05,
                ai_recommendation: "Pass with human review",
                human_decision: "QC Released",
                lot_number_generated: lotNo,
                comments: `Approved by ${role}. Quality meets standards.`,
            });

            // 3. Create Lot Record (matching actual DaaS schema)
            await createItem("lots", {
                lot_number: lotNo,
                receipt_id: selectedTask.id,
                material_id: selectedTask.material_id,
                quantity: selectedTask.quantity,
                status: "Awaiting Slot",
            });

            // Audit log is tracked automatically by DaaS Activity

            alert(`✅ QC release approved. Lot ${lotNo} created.`);
            setShowConfirm(false);
            setSelectedTask(null);
            await loadData();
        } catch (err) {
            console.error(err);
            alert("❌ Failed to approve QC.");
        } finally {
            setProcessing(false);
        }
    };

    const hasPermission = canApproveQC(role);

    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-140px)]">
            <div>
                <h2 className="font-display font-bold text-3xl text-primary">QC Release Station</h2>
                <p className="text-on-surface-variant mt-1">Review AI scores and provide human sign-off for material release.</p>
            </div>

            <div className="flex flex-1 gap-6 min-h-0">
                {/* Left: Queue */}
                <div className="w-1/3 flex flex-col bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
                    <div className="p-4 border-b border-outline-variant bg-surface-container flex items-center justify-between sticky top-0">
                        <h3 className="font-bold text-sm">Inspection Queue</h3>
                        <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingTasks.filter(t => t.status === "Pending QC").length} Pending</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {loading ? (
                            <div className="flex justify-center p-8"><span className="material-symbols-outlined animate-spin text-primary">sync</span></div>
                        ) : pendingTasks.length === 0 ? (
                            <div className="text-center p-8 text-on-surface-variant opacity-70">
                                <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                                <p className="text-xs">No pending QC tasks. Submit an inbound receipt to start QC review.</p>
                            </div>
                        ) : (
                            pendingTasks.map(task => (
                                <button
                                    key={task.id}
                                    onClick={() => setSelectedTask(task)}
                                    className={`w-full text-left p-4 rounded-lg border transition-all ${selectedTask?.id === task.id ? 'bg-primary-container border-primary shadow-sm' : 'bg-white border-outline-variant hover:border-primary/50'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-mono text-xs text-outline font-bold">{task.receipt_no}</span>
                                        <StatusBadge status={task.status} />
                                    </div>
                                    <p className="font-bold text-sm line-clamp-1">{getMaterialName(task.material_id)}</p>
                                    <p className="text-xs text-on-surface-variant line-clamp-1">{getSupplierName(task.supplier_id)}</p>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Center & Right: Details & Action */}
                <div className="w-2/3 flex flex-col bg-white rounded-xl border border-outline-variant overflow-hidden shadow-sm relative">
                    {!selectedTask ? (
                        <div className="flex flex-col items-center justify-center h-full text-on-surface-variant opacity-50">
                            <span className="material-symbols-outlined text-6xl mb-4">biotech</span>
                            <p>Select a task from the queue to begin inspection.</p>
                        </div>
                    ) : (
                        <div className="flex flex-1 min-h-0">
                            {/* Center: Material Info */}
                            <div className="w-1/2 p-8 border-r border-outline-variant overflow-y-auto">
                                <h3 className="font-display font-bold text-2xl text-primary mb-6">{getMaterialName(selectedTask.material_id)}</h3>
                                
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">Receipt Number</p>
                                            <p className="font-mono font-bold text-sm">{selectedTask.receipt_no}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">Supplier</p>
                                            <p className="font-bold text-sm">{getSupplierName(selectedTask.supplier_id)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">Quantity</p>
                                            <p className="font-bold text-sm">{selectedTask.quantity} {selectedTask.unit}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">Batch Reference</p>
                                            <p className="font-mono text-sm">{selectedTask.batch_reference || "—"}</p>
                                        </div>
                                    </div>

                                    <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant">
                                        <h4 className="font-bold text-sm mb-3">Storage Requirements</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-secondary text-sm">thermostat</span>
                                                <span className="text-xs">{selectedTask.temperature_requirement || "Ambient"}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-error text-sm">warning</span>
                                                <span className="text-xs">{selectedTask.hazard_class || "Normal"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: AI & Human Panel */}
                            <div className="w-1/2 p-8 overflow-y-auto bg-surface-container-lowest flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">analytics</span>
                                        QC Analysis
                                    </h3>
                                    
                                    {selectedTask.status === "Pending QC" || selectedTask.status === "QC Released" ? (
                                        <div className="space-y-6">
                                            <AIRecommendationCard 
                                                title="Visual & Organoleptic AI"
                                                recommendation="Pass with human review"
                                                confidence={86}
                                                reasonCodes={[
                                                    "Colour is within expected range",
                                                    "No visible dark spots detected",
                                                    "Texture appears consistent"
                                                ]}
                                                humanReviewNote="AI supports the first inspection layer. Final release must be approved by QC staff."
                                                icon="biotech"
                                            />

                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="bg-white p-3 rounded border border-outline-variant text-center">
                                                    <p className="text-[10px] uppercase tracking-widest font-bold opacity-70">Colour</p>
                                                    <p className="font-mono font-bold text-primary mt-1">87/100</p>
                                                </div>
                                                <div className="bg-white p-3 rounded border border-outline-variant text-center">
                                                    <p className="text-[10px] uppercase tracking-widest font-bold opacity-70">Defect</p>
                                                    <p className="font-bold text-secondary mt-1">Low</p>
                                                </div>
                                                <div className="bg-white p-3 rounded border border-outline-variant text-center">
                                                    <p className="text-[10px] uppercase tracking-widest font-bold opacity-70">Foreign</p>
                                                    <p className="font-bold text-secondary mt-1">Low</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-surface-variant/30 p-6 rounded-xl text-center text-on-surface-variant">
                                            <p className="text-sm">No AI data available for this status.</p>
                                        </div>
                                    )}
                                </div>

                                {selectedTask.status === "Pending QC" && (
                                    <div className="mt-8 space-y-3">
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant text-center mb-2">Human Decision</p>
                                        <button 
                                            onClick={() => setShowConfirm(true)}
                                            disabled={!hasPermission}
                                            className={`w-full font-bold py-4 rounded-sm text-sm uppercase tracking-widest transition-all flex justify-center items-center gap-2
                                                ${hasPermission ? 'bg-primary text-on-primary hover:opacity-90' : 'bg-surface-variant text-on-surface-variant opacity-50 cursor-not-allowed'}`}
                                        >
                                            <span className="material-symbols-outlined">verified</span>
                                            Approve Release
                                        </button>
                                        <div className="flex gap-3">
                                            <button disabled={!hasPermission} className="flex-1 border border-outline-variant bg-white font-bold py-3 rounded-sm text-xs uppercase tracking-widest text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50">Recheck</button>
                                            <button disabled={!hasPermission} className="flex-1 border border-error/50 text-error bg-error-container/10 font-bold py-3 rounded-sm text-xs uppercase tracking-widest hover:bg-error-container transition-colors disabled:opacity-50">Block</button>
                                        </div>
                                        {!hasPermission && (
                                            <p className="text-xs text-error mt-2 text-center">Your role ({role}) cannot approve QC.</p>
                                        )}
                                        <p className="text-[10px] text-center text-outline mt-2">This decision will be recorded in the audit log.</p>
                                    </div>
                                )}
                                
                                {selectedTask.status !== "Pending QC" && (
                                    <div className="mt-8 bg-surface-container-highest p-4 rounded-lg flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-primary">lock</span>
                                        <p className="text-xs font-bold">Record locked (Status: {selectedTask.status})</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal 
                isOpen={showConfirm}
                title="Approve QC Release?"
                message="This decision will update the receipt status to 'QC Released', generate a new Lot Number for production, and create an immutable audit log entry."
                confirmLabel="Approve Release"
                onConfirm={handleApprove}
                onCancel={() => setShowConfirm(false)}
                isLoading={processing}
            />
        </div>
    );
}
