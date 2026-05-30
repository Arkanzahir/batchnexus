import React from "react";

interface AIRecommendationCardProps {
    title: string;
    recommendation: string;
    confidence: number;
    reasonCodes: string[];
    humanReviewNote?: string;
    icon?: string;
}

export const AIRecommendationCard: React.FC<AIRecommendationCardProps> = ({
    title,
    recommendation,
    confidence,
    reasonCodes,
    humanReviewNote,
    icon = "smart_toy"
}) => {
    return (
        <div className="bg-primary-container text-on-primary-container p-5 rounded-xl border border-primary/20 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl"></div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">{icon}</span>
                    <h4 className="font-bold text-sm tracking-wide">{title}</h4>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-widest block opacity-70">Confidence</span>
                    <span className="font-mono font-bold text-primary">{confidence}%</span>
                </div>
            </div>

            <div className="mb-4 relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Recommendation</p>
                <p className="font-bold text-lg">{recommendation}</p>
            </div>

            {reasonCodes.length > 0 && (
                <div className="bg-white/40 p-3 rounded-lg mb-4 relative z-10 backdrop-blur-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-2">Reason Codes</p>
                    <ul className="space-y-1.5">
                        {reasonCodes.map((reason, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs">
                                <span className="material-symbols-outlined text-[14px] text-primary mt-0.5">check_circle</span>
                                {reason}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {humanReviewNote && (
                <div className="flex items-start gap-2 text-[11px] opacity-80 relative z-10 mt-4 border-t border-primary/10 pt-4">
                    <span className="material-symbols-outlined text-[14px]">info</span>
                    <p>{humanReviewNote}</p>
                </div>
            )}
        </div>
    );
};
