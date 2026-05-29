"use client";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";

export const PageLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="flex flex-col min-h-screen bg-background text-on-background font-body antialiased">
            <Sidebar />
            <TopBar />
            <main className="flex-1 md:ml-64 p-4 md:p-8 md:w-[calc(100%-16rem)] overflow-x-hidden pb-24 md:pb-8">
                <div className="max-w-[1440px] mx-auto w-full">
                    {children}
                </div>
            </main>
            <MobileNav />
        </div>
    );
};
