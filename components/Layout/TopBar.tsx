"use client";

import { useState, useRef, useEffect } from "react";
import { useMantineColorScheme } from "@mantine/core";
import { notifications as mantineNotifications } from "@mantine/notifications";

import { ROLES, useRole, UserRole } from "@/lib/rbac";


const NOTIFICATIONS = [
    { id: 1, icon: "warning", color: "text-amber-600", title: "QC Alert", message: "LOT-2026-050 failed odor deviation check", time: "5 min ago", unread: true },
    { id: 2, icon: "check_circle", color: "text-green-600", title: "Slotting Complete", message: "LOT-2026-049 stored in HAZ-D-04", time: "12 min ago", unread: true },
    { id: 3, icon: "local_shipping", color: "text-blue-600", title: "New Inbound", message: "500 kg Clove Bud Oil from KTA Ponorogo", time: "1 hr ago", unread: false },
    { id: 4, icon: "smart_toy", color: "text-purple-600", title: "AI Report Ready", message: "Daily summary has been generated", time: "2 hr ago", unread: false },
];

export const TopBar = () => {
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();
    const isDark = colorScheme === "dark";

    const { role: activeRole, changeRole } = useRole();
    const [showRoleMenu, setShowRoleMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [notifications, setNotifications] = useState(NOTIFICATIONS);

    const roleRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => n.unread).length;

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (roleRef.current && !roleRef.current.contains(e.target as Node)) setShowRoleMenu(false);
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
            if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setShowSettings(false);
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
        mantineNotifications.show({
            title: "Notifications Cleared",
            message: "All notifications have been marked as read.",
            color: "green"
        });
    };

    const handleRoleChange = (roleId: string) => {
        changeRole(roleId as UserRole);
        setShowRoleMenu(false);
        mantineNotifications.show({
            title: "Role Switched",
            message: `You are now viewing the app as ${ROLES.find(r => r.id === roleId)?.label}.`,
            color: "indigo"
        });
    };

    const handleLogout = () => {
        mantineNotifications.show({
            title: "Logging Out...",
            message: "You have been securely signed out.",
            color: "red"
        });
        setShowProfile(false);
    };

    const currentRole = ROLES.find(r => r.id === activeRole) || ROLES[0];

    const closeAll = () => {
        setShowRoleMenu(false);
        setShowNotifications(false);
        setShowSettings(false);
        setShowProfile(false);
    };

    return (
        <header className="bg-surface shadow-sm sticky top-0 z-30 h-16 flex justify-between items-center px-4 md:px-8 md:ml-64 w-full md:w-[calc(100%-16rem)]">
            <div className="flex items-center flex-1">
                <div className="relative w-full max-w-md hidden md:block">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant text-sm">search</span>
                    <input className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary focus:bg-surface transition-colors" placeholder="Search orders, lots, or materials..." type="text"/>
                </div>
                <div className="md:hidden font-bold text-xl text-primary">BatchNexus</div>
            </div>
            <div className="flex items-center space-x-3">
                {/* Role Switcher */}
                <div className="relative" ref={roleRef}>
                    <button 
                        onClick={() => { const s = !showRoleMenu; closeAll(); setShowRoleMenu(s); }}
                        className="hidden md:flex items-center text-on-surface-variant text-xs font-bold px-3 py-1.5 border border-outline-variant rounded-sm hover:bg-surface-container-highest transition-colors uppercase tracking-wider"
                    >
                        <span className="material-symbols-outlined mr-1 text-sm icon-fill text-primary">{currentRole.icon}</span>
                        {currentRole.label}
                        <span className="material-symbols-outlined ml-1 text-sm">arrow_drop_down</span>
                    </button>
                    {showRoleMenu && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-outline-variant overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant">
                                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Switch Demo Role</p>
                            </div>
                            {ROLES.map(role => (
                                <button 
                                    key={role.id}
                                    onClick={() => handleRoleChange(role.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                                        activeRole === role.id 
                                        ? "bg-primary/5 text-primary" 
                                        : "hover:bg-surface-container-high text-on-surface"
                                    }`}
                                >
                                    <span className={`material-symbols-outlined ${activeRole === role.id ? 'icon-fill' : ''}`}>{role.icon}</span>
                                    <div>
                                        <p className="text-sm font-bold">{role.label}</p>
                                        <p className="text-[10px] text-on-surface-variant">{role.desc}</p>
                                    </div>
                                    {activeRole === role.id && <span className="material-symbols-outlined ml-auto text-primary icon-fill text-sm">check_circle</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <button 
                        onClick={() => { const s = !showNotifications; closeAll(); setShowNotifications(s); }}
                        className="text-on-surface-variant hover:bg-surface-container-highest p-2 rounded-full transition-colors relative"
                    >
                        <span className="material-symbols-outlined">notifications</span>
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{unreadCount}</span>
                        )}
                    </button>
                    {showNotifications && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-outline-variant overflow-hidden animate-in fade-in duration-200">
                            <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
                                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Notifications</p>
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} className="text-[10px] text-primary font-bold uppercase tracking-widest hover:underline">Mark all read</button>
                                )}
                            </div>
                            <div className="max-h-72 overflow-y-auto">
                                {notifications.map(n => (
                                    <div key={n.id} className={`flex items-start gap-3 px-4 py-3 border-b border-outline-variant/50 last:border-0 ${n.unread ? 'bg-primary/3' : ''}`}>
                                        <span className={`material-symbols-outlined icon-fill mt-0.5 ${n.color}`}>{n.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs ${n.unread ? 'font-bold text-on-surface' : 'text-on-surface-variant'}`}>{n.title}</p>
                                            <p className="text-xs text-on-surface-variant truncate">{n.message}</p>
                                            <p className="text-[10px] text-outline mt-0.5">{n.time}</p>
                                        </div>
                                        {n.unread && <span className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0"></span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Settings */}
                <div className="relative" ref={settingsRef}>
                    <button 
                        onClick={() => { const s = !showSettings; closeAll(); setShowSettings(s); }}
                        className="text-on-surface-variant hover:bg-surface-container-highest p-2 rounded-full transition-colors hidden sm:block"
                    >
                        <span className="material-symbols-outlined">settings</span>
                    </button>
                    {showSettings && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-outline-variant overflow-hidden animate-in fade-in duration-200">
                            <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant">
                                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Settings</p>
                            </div>
                            <div className="p-2">
                                <button onClick={() => toggleColorScheme()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container-high text-left transition-colors">
                                    <span className="material-symbols-outlined text-on-surface-variant">{isDark ? 'light_mode' : 'dark_mode'}</span>
                                    <span className="text-sm text-on-surface">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                                    <span className={`ml-auto text-[10px] ${isDark ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'} px-2 py-0.5 rounded-full font-bold`}>{isDark ? 'ON' : 'OFF'}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Avatar */}
                <div className="relative" ref={profileRef}>
                    <img 
                        onClick={() => { const s = !showProfile; closeAll(); setShowProfile(s); }}
                        className="w-8 h-8 rounded-full border border-outline-variant ml-3 object-cover cursor-pointer hover:ring-2 hover:ring-primary transition-all" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfpHts9W-80oknBSkpHStx9N5WIZdKleiqw-Ny0vlh1C00prgjseUL2EnyIKIUJw52wyyMqy6EogiEPtKdvt37mPXoQAXkVFox2x1s_2jKoAURdiMh-FVfQ1jnVh54IqXp8AoVVnMpXc19twG6Y72alROnkcgQY-MlhmsNSsx8EkmFMGpTqdggMFujTBsa6RnReEC0LUCEuRmjsHL2KotJUc0ISl-_DHKfl9hAeLV5dpSy_cxJRRFTi-u9TNQhblFf-MyjmEM_IUho" 
                        alt="User"
                    />
                    
                    {showProfile && (
                        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-outline-variant overflow-hidden animate-in fade-in duration-200">
                            <div className="px-5 py-4 border-b border-outline-variant bg-surface-container-low flex flex-col items-center justify-center text-center">
                                <img className="w-16 h-16 rounded-full border-2 border-primary object-cover mb-3" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfpHts9W-80oknBSkpHStx9N5WIZdKleiqw-Ny0vlh1C00prgjseUL2EnyIKIUJw52wyyMqy6EogiEPtKdvt37mPXoQAXkVFox2x1s_2jKoAURdiMh-FVfQ1jnVh54IqXp8AoVVnMpXc19twG6Y72alROnkcgQY-MlhmsNSsx8EkmFMGpTqdggMFujTBsa6RnReEC0LUCEuRmjsHL2KotJUc0ISl-_DHKfl9hAeLV5dpSy_cxJRRFTi-u9TNQhblFf-MyjmEM_IUho" alt="User Avatar"/>
                                <h3 className="font-bold text-on-surface text-base">Nadia Kusuma</h3>
                                <p className="text-xs text-on-surface-variant font-medium mt-0.5">nadia.kusuma@sima-arome.com</p>
                                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider">
                                    <span className="material-symbols-outlined text-sm icon-fill">{currentRole.icon}</span>
                                    {currentRole.label}
                                </div>
                            </div>
                            <div className="p-2">
                                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 text-left transition-colors group">
                                    <span className="material-symbols-outlined text-red-500 text-sm group-hover:text-red-600">logout</span>
                                    <span className="text-sm text-red-500 font-medium group-hover:text-red-600">Sign Out</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
