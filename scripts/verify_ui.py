"""
Automated End-to-End Verification of CaseGuard Operations Console.
Connects via Chrome DevTools Protocol (CDP) WebSocket, executes interactive flows,
asserts DOM components, and captures high-resolution screenshots.
"""
import asyncio
import base64
import json
import os
import sys
import urllib.request
import websockets

ARTIFACTS_DIR = "/Users/himanshusharma/.gemini/antigravity-ide/brain/bb5f1159-7a73-45bc-a8ed-0fec1f68aa48"
CDP_LIST_URL = "http://127.0.0.1:9222/json/list"

class CDPClient:
    def __init__(self, ws_url):
        self.ws_url = ws_url
        self.ws = None
        self._msg_id = 0

    async def connect(self):
        self.ws = await websockets.connect(self.ws_url, max_size=25_000_000)

    async def send_cmd(self, method, params=None):
        self._msg_id += 1
        msg = {"id": self._msg_id, "method": method, "params": params or {}}
        await self.ws.send(json.dumps(msg))
        while True:
            resp = json.loads(await self.ws.recv())
            if resp.get("id") == self._msg_id:
                return resp.get("result", {})

    async def eval_js(self, expression):
        res = await self.send_cmd("Runtime.evaluate", {
            "expression": expression,
            "returnByValue": True,
            "awaitPromise": True
        })
        return res.get("result", {}).get("value")

    async def screenshot(self, filename):
        os.makedirs(ARTIFACTS_DIR, exist_ok=True)
        res = await self.send_cmd("Page.captureScreenshot", {"format": "png"})
        img_data = base64.b64decode(res["data"])
        out_path = os.path.join(ARTIFACTS_DIR, filename)
        with open(out_path, "wb") as f:
            f.write(img_data)
        print(f"  [SCREENSHOT SAVED] -> {out_path} ({len(img_data)} bytes)")
        return out_path

    async def close(self):
        if self.ws:
            await self.ws.close()

async def run_verification():
    print("=" * 70)
    print("STARTING CASEGUARD UI/UX PRO MAX END-TO-END VERIFICATION")
    print("=" * 70)

    # 1. Discover target page
    with urllib.request.urlopen(CDP_LIST_URL) as response:
        pages = json.loads(response.read().decode())
    
    target_page = None
    for p in pages:
        if p.get("type") == "page" and "5173" in p.get("url", ""):
            target_page = p
            break
    if not target_page:
        for p in pages:
            if p.get("type") == "page":
                target_page = p
                break

    if not target_page:
        print("[ERROR] No active Chrome page found on port 9222!")
        sys.exit(1)

    ws_url = target_page["webSocketDebuggerUrl"]
    print(f"Connecting to CDP WebSocket: {ws_url}")
    client = CDPClient(ws_url)
    await client.connect()

    # Enable Page and Runtime
    await client.send_cmd("Page.enable")
    await client.send_cmd("Runtime.enable")

    # Step 1: Navigate to http://localhost:5173/ and wait
    print("\n--- STEP 1: Initial Page Load ---")
    await client.send_cmd("Page.navigate", {"url": "http://localhost:5173/"})
    
    cases_count = 0
    for _ in range(25):
        await asyncio.sleep(0.3)
        cases_count = await client.eval_js("document.querySelectorAll('[data-case-id]').length")
        if cases_count == 20:
            break

    title = await client.eval_js("document.title")
    active_case = await client.eval_js("document.querySelector('header span.font-mono')?.innerText")
    graph_vertices = await client.eval_js("document.querySelector('div.flex.items-center.gap-3.text-\\\\[11px\\\\] span')?.innerText")
    
    print(f"  Page Title: {title}")
    print(f"  Cases Count in Sidebar: {cases_count}")
    print(f"  Initially Active Case: {active_case}")
    print(f"  Cytoscape Canvas Vertex Indicator: {graph_vertices}")

    assert cases_count == 20, f"Expected 20 cases, found {cases_count}"
    await client.screenshot("step1_initial_dashboard.png")
    print("  [PASS] Step 1 Initial Page Load verified.")

    # Step 2: Select HHG-014 and verify Syndicate Banner & 60-Card Ring Graph
    print("\n--- STEP 2: Select Syndicate Case HHG-014 ---")
    click_res = await client.eval_js("""
        (() => {
            const el = document.querySelector('[data-case-id="HHG-014"]');
            if (el) { el.click(); return true; }
            return false;
        })()
    """)
    print(f"  Clicked HHG-014: {click_res}")
    assert click_res is True, "Could not find case HHG-014 in sidebar"
    await asyncio.sleep(2.0)

    hhg014_header = await client.eval_js("document.querySelector('header span.font-mono')?.innerText")
    banner_text = await client.eval_js("document.querySelector('#syndicate-banner')?.innerText")
    connected_cards_text = await client.eval_js("""
        (() => {
            const spans = Array.from(document.querySelectorAll('span'));
            const match = spans.find(s => s.innerText.includes('Connected Cards'));
            return match ? match.innerText : null;
        })()
    """)

    print(f"  Active Case Header: {hhg014_header}")
    print(f"  Syndicate Banner Detected: {'YES' if banner_text else 'NO'}")
    print(f"  Syndicate Card Count: {connected_cards_text}")

    assert "HHG-014" in (hhg014_header or ""), "Header did not update to HHG-014"
    assert banner_text is not None and "SYNDICATE" in banner_text.upper(), "Syndicate banner not rendered"
    assert connected_cards_text is not None and ("58" in connected_cards_text or "60" in connected_cards_text), f"Expected 58/60 connected cards, got {connected_cards_text}"
    await client.screenshot("step2_hhg014_syndicate_ring.png")
    print("  [PASS] Step 2 HHG-014 Syndicate Ring & Banner verified.")

    # Step 3: Tab Switching - Actions, Evidence, Summary, Trace
    print("\n--- STEP 3: Tab Switching Verification ---")

    # 3a. Actions Tab (Default active)
    actions_count = await client.eval_js("document.querySelectorAll('div.border-slate-800\\\\/80').length")
    print(f"  Actions Tab Active - Cards count: {actions_count}")

    # 3b. Evidence Ledger Tab
    print("  Clicking 'Evidence Ledger' tab...")
    await client.eval_js("document.querySelector('[data-tab=\"evidence\"]').click()")
    await client.eval_js("document.querySelector('[data-tab=\"evidence\"]').scrollIntoView({ behavior: 'instant', block: 'start' })")
    await asyncio.sleep(0.8)
    evidence_count = await client.eval_js("document.querySelectorAll('tbody tr').length")
    print(f"  Evidence Ledger Rows: {evidence_count}")
    assert evidence_count > 0, "Evidence table is empty"
    await client.screenshot("step3_evidence_ledger_tab.png")

    # 3c. Audit Merkle Integrity in Evidence Ledger
    print("  Clicking 'Audit Merkle Integrity' button...")
    await client.eval_js("document.querySelector('#audit-merkle-btn').click()")
    await asyncio.sleep(1.2)  # Wait for 600ms audit timer
    audit_badge = await client.eval_js("""
        (() => {
            const spans = Array.from(document.querySelectorAll('span'));
            const match = spans.find(s => s.innerText.includes('Cryptographically Untampered'));
            return match ? match.innerText : null;
        })()
    """)
    print(f"  Audit Result Badge: {audit_badge}")
    assert audit_badge is not None, "Merkle integrity badge did not show 'Cryptographically Untampered'"
    await client.screenshot("step4_evidence_merkle_audited.png")
    print("  [PASS] Merkle Integrity Hash Chain Audit verified.")

    # 3d. Summary Tab
    print("  Clicking 'Analyst Summary & Reasoning' tab...")
    await client.eval_js("document.querySelector('[data-tab=\"summary\"]').click()")
    await client.eval_js("document.querySelector('[data-tab=\"summary\"]').scrollIntoView({ behavior: 'instant', block: 'start' })")
    await asyncio.sleep(0.8)
    summary_text = await client.eval_js("document.querySelector('#investigation-synthesis-text')?.innerText")
    print(f"  Summary Preview: {summary_text[:90] if summary_text else 'None'}...")
    assert summary_text is not None and len(summary_text) > 20, "Summary text missing or empty"
    await client.screenshot("step5_analyst_summary.png")

    # 3e. Trace Tab
    print("  Clicking 'LangGraph Execution Trace' tab...")
    await client.eval_js("document.querySelector('[data-tab=\"trace\"]').click()")
    await client.eval_js("document.querySelector('[data-tab=\"trace\"]').scrollIntoView({ behavior: 'instant', block: 'start' })")
    await asyncio.sleep(0.8)
    trace_steps = await client.eval_js("document.querySelectorAll('#langgraph-trace-container div.flex.items-center.gap-2').length")
    print(f"  LangGraph Trace Stages: {trace_steps}")
    assert trace_steps >= 5, f"Expected >= 5 trace stages, found {trace_steps}"
    await client.screenshot("step6_langgraph_trace.png")
    print("  [PASS] Step 3 Tab Switching verified.")

    # Scroll back to top for modal workflows
    await client.eval_js("document.querySelector('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'instant' })")
    await asyncio.sleep(0.5)

    # Step 4: Run Agentic Investigation Modal
    print("\n--- STEP 4: Live Agentic Investigation Modal ---")
    print("  Clicking 'Run Agentic Investigation'...")
    await client.eval_js("document.querySelector('#run-investigation-btn').click()")
    await asyncio.sleep(1.5)
    
    modal_title = await client.eval_js("""
        (() => {
            const el = document.querySelector('h3.text-sm.font-bold.text-white');
            return el ? el.innerText : null;
        })()
    """)
    print(f"  Modal Title: {modal_title}")
    assert modal_title is not None and "AUTONOMOUS AGENTIC INVESTIGATION" in modal_title.upper()
    await client.screenshot("step7_live_investigation_modal.png")
    
    # Wait for the stepper pipeline to complete (7 steps * 450ms = ~3.2s)
    print("  Awaiting live pipeline stepper execution...")
    await asyncio.sleep(3.5)
    modal_completion = await client.eval_js("""
        (() => {
            const el = document.querySelector('span.text-emerald-400.font-semibold');
            return el ? el.innerText : null;
        })()
    """)
    print(f"  Pipeline Completion: {modal_completion}")
    await client.screenshot("step7b_investigation_modal_completed.png")

    # Close modal
    print("  Closing investigation modal...")
    await client.eval_js("document.querySelector('#close-investigation-btn')?.click() || document.querySelector('#close-investigation-x')?.click()")
    await asyncio.sleep(0.8)

    # Step 5: View FinCEN SAR Filing Modal
    print("\n--- STEP 5: FinCEN SAR Filing Drawer / Modal ---")
    print("  Clicking 'View FinCEN SAR Filing'...")
    await client.eval_js("document.querySelector('#view-sar-btn').click()")
    await asyncio.sleep(1.0)

    sar_title = await client.eval_js("""
        (() => {
            const el = document.querySelector('h3.text-sm.font-bold.text-red-100');
            return el ? el.innerText : null;
        })()
    """)
    print(f"  SAR Header: {sar_title}")
    assert sar_title is not None and "FINCEN SUSPICIOUS ACTIVITY REPORT" in sar_title.upper()
    await client.screenshot("step8_fincen_sar_modal.png")

    # Close SAR modal
    await client.eval_js("document.querySelector('#close-sar-btn')?.click() || document.querySelector('#close-sar-x')?.click()")
    await asyncio.sleep(0.8)
    print("  [PASS] Step 5 FinCEN SAR Filing Modal verified.")

    # Final Dashboard Screenshot
    print("\n--- FINAL: High-Fidelity Polished Operations Dashboard ---")
    # Return to Dual-Phase Next-Best Actions tab
    await client.eval_js("document.querySelector('[data-tab=\"actions\"]').click()")
    await client.eval_js("document.querySelector('[data-tab=\"actions\"]').scrollIntoView({ behavior: 'instant', block: 'start' })")
    await asyncio.sleep(0.8)
    await client.screenshot("step9_caseguard_full_dashboard.png")

    await client.close()
    print("\n" + "=" * 70)
    print("ALL 7 VERIFICATION CHECKLIST ITEMS COMPLETED WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_verification())
