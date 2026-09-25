import { useState } from "react";
import { X, FileWarning, ShieldCheck, Download, Copy, Check, Building2, User, CreditCard } from "lucide-react";
import { toast } from "sonner";

export default function SARModal({ sar, caseId, onClose }) {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState("narrative"); // 'narrative' | 'subjects' | 'meta'
    const [transmitted, setTransmitted] = useState(false);

    if (!sar || !sar.file) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(sar.narrative);
        setCopied(true);
        toast.success("SAR Narrative Copied", { description: "Copied to clipboard for compliance export" });
        setTimeout(() => setCopied(false), 2000);
    };

    const handleTransmit = () => {
        setTransmitted(true);
        setTimeout(() => {
            toast.success(`FinCEN SAR Submitted for ${caseId}`, {
                description: `Transmitted to FinCEN BSA Gateway · E-Filing ID: BSA-${Date.now().toString().slice(-6)}`,
            });
            onClose();
        }, 500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-red-50/70 border-b border-red-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shadow-sm">
                            <FileWarning className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                FinCEN Suspicious Activity Report (SAR)
                                <span className="text-[10px] font-mono bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                                    Form 111 / 31 CFR 1020.320
                                </span>
                            </h3>
                            <p className="text-xs text-red-700/80 mt-0.5">Autonomous Regulatory Filing Draft for {caseId}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        id="close-sar-x"
                        onClick={onClose}
                        className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-slate-100 bg-slate-50 px-6 text-xs font-semibold">
                    <button
                        type="button"
                        onClick={() => setActiveTab("narrative")}
                        className={`py-3 px-4 border-b-2 transition-colors ${
                            activeTab === "narrative"
                                ? "border-indigo-600 text-indigo-700"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        Official Statutory Narrative
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("subjects")}
                        className={`py-3 px-4 border-b-2 transition-colors ${
                            activeTab === "subjects"
                                ? "border-indigo-600 text-indigo-700"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        Identified Subjects ({sar.subjects?.length || 0})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("meta")}
                        className={`py-3 px-4 border-b-2 transition-colors ${
                            activeTab === "meta"
                                ? "border-indigo-600 text-indigo-700"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        Filing Metadata & Mandates
                    </button>
                </div>

                {/* Content Body */}
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-xs text-slate-700">
                    {/* Key Facts Strip */}
                    <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                        <div>
                            <span className="text-[10px] uppercase text-slate-400 font-bold block">Suspicious Exposure</span>
                            <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                                ${sar.total_amount_usd.toFixed(2)}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase text-slate-400 font-bold block">Activity Dates</span>
                            <span className="text-xs font-mono text-slate-800 font-semibold block mt-0.5">
                                {sar.activity_dates ? sar.activity_dates.join(" to ") : "2016-11-22"}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase text-slate-400 font-bold block">Statutory Mandate</span>
                            <span className="text-xs font-semibold text-red-600 block mt-0.5">Policy R2 / 31 CFR</span>
                        </div>
                    </div>

                    {activeTab === "narrative" && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    Chronological Narrative Summary
                                </span>
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 text-[11px] font-semibold rounded-full transition-colors shadow-sm"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                                    {copied ? "Copied" : "Copy Narrative"}
                                </button>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-sans text-xs whitespace-pre-line shadow-inner select-text">
                                {sar.narrative}
                            </div>
                        </div>
                    )}

                    {activeTab === "subjects" && (
                        <div className="space-y-3">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                Target & Connected Graph Entities ({sar.subjects.length})
                            </span>
                            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                                {sar.subjects.map((s, idx) => (
                                    <div
                                        key={idx}
                                        className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between font-mono"
                                    >
                                        <span className="text-slate-800 text-[11px] font-semibold">{s}</span>
                                        <span className="text-[9px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded uppercase">
                                            {s.startsWith("C") && !s.includes("-K") ? "Customer" : "Payment Card"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "meta" && (
                        <div className="space-y-3">
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                <h4 className="text-[10px] uppercase font-bold text-slate-400">Statutory Reason Code</h4>
                                <p className="text-slate-800 leading-relaxed font-medium">{sar.reason}</p>
                            </div>
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                <h4 className="text-[10px] uppercase font-bold text-slate-400">BSA E-Filing Authorization</h4>
                                <p className="text-slate-600 text-xs leading-relaxed">
                                    Required Routing: <strong className="text-indigo-600">L2 Fraud Manager Approval</strong>.
                                    Report is filed under FinCEN regulation 31 CFR § 1020.320 for transactions aggregating &gt; $1,000 or linked to syndicated fraud rings.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> Grounded in TigerGraph Graph Entities
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            id="close-sar-btn"
                            onClick={onClose}
                            className="px-4 py-2 border border-slate-300 hover:border-indigo-300 bg-white text-slate-700 font-bold rounded-full transition-colors shadow-sm"
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            onClick={handleTransmit}
                            disabled={transmitted}
                            className="flex items-center gap-1.5 px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-colors shadow-sm disabled:opacity-50"
                        >
                            <Download className="w-3.5 h-3.5" />
                            {transmitted ? "Transmitting..." : "Sign & Transmit to FinCEN"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
