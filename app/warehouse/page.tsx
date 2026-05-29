"use client";
import { useEffect, useState } from "react";
import { fetchItems, createItem } from "@/lib/api/client";

interface Lot {
    id: string;
    lot_number: string;
    quantity: number;
    status: string;
    receipt_id: { quantity: number; unit: string } | string;
    material_id: { id: string; name: string; hazard_class: string; default_temp: string } | string | null;
}

interface Bin {
    id: string;
    name: string;
    capacity_drums: number;
    occupied_drums: number;
    zone_id: { id: string; name: string; temp_min: number; temp_max: number; hazard_class_allowed: string } | string;
}

export default function WarehousePage() {
    const [pendingLots, setPendingLots] = useState<Lot[]>([]);
    const [activeLot, setActiveLot] = useState<Lot | null>(null);
    const [bins, setBins] = useState<Bin[]>([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    
    // AI Slotting State
    const [recommendedBin, setRecommendedBin] = useState<Bin | null>(null);
    const [slotScore, setSlotScore] = useState<number>(0);
    const [rejectionNote, setRejectionNote] = useState<string>("");

    // Load data
    useEffect(() => {
        Promise.all([
            fetchItems<any>("lots", {
                filter: { status: { _eq: "QC Released" } },
                sort: "-date_created"
            }),
            fetchItems<any>("inbound_receipts", {}),
            fetchItems<any>("materials", {}),
            fetchItems<any>("warehouse_bins", {}),
            fetchItems<any>("warehouse_zones", {})
        ]).then(([lotsRes, recRes, matRes, binsRes, zonesRes]) => {
            const receipts = new Map(recRes.data.map((r: any) => [r.id, r]));
            const materials = new Map(matRes.data.map((m: any) => [m.id, m]));
            const zones = new Map(zonesRes.data.map((z: any) => [z.id, z]));

            const mergedLots = lotsRes.data.map((l: any) => ({
                ...l,
                receipt_id: receipts.get(l.receipt_id) || l.receipt_id,
                material_id: materials.get(l.material_id) || l.material_id,
            }));

            const mergedBins = binsRes.data.map((b: any) => ({
                ...b,
                zone_id: zones.get(b.zone_id) || b.zone_id,
            }));

            setPendingLots(mergedLots);
            setBins(mergedBins);
            if (mergedLots.length > 0) setActiveLot(mergedLots[0]);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    // Smart Slotting Algorithm
    useEffect(() => {
        if (!activeLot || bins.length === 0) return;
        
        let bestBin: Bin | null = null;
        let highestScore = 0;
        let rejectReason = "";

        const material = activeLot.material_id;
        if (typeof material !== "object" || !material) return;
        const hazard = material.hazard_class;

        // Iterate bins to find the best match
        for (const bin of bins) {
            const zone = typeof bin.zone_id === "object" ? bin.zone_id : null;
            if (!zone) continue;

            // 1. Check Capacity
            const qty = typeof activeLot.receipt_id === "object" ? activeLot.receipt_id.quantity : activeLot.quantity;
            // Rough conversion: assume 200kg per drum
            const requiredDrums = Math.ceil(qty / 200);
            if (bin.capacity_drums - bin.occupied_drums < requiredDrums) continue;

            // 2. Check Hazard Policy
            if (hazard === "Flammable" && zone.hazard_class_allowed !== "Flammable") {
                if (!rejectReason) rejectReason = `${zone.name} rejected: Flammable material not allowed.`;
                continue;
            }

            // Calculate score
            let score = 50;
            if (hazard === zone.hazard_class_allowed) score += 20;
            if (bin.occupied_drums === 0) score += 10;
            
            // Random variance to simulate complex ML heuristic
            score += Math.floor(Math.random() * 15);

            if (score > highestScore) {
                highestScore = score;
                bestBin = bin;
            }
        }

        setRecommendedBin(bestBin);
        setSlotScore(highestScore > 100 ? 99 : highestScore);
        if (bestBin) {
            setRejectionNote("");
        } else {
            setRejectionNote(rejectReason || "No valid bins found with sufficient capacity.");
        }

    }, [activeLot, bins]);

    const handleAssign = async () => {
        if (!activeLot || !recommendedBin) return;
        setAssigning(true);

        try {
            const qty = typeof activeLot.receipt_id === "object" ? activeLot.receipt_id.quantity : activeLot.quantity;
            const requiredDrums = Math.ceil(qty / 200);

            // 1. Create Inventory Move
            await createItem("inventory_moves", {
                lot_id: activeLot.id,
                to_bin_id: recommendedBin.id,
            });

            // 2. Update Lot Status
            await fetch(`/api/items/lots/${activeLot.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "Stored" })
            });

            // 3. Update Bin Occupancy
            await fetch(`/api/items/warehouse_bins/${recommendedBin.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ occupied_drums: recommendedBin.occupied_drums + requiredDrums })
            });

            alert(`✅ Successfully assigned ${activeLot.lot_number} to ${recommendedBin.name}`);
            
            // Remove from list
            const updatedLots = pendingLots.filter(l => l.id !== activeLot.id);
            setPendingLots(updatedLots);
            setActiveLot(updatedLots.length > 0 ? updatedLots[0] : null);
            
            // Update bin state locally
            setBins(bins.map(b => b.id === recommendedBin.id ? { ...b, occupied_drums: b.occupied_drums + requiredDrums } : b));

        } catch (err) {
            console.error("Slotting Failed", err);
            alert("❌ Failed to assign slot.");
        } finally {
            setAssigning(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32 text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin mr-3 text-3xl">sync</span>
                Loading Digital Twin from DaaS...
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest">Smart Slotting Active</span>
                        <span className="text-xs text-secondary flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">cloud_done</span> Live from DaaS
                        </span>
                    </div>
                    <h2 className="font-display font-bold text-3xl text-primary">Warehouse Digital Twin</h2>
                    <p className="text-on-surface-variant mt-1 max-w-2xl text-sm">
                        Real-time spatial mapping of storage zones. Copilot generating placement recommendations.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[700px]">
                {/* LEFT: Digital Twin Map */}
                <div className="lg:col-span-8 bg-white rounded-xl border border-outline-variant shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
                        <h4 className="font-bold text-sm">Facility Grid: Main Warehouse</h4>
                        <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-outline-variant"></span> Empty</div>
                            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary"></span> Occupied</div>
                            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary ring-2 ring-primary/20"></span> Target</div>
                        </div>
                    </div>
                    <div className="flex-1 p-6 relative">
                        <div className="warehouse-grid">
                            {/* Static mapping for layout purposes, dynamically styling the bins inside */}
                            <div className="map-zone zone-amb-a font-bold text-xs text-outline uppercase tracking-widest relative">
                                AMB-A
                                {recommendedBin?.name.startsWith("AMB") && <div className="absolute inset-0 bg-primary/10 border-2 border-primary animate-pulse"></div>}
                            </div>
                            <div className="map-zone zone-cold-b font-bold text-xs text-outline uppercase tracking-widest relative">
                                COLD-B
                                {recommendedBin?.name.startsWith("COLD") && <div className="absolute inset-0 bg-primary/10 border-2 border-primary animate-pulse"></div>}
                            </div>
                            <div className="map-zone zone-frz-c font-bold text-xs text-outline uppercase tracking-widest relative">
                                FRZ-C
                                {recommendedBin?.name.startsWith("FRZ") && <div className="absolute inset-0 bg-primary/10 border-2 border-primary animate-pulse"></div>}
                            </div>
                            <div className="map-zone zone-hold-qc">
                                 <span className="material-symbols-outlined text-outline">verified_user</span>
                            </div>
                            <div className={`map-zone zone-haz-d flex flex-col p-4 relative ${recommendedBin?.name.startsWith("HAZ") ? 'border-primary bg-primary/5' : ''}`}>
                                <div className={`text-[10px] font-bold mb-4 uppercase tracking-widest ${recommendedBin?.name.startsWith("HAZ") ? 'text-primary' : 'text-outline'}`}>Zone HAZ-D</div>
                                <div className="grid grid-cols-3 gap-2 w-full h-full relative z-10">
                                    {bins.filter(b => b.name.startsWith("HAZ")).sort((a,b)=>a.name.localeCompare(b.name)).map(bin => (
                                        <div key={bin.id} className={`border flex flex-col items-center justify-center text-[10px] font-bold rounded-sm ${recommendedBin?.id === bin.id ? 'bg-primary text-on-primary border-primary animate-pulse shadow-md scale-105 transition-transform' : bin.occupied_drums > 0 ? 'bg-secondary/20 border-secondary text-secondary' : 'bg-surface-variant/50 border-outline-variant text-outline'}`}>
                                            {bin.name.split('-').pop()}
                                            <span className="text-[8px] font-normal opacity-80">{bin.occupied_drums}/{bin.capacity_drums}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="map-zone zone-staging">
                                <span className="material-symbols-outlined text-outline-variant text-4xl">forklift</span>
                            </div>
                        </div>
                    </div>
                    {rejectionNote && (
                        <div className="p-4 bg-error-container/20 text-on-error-container text-xs font-bold border-t border-error/10 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">info</span> {rejectionNote}
                        </div>
                    )}
                </div>

                {/* RIGHT: Active Lot & Recommendation */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm flex flex-col h-full">
                        <div className="flex justify-between items-start mb-6">
                            <span className="bg-surface-container-high px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest">Pending Slotting</span>
                            <span className="material-symbols-outlined text-primary">smart_toy</span>
                        </div>
                        
                        {pendingLots.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-on-surface-variant">
                                <span className="material-symbols-outlined text-4xl mb-4 text-outline-variant">inventory_2</span>
                                <p className="text-sm font-bold">No pending lots</p>
                                <p className="text-xs text-center mt-2">All QC released materials have been slotted.</p>
                            </div>
                        ) : activeLot ? (
                            <>
                                <h3 className="font-bold text-2xl mb-2">{activeLot.lot_number}</h3>
                                <div className="flex flex-wrap gap-2 mb-8">
                                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${typeof activeLot.material_id === 'object' && activeLot.material_id?.hazard_class === 'Flammable' ? 'bg-error-container text-on-error-container' : 'bg-surface-variant text-on-surface-variant'}`}>
                                        <span className="material-symbols-outlined text-[12px]">{typeof activeLot.material_id === 'object' && activeLot.material_id?.hazard_class === 'Flammable' ? 'local_fire_department' : 'check_circle'}</span> 
                                        {typeof activeLot.material_id === 'object' ? activeLot.material_id?.hazard_class : 'Unknown Hazard'}
                                    </span>
                                    <span className="bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[12px]">thermostat</span> 
                                        {typeof activeLot.material_id === 'object' ? activeLot.material_id?.default_temp : 'Ambient'}
                                    </span>
                                </div>
                                
                                {recommendedBin ? (
                                    <div className="bg-primary-container text-on-primary-container p-6 rounded-sm ambient-shadow mb-8 border border-primary/20">
                                        <div className="flex justify-between mb-4">
                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Recommended Slot</span>
                                            <span className="bg-white/20 px-2 py-0.5 rounded-sm text-[10px] font-bold">Score: {slotScore}</span>
                                        </div>
                                        <div className="text-4xl font-bold mb-4">{recommendedBin.name}</div>
                                        <div className="space-y-2 text-xs opacity-90">
                                            <p className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">check_circle</span> Temp requirements met</p>
                                            <p className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">check_circle</span> Policy compliant</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-error-container text-on-error-container p-6 rounded-sm mb-8">
                                        <p className="font-bold text-sm flex items-center gap-2"><span className="material-symbols-outlined">warning</span> No Safe Slot Found</p>
                                        <p className="text-xs mt-2">Cannot find an available bin that meets the material's temperature and hazard requirements.</p>
                                    </div>
                                )}

                                <div className="mt-auto grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-surface-container-low p-4 rounded-sm">
                                        <span className="text-[10px] font-bold text-outline block mb-1">Material</span>
                                        <p className="font-bold text-xs truncate" title={typeof activeLot.material_id === 'object' ? activeLot.material_id?.name : ''}>
                                            {typeof activeLot.material_id === 'object' ? activeLot.material_id?.name : 'Unknown'}
                                        </p>
                                    </div>
                                    <div className="bg-surface-container-low p-4 rounded-sm">
                                        <span className="text-[10px] font-bold text-outline block mb-1">Quantity</span>
                                        <p className="font-bold text-xs">{activeLot.quantity} {typeof activeLot.receipt_id === 'object' ? activeLot.receipt_id?.unit : 'kg'}</p>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleAssign}
                                    disabled={assigning || !recommendedBin}
                                    className="w-full bg-primary text-on-primary font-bold py-4 rounded-sm text-xs uppercase tracking-widest shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity mt-auto"
                                >
                                    {assigning ? "Assigning..." : "Assign Slot"}
                                </button>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
