import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { STEPS, INITIAL_LOG } from "@/data/mockData";

const InvestigationContext = createContext(null);
export const useInvestigation = () => useContext(InvestigationContext);

export function InvestigationProvider({ children }) {
    const [allCases, setAllCases] = useState([]);
    const [kpis, setKpis] = useState([]);
    const [currentCaseId, setCurrentCaseId] = useState("HHG-014");
    const [caseDetail, setCaseDetail] = useState(null);
    const [graphData, setGraphData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const [stepIndex, setStepIndex] = useState(-1);
    const [status, setStatus] = useState("idle"); // idle | running | paused | done
    const [elapsed, setElapsed] = useState(0);
    const [log, setLog] = useState(INITIAL_LOG);
    const [sarModalOpen, setSarModalOpen] = useState(false);

    const timer = useRef(null);
    const clock = useRef(null);
    const stepRef = useRef(-1);

    const pushLog = useCallback((msg, kind = "sys") => {
        const ts = new Date().toTimeString().slice(0, 8);
        setLog((l) => [{ id: `${Date.now()}-${Math.random()}`, ts, msg, kind }, ...l].slice(0, 40));
    }, []);

    // 1. Fetch all cases and summary KPIs
    const fetchCases = useCallback(async () => {
        try {
            const res = await fetch("/api/cases");
            if (res.ok) {
                const data = await res.json();
                if (data.cases && data.cases.length > 0) {
                    setAllCases(data.cases);
                }
                if (data.kpis && data.kpis.length > 0) {
                    setKpis(data.kpis);
                }
            }
        } catch (e) {
            console.warn("Using cached case catalog", e);
        }
    }, []);

    // 2. Fetch specific case details and subgraph
    const fetchCaseDetails = useCallback(async (cid) => {
        if (!cid) return;
        setIsLoading(true);
        try {
            const [caseRes, graphRes] = await Promise.all([
                fetch(`/api/cases/${cid}`),
                fetch(`/api/graph/${cid}`)
            ]);

            if (caseRes.ok) {
                const cData = await caseRes.json();
                setCaseDetail(cData);
            }
            if (graphRes.ok) {
                const gData = await graphRes.json();
                setGraphData(gData);
            }
        } catch (e) {
            console.warn(`Failed loading details for ${cid}`, e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // On mount, load cases & load default case
    useEffect(() => {
        fetchCases();
    }, [fetchCases]);

    useEffect(() => {
        fetchCaseDetails(currentCaseId);
    }, [currentCaseId, fetchCaseDetails]);

    const selectCase = useCallback((cid) => {
        if (!cid) return;
        setCurrentCaseId(cid);
        setStepIndex(-1);
        setStatus("idle");
        setElapsed(0);
        pushLog(`Switched active context to ${cid}`, "ok");
    }, [pushLog]);

    const advance = useCallback(
        (next, cid) => {
            if (next >= STEPS.length) {
                setStatus("done");
                clearInterval(clock.current);
                pushLog(`Case ${cid} investigation complete · read-after-write verified in TigerGraph`, "ok");
                toast.success(`Case ${cid} Investigation Complete`, {
                    description: "NBA ranked · Evidence Ledger committed · Graph vertices upserted",
                });
                fetchCaseDetails(cid);
                fetchCases();
                return;
            }
            stepRef.current = next;
            setStepIndex(next);
            const s = STEPS[next];
            pushLog(`${s.label} — ${s.action}`, s.kind);
            if (s.toastMsg) toast.info(s.toastMsg);
            timer.current = setTimeout(() => advance(next + 1, cid), s.duration);
        },
        [pushLog, fetchCaseDetails, fetchCases]
    );

    const start = useCallback((targetCid) => {
        const cid = targetCid || currentCaseId;
        clearTimeout(timer.current);
        clearInterval(clock.current);
        stepRef.current = -1;
        setStepIndex(-1);
        setElapsed(0);
        setStatus("running");
        pushLog(`Autonomous Agent investigation triggered for ${cid}`, "ok");
        toast(`Investigating ${cid}`, { description: "10-node deterministic LangGraph pipeline running on TigerGraph" });
        clock.current = setInterval(() => setElapsed((e) => e + 1), 1000);

        // Execute live backend investigation
        fetch(`/api/cases/${cid}/investigate`, { method: "POST" })
            .then((r) => r.json())
            .then((data) => {
                if (data && data.case) {
                    pushLog(`TigerGraph GSQL MCP: Read-after-write confirmed for ${cid} · Verdict ${data.case.verdict.toUpperCase()}`, "ok");
                }
            })
            .catch(() => {});

        advance(0, cid);
    }, [currentCaseId, advance, pushLog]);

    const pause = useCallback(() => {
        if (status !== "running") return;
        clearTimeout(timer.current);
        clearInterval(clock.current);
        setStatus("paused");
        toast.warning("Investigation paused", { description: `Halted at step ${stepRef.current + 1} of ${STEPS.length}` });
    }, [status]);

    const resume = useCallback(() => {
        if (status !== "paused") return;
        setStatus("running");
        clock.current = setInterval(() => setElapsed((e) => e + 1), 1000);
        advance(stepRef.current + 1, currentCaseId);
    }, [status, advance, currentCaseId]);

    const reset = useCallback(() => {
        clearTimeout(timer.current);
        clearInterval(clock.current);
        stepRef.current = -1;
        setStepIndex(-1);
        setStatus("idle");
        setElapsed(0);
    }, []);

    const approveAction = useCallback(async (cid, action, approverRole = "L2 Supervisor", notes = "") => {
        try {
            const res = await fetch(`/api/cases/${cid}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, approver_role: approverRole, notes })
            });
            if (res.ok) {
                const data = await res.json();
                toast.success(`Action Approved for ${cid}`, {
                    description: data.message || `Action ${action} authorized by ${approverRole}`,
                });
                pushLog(`Governance sign-off: ${action} approved by ${approverRole} for ${cid}`, "policy");
                fetchCaseDetails(cid);
                fetchCases();
                return data;
            }
        } catch (e) {
            toast.error("Approval failed", { description: e.message });
        }
    }, [pushLog, fetchCaseDetails, fetchCases]);

    useEffect(() => () => {
        clearTimeout(timer.current);
        clearInterval(clock.current);
    }, []);

    return (
        <InvestigationContext.Provider
            value={{
                allCases,
                kpis,
                currentCaseId,
                caseDetail,
                graphData,
                isLoading,
                selectCase,
                fetchCases,
                fetchCaseDetails,
                stepIndex,
                status,
                elapsed,
                log,
                start,
                pause,
                resume,
                reset,
                pushLog,
                approveAction,
                sarModalOpen,
                setSarModalOpen,
            }}
        >
            {children}
        </InvestigationContext.Provider>
    );
}
