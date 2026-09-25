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
    print("TESTING DIRECT CASE SELECTION FROM DASHBOARD ROW CLICK")
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
        print("[ERROR] No active Chrome page with webSocketDebuggerUrl found!")
        sys.exit(1)

    client = CDPClient(target_page["webSocketDebuggerUrl"])
    await client.connect()
    await client.send_cmd("Page.enable")
    await client.send_cmd("Runtime.enable")

    # Step 1: Open dashboard
    print("1. Loading Dashboard...")
    await client.send_cmd("Page.navigate", {"url": "http://localhost:5173/dashboard"})
    await asyncio.sleep(2.0)

    # Step 2: Click on case HHG-004 in dashboard table
    print("2. Clicking case row HHG-004...")
    click_success = await client.eval_js("""
        (() => {
            const row = document.querySelector('[data-testid="case-table-row-HHG-004"]');
            if (row) {
                row.click();
                return true;
            }
            return false;
        })()
    """)
    print(f"  Row click executed: {click_success}")
    assert click_success, "Could not find row for HHG-004"

    # Step 3: Wait for Workspace transition
    await asyncio.sleep(2.0)
    current_url = await client.eval_js("window.location.href")
    workspace_case_header = await client.eval_js("document.querySelector('h1')?.innerText")
    selector_text = await client.eval_js("document.querySelector('[data-testid=\"case-selector-trigger\"]')?.innerText")

    print(f"  Current URL: {current_url}")
    print(f"  Workspace Case Header: {workspace_case_header}")
    print(f"  Case Selector Text: {selector_text}")

    assert "HHG-004" in current_url, f"Expected HHG-004 in URL, got {current_url}"
    assert "HHG-004" in workspace_case_header, f"Expected HHG-004 in header, got {workspace_case_header}"
    assert "HHG-004" in selector_text, f"Expected HHG-004 in selector, got {selector_text}"

    await client.screenshot("test_hhg004_clicked_from_dashboard.png")
    print("\n[PASS] DIRECT DASHBOARD ROW CLICK TO WORKSPACE CONFIRMED SUCCESSFUL!")
    await client.close()

if __name__ == "__main__":
    asyncio.run(main())
