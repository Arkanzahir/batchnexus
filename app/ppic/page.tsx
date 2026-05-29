export default function PPICPage() {
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

            <div className="flex overflow-x-auto gap-6 pb-6 h-[600px] items-start">
                {[
                    { label: "Awaiting QC", color: "bg-outline", count: 2, items: [
                        { lot: "SYN-44-IES", material: "Iso E Super", qty: "500kg", priority: "Low", date: "Oct 24" },
                        { lot: "TUR-12-ROS", material: "Rose Otto", qty: "10kg", priority: "High", date: "Oct 25" }
                    ]},
                    { label: "QC Released", color: "bg-secondary", count: 1, items: [
                        { lot: "BGR-24-LVA", material: "Lavender Abs", qty: "150kg", priority: "High", date: "Oct 24" }
                    ]},
                    { label: "Ready", color: "bg-primary", count: 1, items: [
                        { lot: "IND-99-SAN", material: "Sandalwood Oil", qty: "25.5kg", priority: "Med", date: "Oct 24" }
                    ]},
                    { label: "Blocked", color: "bg-error", count: 0, items: [] }
                ].map((col, idx) => (
                    <div key={idx} className="flex-shrink-0 w-80 flex flex-col bg-surface-container-low rounded-xl border border-outline-variant h-full overflow-hidden">
                        <div className="p-4 border-b border-outline-variant flex items-center justify-between sticky top-0 bg-surface-container-low z-10">
                            <h3 className="font-bold text-sm flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${col.color}`}></span>
                                {col.label}
                            </h3>
                            <span className="bg-surface-container-highest px-2 py-0.5 rounded-full text-[10px] font-bold text-on-surface-variant">{col.count}</span>
                        </div>
                        <div className="p-4 space-y-4 overflow-y-auto">
                            {col.items.length > 0 ? col.items.map((item, i) => (
                                <div key={i} className="bg-white rounded-lg border border-outline-variant p-4 shadow-sm hover:border-primary transition-colors cursor-grab">
                                    <div className="flex justify-between mb-3">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest ${item.priority === 'High' ? 'bg-error-container text-on-error-container' : 'bg-surface-variant'}`}>{item.priority}</span>
                                    </div>
                                    <p className="font-bold text-sm">{item.material}</p>
                                    <p className="text-xs text-outline font-mono mt-1">{item.lot}</p>
                                    <div className="mt-4 pt-4 border-t border-outline-variant/30 flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                                        <span>Qty: {item.qty}</span>
                                        <span>Req: {item.date}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center justify-center py-12 text-outline-variant">
                                    <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                                    <p className="text-xs">No items</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
