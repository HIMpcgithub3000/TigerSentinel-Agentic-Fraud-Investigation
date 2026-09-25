export default function Logo({ compact = false }) {
    return (
        <div className="flex items-center gap-2.5" data-testid="brand-logo">
            <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8 shrink-0">
                <rect width="32" height="32" rx="8" fill="#EEF2FF" />
                <path d="M8 16L16 8L24 16L16 24L8 16Z" stroke="#4F46E5" strokeWidth="2" strokeLinejoin="round" />
                <circle cx="16" cy="16" r="3" fill="#4F46E5" />
                <circle cx="8" cy="16" r="2" fill="#059669" />
                <circle cx="24" cy="16" r="2" fill="#DC2626" />
                <circle cx="16" cy="8" r="2" fill="#D97706" />
                <circle cx="16" cy="24" r="2" fill="#2563EB" />
                <line x1="16" y1="11" x2="16" y2="13" stroke="#4F46E5" strokeWidth="1.5" />
                <line x1="16" y1="19" x2="16" y2="21" stroke="#4F46E5" strokeWidth="1.5" />
                <line x1="10" y1="16" x2="13" y2="16" stroke="#4F46E5" strokeWidth="1.5" />
                <line x1="19" y1="16" x2="22" y2="16" stroke="#4F46E5" strokeWidth="1.5" />
            </svg>
            {!compact && (
                <div className="leading-none">
                    <div className="font-display font-800 text-[15px] font-extrabold tracking-tight text-slate-900">
                        TigerSentinel
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 mt-0.5">
                        Graph-Agentic Counter-Fraud
                    </div>
                </div>
            )}
        </div>
    );
}
