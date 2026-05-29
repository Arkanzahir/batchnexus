"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchItems, createItem } from "@/lib/api/client";

interface Receipt {
    id: string;
    batch_reference: string;
    quantity: number;
    unit: string;
    hazard_class: string;
    status: string;
    temperature_requirement?: string;
    material_id: { id: string; name: string; type: string; hazard_class: string } | string | null;
    supplier_id: { id: string; name: string; code: string; country: string } | string | null;
}

interface QCResult {
    colour_score: number;
    defect_risk: string;
    foreign_matter_risk: string;
    recommendation: string;
    confidence: number;
    reason_codes: string[];
}

function getMaterialName(r: Receipt): string {
    if (typeof r.material_id === "object" && r.material_id) return r.material_id.name;
    return "Unknown";
}
function getSupplierName(r: Receipt): string {
    if (typeof r.supplier_id === "object" && r.supplier_id) return r.supplier_id.name;
    return "Unknown";
}
function getSupplierCountry(r: Receipt): string {
    if (typeof r.supplier_id === "object" && r.supplier_id) return r.supplier_id.country;
    return "—";
}
function getMaterialId(r: Receipt): string {
    if (typeof r.material_id === "object" && r.material_id) return r.material_id.id;
    return typeof r.material_id === "string" ? r.material_id : "";
}

function QCStationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedId = searchParams.get("receipt");

    const [pendingReceipts, setPendingReceipts] = useState<Receipt[]>([]);
    const [activeReceipt, setActiveReceipt] = useState<Receipt | null>(null);
    const [loading, setLoading] = useState(true);

    // Checklist state
    const [checklist, setChecklist] = useState({
        visualClarity: true,
        odorProfile: true,
        specificGravity: false,
        refractiveIndex: false,
    });

    // AI QC Result
    const [qcResult, setQcResult] = useState<QCResult | null>(null);
    const [scoring, setScoring] = useState(false);
    const [approving, setApproving] = useState(false);
    const [auditNote, setAuditNote] = useState("");

    // Load pending receipts
    useEffect(() => {
        Promise.all([
            fetchItems<any>("inbound_receipts", {
                filter: { status: { _neq: "QC Released" } },
                sort: "-arrival_date",
                limit: 10,
            }),
            fetchItems<any>("suppliers", {}),
            fetchItems<any>("materials", {})
        ]).then(([recRes, supRes, matRes]) => {
            const suppliers = new Map(supRes.data.map((s: any) => [s.id, s]));
            const materials = new Map(matRes.data.map((m: any) => [m.id, m]));
            
            const merged = recRes.data.map((r: any) => ({
                ...r,
                supplier_id: suppliers.get(r.supplier_id) || r.supplier_id,
                material_id: materials.get(r.material_id) || r.material_id,
            }));

            setPendingReceipts(merged);
            if (preselectedId) {
                const found = merged.find((r: any) => r.id === preselectedId);
                if (found) setActiveReceipt(found);
                else if (merged.length > 0) setActiveReceipt(merged[0]);
            } else if (merged.length > 0) {
                setActiveReceipt(merged[0]);
            }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [preselectedId]);

    // Trigger AI scoring when checklist or active receipt changes
    useEffect(() => {
        if (!activeReceipt) return;
        setScoring(true);
        fetch("/api/ai/qc-score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                materialName: getMaterialName(activeReceipt),
                hazardClass: activeReceipt.hazard_class,
                checklist,
            }),
        })
            .then((r) => r.json())
            .then((j) => setQcResult(j.data))
            .catch(console.error)
            .finally(() => setScoring(false));
    }, [checklist, activeReceipt]);

    // Handle QC Approval
    const handleApprove = async () => {
        if (!activeReceipt || !qcResult) return;
        setApproving(true);

        try {
            const lotNumber = `LOT-2026-${String(Math.floor(Math.random() * 900) + 100)}`;

            // 1. Create QC Inspection record in DaaS
            await createItem("qc_inspections", {
                receipt_id: activeReceipt.id,
                ai_color_score: qcResult.colour_score,
                ai_defect_risk: qcResult.defect_risk === "Low" ? 0.1 : qcResult.defect_risk === "Medium" ? 0.4 : 0.8,
                ai_foreign_matter_risk: qcResult.foreign_matter_risk === "Low" ? 0.05 : qcResult.foreign_matter_risk === "Medium" ? 0.3 : 0.7,
                ai_recommendation: qcResult.recommendation,
                human_decision: "QC Released",
                lot_number_generated: lotNumber,
                comments: auditNote || "Approved after human review.",
            });

            // 2. Create Lot record in DaaS
            await createItem("lots", {
                lot_number: lotNumber,
                quantity: activeReceipt.quantity,
                status: "QC Released",
                receipt_id: activeReceipt.id,
                material_id: getMaterialId(activeReceipt),
            });

            // 3. Update receipt status (via PATCH through proxy)
            await fetch(`/api/items/inbound_receipts/${activeReceipt.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "QC Released" }),
            });

            alert(`✅ QC Approved! Lot ${lotNumber} has been created.\nRedirecting to Warehouse for slot assignment...`);
            router.push("/warehouse");
        } catch (err) {
            console.error("Approval failed:", err);
            alert("❌ Approval failed. Check console for details.");
        } finally {
            setApproving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32 text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin mr-3 text-3xl">sync</span>
                Loading QC data from DaaS...
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-end border-b border-outline-variant pb-4">
                <div>
                    <h2 className="font-display font-bold text-3xl text-primary">QC Release Station</h2>
                    <p className="text-on-surface-variant mt-1">
                        {activeReceipt
                            ? `Material: ${getMaterialName(activeReceipt)} — ${activeReceipt.batch_reference}`
                            : "No pending inspections"}
                    </p>
                </div>
                <span className="bg-surface-container-highest px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest">
                    Status: {activeReceipt?.status ?? "—"}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT: Pending Queue */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                    <h3 className="font-bold uppercase text-xs tracking-widest mb-2">Pending Inspection</h3>
                    {pendingReceipts.length === 0 && (
                        <p className="text-sm text-on-surface-variant">All receipts have been inspected ✅</p>
                    )}
                    {pendingReceipts.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setActiveReceipt(item)}
                            className={`p-4 rounded-sm border cursor-pointer transition-colors ${activeReceipt?.id === item.id ? "bg-primary-container text-on-primary-container border-primary" : "bg-white border-outline-variant hover:bg-surface-container-low"}`}
                        >
                            <p className="text-sm font-bold">{getMaterialName(item)}</p>
                            <p className={`text-[10px] mt-1 ${activeReceipt?.id === item.id ? "text-primary-fixed" : "text-outline"}`}>{item.batch_reference}</p>
                        </div>
                    ))}
                </div>

                {/* CENTER: Details + Checklist */}
                <div className="lg:col-span-5 flex flex-col gap-8">
                    {activeReceipt && (
                        <>
                            <div className="bg-white rounded-xl border border-outline-variant overflow-hidden shadow-sm">
                                <div className="h-64 bg-surface-container-highest relative flex items-center justify-center">
                                    <div className="text-center text-on-surface-variant">
                                        <span className="material-symbols-outlined text-6xl mb-2 block">photo_camera</span>
                                        <p className="text-sm">QC Image Capture</p>
                                        <p className="text-[10px] mt-1">Upload or capture material photo</p>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h4 className="font-bold mb-4">Batch Details</h4>
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div><span className="text-outline">Supplier:</span> <span className="font-bold">{getSupplierName(activeReceipt)}</span></div>
                                        <div><span className="text-outline">Origin:</span> <span className="font-bold">{getSupplierCountry(activeReceipt)}</span></div>
                                        <div><span className="text-outline">Batch:</span> <span className="font-bold">{activeReceipt.batch_reference}</span></div>
                                        <div><span className="text-outline">Qty:</span> <span className="font-bold">{activeReceipt.quantity} {activeReceipt.unit}</span></div>
                                        <div><span className="text-outline">Hazard:</span> <span className="font-bold">{activeReceipt.hazard_class}</span></div>
                                        <div><span className="text-outline">Temp:</span> <span className="font-bold">{activeReceipt.temperature_requirement}</span></div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
                                <h4 className="font-bold mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-outline">checklist</span> Inspection Checklist
                                </h4>
                                <div className="space-y-4">
                                    {([
                                        ["visualClarity", "Visual Clarity Check"],
                                        ["odorProfile", "Odor Profile Match"],
                                        ["specificGravity", "Specific Gravity Test"],
                                        ["refractiveIndex", "Refractive Index Test"],
                                    ] as const).map(([key, label]) => (
                                        <label key={key} className="flex items-center gap-4 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={checklist[key]}
                                                onChange={() => setChecklist((prev) => ({ ...prev, [key]: !prev[key] }))}
                                                className="w-5 h-5 rounded-sm border-outline-variant text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm font-bold group-hover:text-primary transition-colors">{label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* RIGHT: AI QC Result */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="bg-white rounded-xl border border-outline-variant overflow-hidden shadow-sm flex flex-col">
                        <div className="bg-surface-container-low p-4 border-b border-outline-variant flex justify-between items-center">
                            <h4 className="font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-secondary icon-fill">smart_toy</span> AI QC Result
                            </h4>
                            {qcResult && (
                                <span className="bg-tertiary-container text-on-tertiary-container px-2 py-1 rounded-sm text-[10px] font-bold">
                                    Confidence: {Math.round(qcResult.confidence * 100)}%
                                </span>
                            )}
                        </div>
                        <div className="p-6">
                            {scoring ? (
                                <div className="flex items-center justify-center py-8 text-on-surface-variant">
                                    <span className="material-symbols-outlined animate-spin mr-2">sync</span>
                                    AI analyzing...
                                </div>
                            ) : qcResult ? (
                                <>
                                    <div className="mb-6">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Colour Score</span>
                                            <span className="font-bold text-2xl text-primary">{qcResult.colour_score}<span className="text-xs text-outline font-normal">/100</span></span>
                                        </div>
                                        <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                                            <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${qcResult.colour_score}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Defect Risk</span>
                                            <p className={`font-bold text-sm mt-1 ${qcResult.defect_risk === 'Low' ? 'text-secondary' : qcResult.defect_risk === 'Medium' ? 'text-tertiary' : 'text-error'}`}>{qcResult.defect_risk}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Foreign Matter</span>
                                            <p className={`font-bold text-sm mt-1 ${qcResult.foreign_matter_risk === 'Low' ? 'text-secondary' : qcResult.foreign_matter_risk === 'Medium' ? 'text-tertiary' : 'text-error'}`}>{qcResult.foreign_matter_risk}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 mb-6">
                                        <span className="text-[10px] font-bold text-outline uppercase tracking-widest">AI Suggestion</span>
                                        <div className={`p-3 rounded-sm font-bold text-center text-xs ${qcResult.recommendation === 'Pass' ? 'bg-secondary-container text-on-secondary-container' : qcResult.recommendation === 'Block Material' ? 'bg-error-container text-on-error-container' : 'bg-tertiary-fixed text-on-tertiary-fixed'}`}>
                                            {qcResult.recommendation}
                                        </div>
                                    </div>
                                    <div className="text-xs space-y-2 text-on-surface-variant">
                                        {qcResult.reason_codes.map((reason, i) => (
                                            <p key={i} className="flex items-start gap-2">
                                                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${reason.startsWith('⚠') || reason.startsWith('🔥') ? 'bg-error' : 'bg-secondary'}`}></span>
                                                {reason}
                                            </p>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-on-surface-variant text-center py-8">Select a receipt to start QC</p>
                            )}
                        </div>
                        {qcResult && activeReceipt && (
                            <div className="bg-surface-container-low p-6 border-t border-outline-variant space-y-4">
                                <textarea
                                    className="w-full bg-white border border-outline-variant rounded-sm p-3 text-xs focus:ring-primary focus:border-primary"
                                    rows={2}
                                    placeholder="Audit notes..."
                                    value={auditNote}
                                    onChange={(e) => setAuditNote(e.target.value)}
                                />
                                <button
                                    onClick={handleApprove}
                                    disabled={approving || qcResult.recommendation === "Block Material"}
                                    className="w-full bg-primary text-on-primary font-bold py-3 rounded-sm text-xs uppercase tracking-widest shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                                >
                                    {approving ? "Processing..." : "Approve Release"}
                                </button>
                                <button className="w-full bg-white border border-outline text-on-surface font-bold py-3 rounded-sm text-xs uppercase tracking-widest">Request Recheck</button>
                                <button className="w-full text-error text-[10px] font-bold uppercase tracking-widest hover:underline">Block Material</button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-secondary justify-center">
                        <span className="material-symbols-outlined text-sm">cloud_done</span>
                        <span className="font-bold">Connected to DaaS Backend</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function QCStationPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-xs text-outline font-mono">Loading QC Station...</div>}>
            <QCStationContent />
        </Suspense>
    );
}
