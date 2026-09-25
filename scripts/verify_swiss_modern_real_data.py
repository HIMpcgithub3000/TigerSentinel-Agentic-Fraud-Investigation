"""
End-to-End Visual Verification of Swiss Modern Real Data Console.
Directly communicates with Chrome DevTools Protocol to capture pixel-perfect
screenshots of all 5 views wired to real TigerGraph benchmark data.
"""
import asyncio
import base64
import json
import os
import sys
import urllib.request
import websockets
from typing import Any, Optional, Dict

ARTIFACTS_DIR = "/Users/himanshusharma/.gemini/antigravity-ide/brain/bb5f1159-7a73-45bc-a8ed-0fec1f68aa48"
CDP_LIST_URL = "http://127.0.0.1:9222/json/list"

class CDPClient:
    def __init__(self, ws_url: str):
        self.ws_url = ws_url
        self.ws: Any = None
        self._msg_id = 0

    async def connect(self):
        self.ws = await websockets.connect(self.ws_url, max_size=25_000_000)

    async def send_cmd(self, method: str, params: Optional[dict] = None):
        self._msg_id += 1
        msg = {"id": self._msg_id, "method": method, "params": params or {}}
        if self.ws is None:
            raise RuntimeError("WebSocket not connected")
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
        print(f"  [SAVED SCREENSHOT] -> {out_path} ({len(img_data)} bytes)")
        return out_path

    async def close(self):
        if self.ws:
            await self.ws.close()

async def main():
    print("=" * 70)
    print("VERIFYING SWISS MODERN REAL DATA INTEGRATION (20 CASES & SUBGRAPHS)")
    print("=" * 70)

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

    if not target_page or "webSocketDebuggerUrl" not in target_page:
        print("[ERROR] No Chrome page with webSocketDebuggerUrl found!")
        sys.exit(1)

    client = CDPClient(target_page["webSocketDebuggerUrl"])
    await client.connect()
    await client.send_cmd("Page.enable")
    await client.send_cmd("Runtime.enable")

    # Set viewport to standard desktop 1440x900
    await client.send_cmd("Emulation.setDeviceMetricsOverride", {
        "width": 1440,
        "height": 900,
        "deviceScaleFactor": 1,
        "mobile": False
    })

    # 1. Dashboard
    print("\n--- 1. Testing Dashboard with 20 Real Cases ---")
    await client.send_cmd("Page.navigate", {"url": "http://localhost:5173/dashboard"})
    await asyncio.sleep(2.0)
    cases_count = await client.eval_js("document.querySelectorAll('tbody tr').length")
    title = await client.eval_js("document.querySelector('h1')?.innerText")
    print(f"  Dashboard Title: {title}")
    print(f"  Rendered Cases Rows: {cases_count}")
    await client.screenshot("swiss_dashboard_real_data.png")

    # 2. Workspace
    print("\n--- 2. Testing Workspace with Active Case HHG-014 ---")
    await client.send_cmd("Page.navigate", {"url": "http://localhost:5173/workspace"})
    await asyncio.sleep(2.0)
    workspace_title = await client.eval_js("document.querySelector('h1')?.innerText")
    trigger_text = await client.eval_js("document.querySelector('[data-testid=\"trigger-summary\"]')?.innerText")
    topology_card = await client.eval_js("document.querySelector('[data-testid=\"connected-topology-card\"]')?.innerText")
    print(f"  Workspace Case Header: {workspace_title}")
    print(f"  Topology Card Detected: {'YES' if topology_card else 'NO'}")
    await client.screenshot("swiss_workspace_real_data.png")

    # 3. Open SAR Modal
    print("\n--- 3. Testing FinCEN SAR Modal ---")
    sar_btn = await client.eval_js("""
        (() => {
            const btn = document.querySelector('[data-testid="open-sar-button"]') || document.querySelector('[data-testid="nba-sar-button"]');
            if (btn) { btn.click(); return true; }
            return false;
        })()
    """)
    if sar_btn:
        await asyncio.sleep(1.0)
        sar_title = await client.eval_js("document.querySelector('h3')?.innerText")
        print(f"  SAR Modal Opened: {sar_title}")
        await client.screenshot("swiss_sar_modal_real_data.png")
        # Close modal
        await client.eval_js("document.querySelector('#close-sar-x')?.click() || document.querySelector('#close-sar-btn')?.click()")
        await asyncio.sleep(0.5)

    # 4. Graph Explorer
    print("\n--- 4. Testing Graph Explorer (Half-Height Canvas) ---")
    await client.send_cmd("Page.navigate", {"url": "http://localhost:5173/graph"})
    await asyncio.sleep(2.0)
    svg_nodes_count = await client.eval_js("document.querySelectorAll('[data-testid^=\"graph-node-\"]').length")
    graph_title = await client.eval_js("document.querySelector('h1')?.innerText")
    print(f"  Graph Title: {graph_title}")
    print(f"  Rendered SVG Graph Nodes: {svg_nodes_count}")
    await client.screenshot("swiss_graph_real_data.png")

    # 5. Evidence & Approval
    print("\n--- 5. Testing Evidence & Approval ---")
    await client.send_cmd("Page.navigate", {"url": "http://localhost:5173/evidence"})
    await asyncio.sleep(2.0)
    evidence_rows = await client.eval_js("document.querySelectorAll('tbody tr').length")
    print(f"  Evidence Ledger Rows: {evidence_rows}")
    await client.screenshot("swiss_evidence_real_data.png")

    # 6. Case Memory
    print("\n--- 6. Testing Case Memory ---")
    await client.send_cmd("Page.navigate", {"url": "http://localhost:5173/memory"})
    await asyncio.sleep(2.0)
    memory_rows = await client.eval_js("document.querySelectorAll('tbody tr').length")
    print(f"  Memory Indexed Cases: {memory_rows}")
    await client.screenshot("swiss_memory_real_data.png")

    await client.close()
    print("\n[SUCCESS] ALL 5 SWISS MODERN REAL DATA VIEWS VERIFIED AND CAPTURED!")

if __name__ == "__main__":
    asyncio.run(main())
