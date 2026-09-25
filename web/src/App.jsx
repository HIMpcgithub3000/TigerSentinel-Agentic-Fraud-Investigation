import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { InvestigationProvider } from "@/context/InvestigationContext";
import AppShell from "@/components/AppShell";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Workspace from "@/pages/Workspace";
import GraphExplorer from "@/pages/GraphExplorer";
import EvidenceApproval from "@/pages/EvidenceApproval";
import CaseMemory from "@/pages/CaseMemory";

export default function App() {
    return (
        <InvestigationProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route element={<AppShell />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/workspace" element={<Workspace />} />
                        <Route path="/graph" element={<GraphExplorer />} />
                        <Route path="/evidence" element={<EvidenceApproval />} />
                        <Route path="/memory" element={<CaseMemory />} />
                    </Route>
                </Routes>
                <Toaster position="bottom-right" richColors closeButton />
            </BrowserRouter>
        </InvestigationProvider>
    );
}
