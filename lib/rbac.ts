"use client";
import { useState, useEffect } from "react";

export type UserRole = 
  | "Receiving Operator" 
  | "QC Staff" 
  | "PPIC Planner" 
  | "Warehouse Admin" 
  | "Operations Manager" 
  | "Customer Service"
  | "Admin";

export const ROLES: { id: UserRole; label: string; icon: string; desc: string }[] = [
    { id: "Admin", label: "Admin", icon: "admin_panel_settings", desc: "Superuser fallback" },
    { id: "Receiving Operator", label: "Receiving Operator", icon: "inventory", desc: "Inbound & document intake" },
    { id: "QC Staff", label: "QC Staff", icon: "biotech", desc: "Quality assurance" },
    { id: "PPIC Planner", label: "PPIC Planner", icon: "calendar_month", desc: "Production scheduling" },
    { id: "Warehouse Admin", label: "Warehouse Admin", icon: "warehouse", desc: "Inventory & slotting" },
    { id: "Operations Manager", label: "Operations Manager", icon: "manage_accounts", desc: "Audit & oversight" },
    { id: "Customer Service", label: "Customer Service", icon: "support_agent", desc: "View-only dispatch" },
];

export function useRole() {
    const [role, setRole] = useState<UserRole>("Admin");

    useEffect(() => {
        const saved = localStorage.getItem("batchnexus_role") as UserRole;
        if (saved && ROLES.find(r => r.id === saved)) {
            setRole(saved);
        }
    }, []);

    const changeRole = (newRole: UserRole) => {
        setRole(newRole);
        localStorage.setItem("batchnexus_role", newRole);
        window.dispatchEvent(new Event("roleChange"));
    };

    // Re-sync if other components change it
    useEffect(() => {
        const handleSync = () => {
            const saved = localStorage.getItem("batchnexus_role") as UserRole;
            if (saved && saved !== role) setRole(saved);
        };
        window.addEventListener("roleChange", handleSync);
        return () => window.removeEventListener("roleChange", handleSync);
    }, [role]);

    return { role, changeRole };
}

export function canCreateReceipt(role: UserRole | string): boolean {
    return ["Receiving Operator", "Operations Manager", "Admin"].includes(role);
}

export function canSubmitToQC(role: UserRole | string): boolean {
    return ["Receiving Operator", "Operations Manager", "Admin"].includes(role);
}

export function canApproveQC(role: UserRole | string): boolean {
    return ["QC Staff", "Operations Manager", "Admin"].includes(role);
}

export function canAssignSlot(role: UserRole | string): boolean {
    return ["Warehouse Admin", "Operations Manager", "Admin"].includes(role);
}

export function canMarkReadyForProduction(role: UserRole | string): boolean {
    return ["PPIC Planner", "Operations Manager", "Admin"].includes(role);
}

export function canGenerateSummary(role: UserRole | string): boolean {
    return ["Operations Manager", "Admin"].includes(role);
}

export function canExportTrace(role: UserRole | string): boolean {
    return ["Operations Manager", "Admin"].includes(role);
}

export function canViewAudit(role: UserRole | string): boolean {
    return ["Operations Manager", "Admin"].includes(role);
}
