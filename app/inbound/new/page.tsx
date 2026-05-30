"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchItems, createItem } from "@/lib/api/client";
import { useRole, canSubmitToQC } from "@/lib/rbac";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

export default function InboundNewPage() {
    const router = useRouter();
    const { role } = useRole();
    const [textInput, setTextInput] = useState("");
    const [extracting, setExtracting] = useState(false);
    const [extractedData, setExtractedData] = useState<any | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Validation state for material/supplier lookup
    const [validation, setValidation] = useState<{
        materialFound: boolean | null;
        supplierFound: boolean | null;
        materialMatch: string | null;
        supplierMatch: string | null;
        checking: boolean;
    }>({ materialFound: null, supplierFound: null, materialMatch: null, supplierMatch: null, checking: false });

    // Validate extracted data against DaaS master data
    const validateAgainstDaaS = async (extracted: any) => {
        setValidation(prev => ({ ...prev, checking: true }));
        try {
            const [materialsRes, suppliersRes] = await Promise.all([
                fetchItems<any>("materials"),
                fetchItems<any>("suppliers"),
            ]);

            let materialFound = false;
            let supplierFound = false;
            let materialMatch: string | null = null;
            let supplierMatch: string | null = null;

            if (extracted.material_name && materialsRes.data) {
                const matName = extracted.material_name.toLowerCase();
                const match = materialsRes.data.find((m: any) =>
                    m.name?.toLowerCase().includes(matName) || matName.includes(m.name?.toLowerCase())
                );
                materialFound = !!match;
                materialMatch = match?.name || null;
            }

            if (extracted.supplier_name && suppliersRes.data) {
                const supName = extracted.supplier_name.toLowerCase();
                const match = suppliersRes.data.find((s: any) =>
                    s.name?.toLowerCase().includes(supName) || supName.includes(s.name?.toLowerCase())
                );
                supplierFound = !!match;
                supplierMatch = match?.name || null;
            }

            setValidation({ materialFound, supplierFound, materialMatch, supplierMatch, checking: false });
        } catch (err) {
            console.warn("Validation lookup failed:", err);
            setValidation({ materialFound: null, supplierFound: null, materialMatch: null, supplierMatch: null, checking: false });
        }
    };

    const handleExtract = async () => {
        if (!textInput) return;
        setExtracting(true);
        setExtractedData(null);
        setValidation({ materialFound: null, supplierFound: null, materialMatch: null, supplierMatch: null, checking: false });
        try {
            const res = await fetch("/api/ai/extract-manifest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: textInput })
            });
            const data = await res.json();
            if (data.data) {
                setExtractedData(data.data);
                // Immediately validate against DaaS
                validateAgainstDaaS(data.data);
            }
        } catch (error) {
            console.error("Extraction error", error);
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
            // Lookup material_id and supplier_id from DaaS reference tables
            let material_id: string | null = null;
            let supplier_id: string | null = null;

            try {
                const [materialsRes, suppliersRes] = await Promise.all([
                    fetchItems<any>("materials"),
                    fetchItems<any>("suppliers"),
                ]);

                // Fuzzy match material name
                if (extractedData.material_name && materialsRes.data) {
                    const matName = extractedData.material_name.toLowerCase();
                    const match = materialsRes.data.find((m: any) => 
                        m.name?.toLowerCase().includes(matName) || matName.includes(m.name?.toLowerCase())
                    );
                    if (match) material_id = match.id;
                }

                // Fuzzy match supplier name
                if (extractedData.supplier_name && suppliersRes.data) {
                    const supName = extractedData.supplier_name.toLowerCase();
                    const match = suppliersRes.data.find((s: any) => 
                        s.name?.toLowerCase().includes(supName) || supName.includes(s.name?.toLowerCase())
                    );
                    if (match) supplier_id = match.id;
                }
            } catch (lookupErr) {
                console.warn("Lookup failed, submitting without relations:", lookupErr);
            }

            await createItem("inbound_receipts", {
                quantity: Number(extractedData.quantity),
                unit: extractedData.unit,
                batch_reference: extractedData.batch_reference,
                temperature_requirement: extractedData.temperature_requirement,
                hazard_class: extractedData.hazard_class,
                status: "Pending QC",
                arrival_date: extractedData.arrival_date || new Date().toISOString().split('T')[0],
                ...(material_id && { material_id }),
                ...(supplier_id && { supplier_id }),
            });

            // Audit log is tracked automatically by DaaS Activity

            setShowConfirm(false);
            router.push("/inbound");
        } catch (err) {
            console.error("Submit failed", err);
        } finally {
            setSubmitting(false);
        }
    };

    const hasPermission = canSubmitToQC(role);

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="font-display font-bold text-3xl text-primary">AI Inbound Intake</h2>
                <p className="text-on-surface-variant mt-1">Paste delivery manifest text. AI will extract key data instantly.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Input */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white border-2 border-dashed border-outline-variant rounded-xl p-8 flex flex-col shadow-sm focus-within:border-primary transition-colors">
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">description</span>
                            Raw Manifest Text
                        </h3>
                        <p className="text-sm text-on-surface-variant mb-4">Paste the supplier WhatsApp message or email text here. Supports Indonesian and English.</p>

                        <textarea
                            className="flex-1 min-h-[200px] bg-surface-container-lowest border border-outline-variant rounded-lg resize-none focus:ring-1 focus:ring-primary p-4 text-sm font-mono text-on-surface"
                            placeholder={"Contoh:\n• tolong catat 400kg cengkeh dari madura\n• Supplier: Java Citrus Farm, Material: Citrus Peel Extract, Quantity: 12 drums\n• 200L lavender oil from Bali Essential Co."}
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
                        <p className="text-xs text-error text-center">Your current role does not have permission for this action.</p>
                    )}
                </div>

                {/* Right: Output */}
                <div className="flex flex-col gap-6">
                    {!extractedData ? (
                        <div className="bg-surface-container-low border border-outline-variant rounded-xl flex items-center justify-center min-h-[350px] text-on-surface-variant flex-col gap-4">
                            <span className="material-symbols-outlined text-5xl opacity-50">document_scanner</span>
                            <p>Extraction results will appear here</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-outline-variant rounded-xl p-8 shadow-sm flex flex-col">
                            <div className="flex justify-between items-start mb-6 border-b border-outline-variant pb-4">
                                <div>
                                    <h3 className="font-bold text-lg flex items-center gap-2">
                                        <span className="material-symbols-outlined text-secondary">fact_check</span>
                                        Extracted Data
                                    </h3>
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-secondary mt-1">AI-assisted — review & edit before submit</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] uppercase tracking-widest font-bold opacity-70 block">Confidence</span>
                                    <span className="text-xl font-bold text-primary">{extractedData.confidence || 80}%</span>
                                </div>
                            </div>

                            {extractedData.fields_needing_review?.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg mb-4 flex items-start gap-2 text-xs">
                                    <span className="material-symbols-outlined text-[16px]">warning</span>
                                    <div>
                                        <span className="font-bold">Review needed: </span>
                                        {extractedData.fields_needing_review.join(", ")} could not be fully extracted.
                                    </div>
                                </div>
                            )}

                            {/* DaaS Master Data Validation */}
                            {validation.checking ? (
                                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg mb-4 flex items-center gap-2 text-xs">
                                    <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                                    <span className="font-bold">Validating against Central ERP Database...</span>
                                </div>
                            ) : (validation.materialFound !== null || validation.supplierFound !== null) && (
                                <div className="space-y-2 mb-4">
                                    {/* Material Validation */}
                                    {validation.materialFound === true ? (
                                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg flex items-center gap-2 text-xs">
                                            <span className="material-symbols-outlined text-[16px]">verified</span>
                                            <div>
                                                <span className="font-bold">Material Verified: </span>
                                                &quot;{extractedData.material_name}&quot; matched to registered material <span className="font-bold">{validation.materialMatch}</span> in Central Database.
                                            </div>
                                        </div>
                                    ) : validation.materialFound === false ? (
                                        <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded-lg flex items-center gap-2 text-xs">
                                            <span className="material-symbols-outlined text-[16px]">gpp_maybe</span>
                                            <div>
                                                <span className="font-bold">⚠ Unregistered Material: </span>
                                                &quot;{extractedData.material_name}&quot; is <span className="font-bold underline">NOT found</span> in Central ERP Database. This material may be unauthorized or illegal. Contact Management before proceeding.
                                            </div>
                                        </div>
                                    ) : null}

                                    {/* Supplier Validation */}
                                    {validation.supplierFound === true ? (
                                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg flex items-center gap-2 text-xs">
                                            <span className="material-symbols-outlined text-[16px]">verified</span>
                                            <div>
                                                <span className="font-bold">Supplier Verified: </span>
                                                &quot;{extractedData.supplier_name}&quot; matched to registered supplier <span className="font-bold">{validation.supplierMatch}</span>.
                                            </div>
                                        </div>
                                    ) : validation.supplierFound === false ? (
                                        <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded-lg flex items-center gap-2 text-xs">
                                            <span className="material-symbols-outlined text-[16px]">gpp_maybe</span>
                                            <div>
                                                <span className="font-bold">⚠ Unregistered Supplier: </span>
                                                &quot;{extractedData.supplier_name}&quot; is <span className="font-bold underline">NOT found</span> in Central ERP Database. This supplier may be unauthorized.
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            )}

                            <p className="text-xs text-on-surface-variant mb-4 bg-surface-container-low p-3 rounded-md border border-outline-variant">
                                <span className="material-symbols-outlined text-[14px] align-middle mr-1">info</span>
                                AI pre-fills these fields. Please review and edit before submitting.
                            </p>

                            <div className="space-y-4 flex-1">
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
                                <span className="material-symbols-outlined">send</span>
                                Submit to QC
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={showConfirm}
                title="Submit to QC Station?"
                message={`This will register ${extractedData?.quantity} ${extractedData?.unit} of ${extractedData?.material_name} from ${extractedData?.supplier_name} and send it to the QC queue for review.`}
                confirmLabel="Submit to QC"
                onConfirm={handleSubmit}
                onCancel={() => setShowConfirm(false)}
                isLoading={submitting}
            />
        </div>
    );
}
