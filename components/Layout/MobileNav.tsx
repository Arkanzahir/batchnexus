"use client";

import { usePathname, useRouter } from "next/navigation";

export const MobileNav = () => {
    const router = useRouter();
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path;

    return (
        <nav className="fixed bottom-0 left-0 w-full md:hidden flex justify-around items-center py-3 bg-surface-container-high border-t border-outline-variant z-50 rounded-t-xl ambient-shadow">
            <button onClick={() => router.push("/")} className={`flex flex-col items-center gap-1 ${isActive("/") ? "text-primary" : "text-on-surface-variant"}`}>
                <span className={`material-symbols-outlined ${isActive("/") ? 'icon-fill' : ''}`}>dashboard</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter">Dash</span>
            </button>
            <button onClick={() => router.push("/inbound")} className={`flex flex-col items-center gap-1 ${isActive("/inbound") ? "text-primary" : "text-on-surface-variant"}`}>
                <span className={`material-symbols-outlined ${isActive("/inbound") ? 'icon-fill' : ''}`}>input</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter">Inbound</span>
            </button>
            <button onClick={() => router.push("/qc")} className={`flex flex-col items-center gap-1 ${isActive("/qc") ? "text-primary" : "text-on-surface-variant"}`}>
                <span className={`material-symbols-outlined ${isActive("/qc") ? 'icon-fill' : ''}`}>biotech</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter">QC</span>
            </button>
            <button onClick={() => router.push("/warehouse")} className={`flex flex-col items-center gap-1 ${isActive("/warehouse") ? "text-primary" : "text-on-surface-variant"}`}>
                <span className={`material-symbols-outlined ${isActive("/warehouse") ? 'icon-fill' : ''}`}>warehouse</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter">Whouse</span>
            </button>
            <button onClick={() => router.push("/copilot")} className={`flex flex-col items-center gap-1 ${isActive("/copilot") ? "text-primary" : "text-on-surface-variant"}`}>
                <span className={`material-symbols-outlined ${isActive("/copilot") ? 'icon-fill' : ''}`}>smart_toy</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter">Copilot</span>
            </button>
        </nav>
    );
};
