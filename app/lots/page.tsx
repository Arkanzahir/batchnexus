"use client";
import { useEffect, useState } from "react";
import { fetchItems } from "@/lib/api/client";

interface LotData {
    id: string;
    lot_number: string;
    quantity: number;
    status: string;
    date_created: string;
    material: { name: string; type: string };
    receipt: { arrival_date: string };
    qc: { date_created: string; human_decision: string };
    move: { date_created: string; to_bin: string } | null;
}

export default function LotsPage() {
    const [lots, setLots] = useState<LotData[]>([]);
    const [activeLot, setActiveLot] = useState<LotData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch all lots with related receipt and material manually merged
        Promise.all([
            fetchItems<any>("lots", { sort: "-date_created", limit: 10 }),
            fetchItems<any>("materials", {}),
            fetchItems<any>("inbound_receipts", {})
        ]).then(async ([lotsRes, matRes, recRes]) => {
            const materials = new Map(matRes.data.map((m: any) => [m.id, m]));
            const receipts = new Map(recRes.data.map((r: any) => [r.id, r]));
            const lotRecords = lotsRes.data;
            const enhancedLots: LotData[] = [];

            // For each lot, fetch its QC inspection and Inventory Move to build the trace
            for (const lot of lotRecords) {
                const material = materials.get(lot.material_id) || {};
                const receipt = receipts.get(lot.receipt_id) || {};
                
                const qcRes = await fetchItems<any>("qc_inspections", {
                    filter: { receipt_id: { _eq: receipt.id || lot.receipt_id } }
                });
                const moveRes = await fetchItems<any>("inventory_moves", {
                    filter: { lot_id: { _eq: lot.id } },
                    sort: "-date_created",
                    limit: 1
                });
                let toBinName = "Unknown Bin";
                if (moveRes.data.length > 0) {
                     const binRes = await fetchItems<any>("warehouse_bins", {
                         filter: { id: { _eq: moveRes.data[0].to_bin_id } }
                     });
                     if (binRes.data.length > 0) toBinName = binRes.data[0].name;
                }

                enhancedLots.push({
                    id: lot.id,
                    lot_number: lot.lot_number,
                    quantity: lot.quantity,
                    status: lot.status,
                    date_created: lot.date_created,
                    material: {
                        name: material.name || "Unknown Material",
                        type: material.type || "Unknown"
                    },
                    receipt: {
                        arrival_date: receipt.arrival_date || lot.date_created
                    },
                    qc: {
                        date_created: qcRes.data[0]?.date_created || lot.date_created,
                        human_decision: qcRes.data[0]?.human_decision || "QC Released"
                    },
                    move: moveRes.data.length > 0 ? {
                        date_created: moveRes.data[0].date_created,
                        to_bin: toBinName
                    } : null
                });
            }

            setLots(enhancedLots);
            if (enhancedLots.length > 0) setActiveLot(enhancedLots[0]);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32 text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin mr-3 text-3xl">sync</span>
                Loading Traceability Timeline from DaaS...
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex justify-between items-end border-b border-outline-variant pb-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest">End-to-End Trace</span>
                        <span className="text-xs text-secondary flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">cloud_done</span> Live from DaaS
                        </span>
                    </div>
                    <h2 className="font-display font-bold text-3xl text-on-surface">Lot Traceability Timeline</h2>
                    <p className="text-on-surface-variant mt-1">
                        {activeLot ? `${activeLot.lot_number} — ${activeLot.material.name}` : "No lots available"}
                    </p>
                </div>
                <div className="flex gap-4">
                    {lots.length > 1 && (
                        <select 
                            className="bg-white border-outline-variant rounded-sm text-xs font-bold px-4 py-2"
                            onChange={(e) => setActiveLot(lots.find(l => l.id === e.target.value) || null)}
                            value={activeLot?.id || ""}
                        >
                            {lots.map(l => (
                                <option key={l.id} value={l.id}>{l.lot_number}</option>
                            ))}
                        </select>
                    )}
                    <button className="bg-primary text-on-primary font-bold py-2 px-6 rounded-sm text-xs uppercase tracking-widest">Export Trace Report</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 bg-white border border-outline-variant rounded-xl p-8 shadow-sm">
                    <div className="flex gap-8 border-b border-outline-variant mb-8">
                        <button className="pb-4 font-bold border-b-2 border-primary text-primary">Traceability</button>
                        <button className="pb-4 font-bold text-outline hover:text-primary">Overview</button>
                        <button className="pb-4 font-bold text-outline hover:text-primary">QC Data</button>
                        <button className="pb-4 font-bold text-outline hover:text-primary">Audit Log</button>
                    </div>

                    {activeLot ? (
                        <div className="relative pl-16 space-y-12">
                            <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-outline-variant"></div>
                            
                            {/* Intake Node */}
                            <div className="relative flex gap-4">
                                <div className="absolute left-[-52px] w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10 bg-surface-container-highest text-on-surface-variant">
                                    <span className="material-symbols-outlined text-sm">local_shipping</span>
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-4">
                                        <h4 className="font-bold text-on-surface">Inbound Receipt Arrived</h4>
                                        <span className="text-[10px] text-outline font-bold uppercase tracking-widest">
                                            {new Date(activeLot.receipt.arrival_date).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-on-surface-variant mt-1">Material staged for QC</p>
                                </div>
                            </div>

                            {/* QC Node */}
                            <div className="relative flex gap-4">
                                <div className="absolute left-[-52px] w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10 bg-surface-container-highest text-on-surface-variant">
                                    <span className="material-symbols-outlined text-sm">smart_toy</span>
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-4">
                                        <h4 className="font-bold text-on-surface">AI QC Scoring & Human Review</h4>
                                        <span className="text-[10px] text-outline font-bold uppercase tracking-widest">
                                            {new Date(activeLot.qc.date_created).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-on-surface-variant mt-1">Decision: {activeLot.qc.human_decision}</p>
                                </div>
                            </div>

                            {/* Lot Issue Node */}
                            <div className="relative flex gap-4">
                                <div className={`absolute left-[-52px] w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10 ${!activeLot.move ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                                    <span className="material-symbols-outlined text-sm">inventory_2</span>
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-4">
                                        <h4 className="font-bold text-on-surface">Lot Number Issued</h4>
                                        <span className="text-[10px] text-outline font-bold uppercase tracking-widest">
                                            {new Date(activeLot.date_created).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-on-surface-variant mt-1">System generated {activeLot.lot_number}</p>
                                </div>
                            </div>

                            {/* Slot Node */}
                            {activeLot.move && (
                                <div className="relative flex gap-4">
                                    <div className="absolute left-[-52px] w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10 bg-secondary text-on-secondary">
                                        <span className="material-symbols-outlined text-sm">warehouse</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-4">
                                            <h4 className="font-bold text-secondary text-lg">Warehouse Slot Assigned</h4>
                                            <span className="text-[10px] text-outline font-bold uppercase tracking-widest">
                                                {new Date(activeLot.move.date_created).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-on-surface-variant mt-1">Smart slot recommendation accepted: {activeLot.move.to_bin}</p>
                                    </div>
                                </div>
                            )}

                        </div>
                    ) : (
                        <p className="text-on-surface-variant text-sm">No trace data available.</p>
                    )}
                </div>

                <div className="lg:col-span-4 flex flex-col gap-6">
                    {activeLot && (
                        <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
                            <h3 className="font-bold text-lg mb-6">Lot Summary</h3>
                            <div className="space-y-4 divide-y divide-outline-variant/30">
                                <div className="flex justify-between py-2"><span className="text-xs text-outline font-bold">Material</span><span className="text-xs font-bold">{activeLot.material.name}</span></div>
                                <div className="flex justify-between py-2"><span className="text-xs text-outline font-bold">QC Decision</span><span className="text-[10px] font-bold bg-primary-container text-on-primary-container px-2 py-0.5 rounded-sm uppercase">{activeLot.qc.human_decision}</span></div>
                                <div className="flex justify-between py-2"><span className="text-xs text-outline font-bold">Location</span><span className="text-xs font-bold">{activeLot.move ? activeLot.move.to_bin : "Pending Slotting"}</span></div>
                                <div className="flex justify-between py-2"><span className="text-xs text-outline font-bold">Quantity</span><span className="text-xs font-bold">{activeLot.quantity} kg</span></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
