"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchItems, createItem } from "@/lib/api/client";

interface ExtractedData {
    material_name: string;
    supplier_name: string;
    quantity: number;
    unit: string;
    batch_reference: string;
    hazard_class: string;
    temperature_requirement: string;
}

export default function InboundNewPage() {
    const router = useRouter();
    const [textInput, setTextInput] = useState("");
    const [extracting, setExtracting] = useState(false);
    const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
    const [submitting, setSubmitting] = useState(false);

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

    const handleSubmit = async () => {
        if (!extractedData) return;
        setSubmitting(true);
        try {
            // Find fuzzy matches for supplier and material IDs
            const matchedSupplier = suppliers.find(s => s.name.toLowerCase().includes(extractedData.supplier_name.toLowerCase().split(' ')[0])) || suppliers[0];
            const matchedMaterial = materials.find(m => m.name.toLowerCase().includes(extractedData.material_name.toLowerCase().split(' ')[0])) || materials[0];

            await createItem("inbound_receipts", {
                quantity: extractedData.quantity,
                unit: extractedData.unit,
                batch_reference: extractedData.batch_reference,
                temperature_requirement: extractedData.temperature_requirement,
                hazard_class: extractedData.hazard_class,
                status: "Pending QC",
                arrival_date: new Date().toISOString().split('T')[0],
                supplier_id: matchedSupplier?.id,
                material_id: matchedMaterial?.id
            });

            alert("✅ Receipt submitted to QC!");
            router.push("/inbound");
        } catch (err) {
            console.error("Submit failed", err);
            alert("❌ Failed to submit to DaaS.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="font-display font-bold text-3xl text-primary">Document Intake</h2>
                <p className="text-on-surface-variant mt-1">Paste delivery manifest text. Groq AI will extract key data instantly.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex flex-col gap-6">
                    <div className="bg-white border-2 border-dashed border-outline-variant rounded-xl p-8 flex flex-col shadow-sm focus-within:border-primary transition-colors h-[500px]">
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">description</span>
                            Raw Manifest Text
                        </h3>
                        <p className="text-sm text-on-surface-variant mb-4">Paste the supplier WhatsApp message or email text here.</p>
                        
                        <textarea 
                            className="flex-1 w-full border border-outline-variant bg-surface-container-highest rounded-sm p-4 text-sm focus:ring-primary focus:border-primary mb-4"
                            placeholder="Example: Tolong catat kedatangan Minyak Cengkeh 500kg dari KTA Ponorogo..."
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                        />

                        <button 
                            onClick={handleExtract}
                            disabled={!textInput || extracting}
                            className="bg-primary text-on-primary px-6 py-3 rounded-sm text-xs font-bold uppercase tracking-widest shadow-sm w-full hover:opacity-90 disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {extracting ? (
                                <><span className="material-symbols-outlined animate-spin text-sm">sync</span> Extracting...</>
                            ) : (
                                <><span className="material-symbols-outlined text-sm">smart_toy</span> AI Extract</>
                            )}
                        </button>
                    </div>
                </div>

                <div className="bg-white border border-outline-variant rounded-xl p-8 flex flex-col shadow-sm h-[500px]">
                    <div className="flex justify-between items-start mb-8 pb-4 border-b border-outline-variant">
                        <div>
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <span className="material-symbols-outlined text-tertiary">smart_toy</span>
                                AI Extracted Data
                            </h3>
                            <p className="text-sm text-on-surface-variant">Review extracted fields.</p>
                        </div>
                        {extractedData && <span className="bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest">Auto-Verified</span>}
                    </div>

                    {extractedData ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 overflow-y-auto pr-2">
                                <div className="bg-surface-container-low p-4 rounded-sm border-l-4 border-primary">
                                    <span className="text-[10px] font-bold text-outline uppercase tracking-widest block mb-1">Supplier</span>
                                    <p className="font-bold">{extractedData.supplier_name}</p>
                                </div>
                                <div className="bg-surface-container-low p-4 rounded-sm border-l-4 border-tertiary">
                                    <span className="text-[10px] font-bold text-outline uppercase tracking-widest block mb-1">Material</span>
                                    <p className="font-bold">{extractedData.material_name}</p>
                                </div>
                                <div className="bg-surface-container-low p-4 rounded-sm border-l-4 border-outline">
                                    <span className="text-[10px] font-bold text-outline uppercase tracking-widest block mb-1">Quantity</span>
                                    <p className="font-bold">{extractedData.quantity} {extractedData.unit}</p>
                                </div>
                                <div className="bg-surface-container-low p-4 rounded-sm border-l-4 border-secondary">
                                    <span className="text-[10px] font-bold text-outline uppercase tracking-widest block mb-1">Temp Req</span>
                                    <p className="font-bold">{extractedData.temperature_requirement}</p>
                                </div>
                                <div className={`col-span-1 sm:grid-cols-2 sm:col-span-2 p-4 rounded-sm border-l-4 flex items-center gap-4 ${extractedData.hazard_class === 'Flammable' ? 'bg-error-container/20 border-error' : 'bg-surface-container-low border-outline'}`}>
                                    <span className={`material-symbols-outlined ${extractedData.hazard_class === 'Flammable' ? 'text-error' : 'text-outline'}`}>
                                        {extractedData.hazard_class === 'Flammable' ? 'warning' : 'info'}
                                    </span>
                                    <div>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${extractedData.hazard_class === 'Flammable' ? 'text-error' : 'text-outline'}`}>Hazard Class</span>
                                        <p className={`font-bold ${extractedData.hazard_class === 'Flammable' ? 'text-on-error-container' : ''}`}>{extractedData.hazard_class}</p>
                                    </div>
                                </div>
                                <div className="bg-surface-container-low p-4 rounded-sm border-l-4 border-outline col-span-1 sm:col-span-2">
                                    <span className="text-[10px] font-bold text-outline uppercase tracking-widest block mb-1">Generated Batch Ref</span>
                                    <p className="font-bold">{extractedData.batch_reference}</p>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-outline-variant flex justify-end gap-4">
                                <button 
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="bg-primary w-full text-on-primary px-8 py-3 rounded-sm text-xs font-bold uppercase tracking-widest shadow-sm hover:opacity-90 disabled:opacity-50"
                                >
                                    {submitting ? "Submitting..." : "Submit to QC"}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant opacity-60">
                            <span className="material-symbols-outlined text-6xl mb-4">document_scanner</span>
                            <p>Awaiting extraction...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
