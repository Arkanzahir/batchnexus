"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchItems, createItem } from "@/lib/api/client";
import { useRole, canSubmitToQC } from "@/lib/rbac";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { AIRecommendationCard } from "@/components/shared/AIRecommendationCard";

export default function InboundNewPage() {
    const router = useRouter();
    const { role } = useRole();
    const [textInput, setTextInput] = useState("");
    const [extracting, setExtracting] = useState(false);
    const [extractedData, setExtractedData] = useState<any | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Lookups for DaaS IDs
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);

    useEffect(() => {
        fetchItems<any>("suppliers", {}).then(res => setSuppliers(res.data)).catch(console.error);
        fetchItems<any>("materials", {}).then(res => setMaterials(res.data)).catch(console.error);
    }, []);

    const handleExtract = async () => {
        if (!textInput) return;
        setExtracting(true);
        setExtractedData(null);
        try {
            const res = await fetch("/api/ai/extract-manifest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: textInput })
            });
            const data = await res.json();
            if (data.data) {
                setExtractedData(data.data);
            } else {
                alert("Extraction failed.");
            }
        } catch (error) {
            console.error("Extraction error", error);
            alert("Error calling AI.");
        } finally {
            setExtracting(false);
        }
    };

    const handleFieldChange = (field: string, value: any) => {
        setExtractedData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!extractedData) return;
        setSubmitting(true);
        try {
            // Find fuzzy matches for supplier and material IDs
            const matchedSupplier = suppliers.find(s => s.name.toLowerCase().includes(extractedData.supplier_name.toLowerCase().split(' ')[0])) || suppliers[0] || { id: "SUP-002" };
            const matchedMaterial = materials.find(m => m.name.toLowerCase().includes(extractedData.material_name.toLowerCase().split(' ')[0])) || materials[0] || { id: "MAT-002" };

            await createItem("inbound_receipts", {
                receipt_no: `REC-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
                quantity: Number(extractedData.quantity),
                unit: extractedData.unit,
                batch_reference: extractedData.batch_reference,
                temperature_requirement: extractedData.temperature_requirement,
                hazard_class: extractedData.hazard_class,
                status: "Pending QC",
                arrival_date: extractedData.arrival_date || new Date().toISOString().split('T')[0],
                supplier_id: matchedSupplier?.id,
                material_id: matchedMaterial?.id
            });

            // Create audit log event
            await createItem("audit_logs", {
                timestamp: new Date().toISOString(),
                actor: "Current User",
                role: role,
                action: "Submitted receipt to QC",
                entity: "New Receipt",
                change_detail: "Status set to Pending QC."
            });

            setShowConfirm(false);
            router.push("/inbound");
        } catch (err) {
            console.error("Submit failed", err);
            alert("❌ Failed to submit receipt.");
        } finally {
            setSubmitting(false);
        }
    };

    const hasPermission = canSubmitToQC(role);

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="font-display font-bold text-3xl text-primary">AI Inbound Intake</h2>
                <p className="text-on-surface-variant mt-1">Paste delivery manifest text. Ops Copilot will extract key data instantly.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Input */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white border-2 border-dashed border-outline-variant rounded-xl p-8 flex flex-col shadow-sm focus-within:border-primary transition-colors h-[500px]">
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">description</span>
                            Raw Manifest Text
                        </h3>
                        <p className="text-sm text-on-surface-variant mb-4">Paste the supplier WhatsApp message or email text here.</p>
                        
                        <textarea 
                            className="flex-1 bg-surface-container-lowest border-none resize-none focus:ring-0 p-0 text-sm font-mono text-on-surface"
                            placeholder="Example: Supplier: Java Citrus Farm, Material: Citrus Peel Extract, Quantity: 12 drums, Arrival date: 28 May 2026, Batch reference: JCF-CIT-0526, Temperature: -20°C to -4°C, Hazard class: Flammable."
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                        ></textarea>
                    </div>

                    <button 
                        onClick={handleExtract} 
                        disabled={!textInput || extracting || !hasPermission}
                        className={`w-full font-bold py-4 rounded-sm text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2
                            ${hasPermission ? 'bg-secondary text-on-secondary hover:opacity-90' : 'bg-surface-variant text-on-surface-variant opacity-50 cursor-not-allowed'}`}
                    >
                        {extracting ? (
                            <><span className="material-symbols-outlined animate-spin">sync</span> Extracting...</>
                        ) : (
                            <><span className="material-symbols-outlined">auto_awesome</span> Run AI Extraction</>
                        )}
                    </button>
                    {!hasPermission && (
                        <p className="text-xs text-error mt-[-10px] text-center">Your current role does not have permission for this action.</p>
                    )}
                </div>

                {/* Right: Output */}
                <div className="flex flex-col gap-6">
                    {!extractedData ? (
                        <div className="bg-surface-container-low border border-outline-variant rounded-xl flex items-center justify-center h-[500px] text-on-surface-variant flex-col gap-4">
                            <span className="material-symbols-outlined text-5xl opacity-50">document_scanner</span>
                            <p>Extraction results will appear here</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-outline-variant rounded-xl p-8 shadow-sm flex flex-col h-full">
                            <div className="flex justify-between items-start mb-6 border-b border-outline-variant pb-4">
                                <div>
                                    <h3 className="font-bold text-lg flex items-center gap-2">
                                        <span className="material-symbols-outlined text-secondary">fact_check</span>
                                        Extracted Data
                                    </h3>
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-secondary mt-1">AI-assisted extraction — review required</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] uppercase tracking-widest font-bold opacity-70 block">Confidence</span>
                                    <span className="text-xl font-bold text-primary">{extractedData.confidence || 91}%</span>
                                </div>
                            </div>
                            
                            <p className="text-xs text-on-surface-variant mb-6 bg-surface-container-low p-3 rounded-md border border-outline-variant">
                                <span className="material-symbols-outlined text-[14px] align-middle mr-1">info</span>
                                AI pre-fills these fields. Please review and edit before submitting.
                            </p>

                            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest font-bold opacity-70 block mb-1">Supplier</label>
                                        <input className="w-full text-sm font-bold border border-outline-variant rounded p-2 focus:border-primary focus:ring-1" value={extractedData.supplier_name} onChange={e => handleFieldChange("supplier_name", e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest font-bold opacity-70 block mb-1">Material</label>
                                        <input className="w-full text-sm font-bold border border-outline-variant rounded p-2 focus:border-primary focus:ring-1" value={extractedData.material_name} onChange={e => handleFieldChange("material_name", e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest font-bold opacity-70 block mb-1">Quantity</label>
                                        <div className="flex gap-2">
                                            <input type="number" className="w-2/3 text-sm font-bold border border-outline-variant rounded p-2 focus:border-primary focus:ring-1" value={extractedData.quantity} onChange={e => handleFieldChange("quantity", e.target.value)} />
                                            <input className="w-1/3 text-sm border border-outline-variant rounded p-2 focus:border-primary focus:ring-1" value={extractedData.unit} onChange={e => handleFieldChange("unit", e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest font-bold opacity-70 block mb-1">Batch Reference</label>
                                        <input className="w-full text-sm font-mono border border-outline-variant rounded p-2 focus:border-primary focus:ring-1" value={extractedData.batch_reference} onChange={e => handleFieldChange("batch_reference", e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest font-bold opacity-70 block mb-1">Temperature Req.</label>
                                        <input className="w-full text-sm border border-outline-variant rounded p-2 focus:border-primary focus:ring-1" value={extractedData.temperature_requirement} onChange={e => handleFieldChange("temperature_requirement", e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest font-bold opacity-70 block mb-1">Hazard Class</label>
                                        <select className="w-full text-sm border border-outline-variant rounded p-2 focus:border-primary focus:ring-1" value={extractedData.hazard_class} onChange={e => handleFieldChange("hazard_class", e.target.value)}>
                                            <option value="Normal">Normal</option>
                                            <option value="Flammable">Flammable</option>
                                            <option value="Oxidizer">Oxidizer</option>
                                            <option value="Toxic">Toxic</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => setShowConfirm(true)}
                                disabled={submitting || !hasPermission}
                                className="w-full bg-primary text-on-primary font-bold py-4 rounded-sm text-sm uppercase tracking-widest hover:opacity-90 transition-opacity mt-6 flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                Submit to QC
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal 
                isOpen={showConfirm}
                title="Submit to QC Station?"
                message={`This will register ${extractedData?.quantity} ${extractedData?.unit} of ${extractedData?.material_name} and send it to the QC queue for review.`}
                confirmLabel="Submit to QC"
                onConfirm={handleSubmit}
                onCancel={() => setShowConfirm(false)}
                isLoading={submitting}
            />
        </div>
    );
}
