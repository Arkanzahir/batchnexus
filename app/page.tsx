"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchItems } from "@/lib/api/client";

export default function DashboardPage() {
    const [stats, setStats] = useState({ inbound: 0, pendingQc: 0, released: 0, samplesPending: 0 });
    const [recentLots, setRecentLots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetchItems<any>("inbound_receipts", { limit: 100 }),
            fetchItems<any>("lots", { sort: "-date_created", limit: 5 })
        ]).then(([inboundRes, lotsRes]) => {
            const today = new Date().toDateString();
            
            const inboundToday = inboundRes.data.filter((r: any) => 
                new Date(r.date_created).toDateString() === today
            ).length;

            const pendingQc = lotsRes.data.filter((l: any) => l.status === "Pending QC").length;
            const released = lotsRes.data.filter((l: any) => l.status === "QC Released").length;
            const samplesPending = lotsRes.data.filter((l: any) => ["Ready", "Stored", "QC Released"].includes(l.status)).length;

            setStats({
                inbound: inboundToday,
                pendingQc,
                released,
                samplesPending
            });
            setRecentLots(lotsRes.data.slice(0, 5));
            setLoading(false);
        }).catch(err => {
            console.error("Dashboard error", err);
            setLoading(false);
        });
    }, []);

    const getMaterialName = (mat: any) => {
        if (!mat) return "Unknown";
        if (typeof mat === 'object' && mat.name) return mat.name;
        return "Material";
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="font-display font-bold text-3xl text-primary">Operations Control Tower</h2>
                    <p className="text-on-surface-variant mt-1">Real-time visibility from supplier intake to sample dispatch.</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-outline uppercase tracking-widest">Last Sync</p>
                    <p className="text-sm text-on-surface-variant font-bold">Just now</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant shadow-sm flex flex-col justify-between h-40">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Inbound Today</span>
                        <span className="material-symbols-outlined text-primary">local_shipping</span>
                    </div>
                    <div className="mt-auto">
                        <span className="text-4xl font-bold">{loading ? "..." : stats.inbound}</span>
                        <p className="text-xs text-on-surface-variant mt-1">Shipments arrived</p>
                    </div>
                </div>
                <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant shadow-sm flex flex-col justify-between h-40">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Pending QC</span>
                        <span className="material-symbols-outlined text-secondary">science</span>
                    </div>
                    <div className="mt-auto">
                        <span className="text-4xl font-bold">{loading ? "..." : stats.pendingQc}</span>
                        <div className="w-full bg-outline-variant h-1 mt-2 rounded-full overflow-hidden">
                            <div className="bg-secondary h-full" style={{ width: `${Math.min((stats.pendingQc / 10) * 100, 100)}%` }}></div>
                        </div>
                    </div>
                </div>
                <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant shadow-sm flex flex-col justify-between h-40">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Released Lots</span>
                        <span className="material-symbols-outlined text-secondary">verified</span>
                    </div>
                    <div className="mt-auto">
                        <span className="text-4xl font-bold">{loading ? "..." : stats.released}</span>
                        <p className="text-xs text-primary flex items-center mt-1"><span className="material-symbols-outlined text-sm mr-1">arrow_upward</span> Trending up</p>
                    </div>
                </div>
                <div className="bg-error-container/20 rounded-xl p-6 border border-error/20 shadow-sm flex flex-col justify-between h-40">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-on-error-container uppercase tracking-wider">Warehouse Alerts</span>
                        <span className="material-symbols-outlined text-error icon-fill">warning</span>
                    </div>
                    <div className="mt-auto">
                        <span className="text-4xl font-bold text-error">1</span>
                        <p className="text-xs text-on-error-container mt-1">Temp variance in FRZ-C</p>
                    </div>
                </div>
                <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant shadow-sm flex flex-col justify-between h-40">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Samples Pending</span>
                        <span className="material-symbols-outlined text-outline">send</span>
                    </div>
                    <div className="mt-auto">
                        <span className="text-4xl font-bold">{loading ? "..." : stats.samplesPending}</span>
                        <p className="text-xs text-on-surface-variant mt-1">Available to dispatch</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
                        <h3 className="text-lg font-bold mb-6">Today's Material Flow</h3>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {[
                                { time: "08:00 AM", event: "Supplier Delivery", details: "Bergamot & Lavender", active: false },
                                { time: "09:30 AM", event: "QC Intake Scan", details: "Lab B", active: true },
                                { time: "11:00 AM", event: "Transfer", details: "Pending Clearance", active: false }
                            ].map((step, idx) => (
                                <div key={idx} className={`min-w-[180px] p-4 rounded-lg border ${step.active ? 'bg-primary/5 border-primary/30' : 'bg-surface-container-low border-outline-variant'}`}>
                                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">{step.time}</span>
                                    <p className={`font-bold ${step.active ? 'text-primary' : ''}`}>{step.event}</p>
                                    <p className="text-xs text-outline mt-1">{step.details}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-outline-variant overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                            <h3 className="font-bold">Recent Lots Activity</h3>
                            <Link href="/qc" className="text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:underline">View All <span className="material-symbols-outlined text-sm">arrow_forward</span></Link>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-surface-container-low text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-3">Material</th>
                                    <th className="px-6 py-3">Lot ID</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-outline-variant/30">
                                {loading ? (
                                    <tr><td colSpan={3} className="px-6 py-8 text-center text-outline">Loading records...</td></tr>
                                ) : recentLots.map(lot => (
                                    <tr key={lot.id}>
                                        <td className="px-6 py-4 font-bold">{getMaterialName(lot.material_id)}</td>
                                        <td className="px-6 py-4 text-outline font-mono">{lot.lot_number || lot.id.substring(0,8)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-sm uppercase ${
                                                lot.status === 'QC Released' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 
                                                lot.status === 'Pending QC' ? 'bg-surface-variant text-on-surface-variant' : 
                                                'bg-primary text-on-primary'
                                            }`}>
                                                {lot.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="bg-surface-container-low rounded-xl p-6 border border-primary/20 shadow-sm flex flex-col relative overflow-hidden">
                        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded bg-primary text-on-primary flex items-center justify-center">
                                <span className="material-symbols-outlined">smart_toy</span>
                            </div>
                            <h3 className="font-bold text-primary">AI Insight</h3>
                        </div>
                        <p className="text-sm text-on-surface-variant mb-6 font-bold bg-primary/5 p-3 border border-primary/20 rounded-sm italic">"AI detected 2 high-priority QC checks needed today for inbound batches."</p>
                        <button className="w-full text-left bg-white px-4 py-3 rounded-lg border border-outline-variant hover:border-primary transition-all flex justify-between items-center group">
                            <span className="text-sm font-bold group-hover:text-primary transition-colors">Review Suggestions</span>
                            <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">arrow_forward</span>
                        </button>
                    </div>
                    <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
                        <h3 className="font-bold mb-4">Recent Audit Events</h3>
                        <div className="space-y-4">
                            <div className="flex gap-4 border-b border-outline-variant/30 pb-4">
                                <span className="material-symbols-outlined text-outline">edit_document</span>
                                <div>
                                    <p className="text-sm font-bold">Inbound Received</p>
                                    <p className="text-xs text-on-surface-variant">System Admin • Just now</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <span className="material-symbols-outlined text-outline">verified_user</span>
                                <div>
                                    <p className="text-sm font-bold">QC Station Update</p>
                                    <p className="text-xs text-on-surface-variant">Elena Dragan • 1h ago</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
