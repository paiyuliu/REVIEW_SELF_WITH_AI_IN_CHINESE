"""靜態網站端對端檢查。

需求：pip install playwright && playwright install chromium
執行：uv run --no-project --with playwright python tests/e2e_playwright.py
"""
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen

from playwright.sync_api import sync_playwright

WEB = Path(__file__).resolve().parent.parent
PORT = 8765
BASE = f"http://127.0.0.1:{PORT}"


def main() -> int:
    server = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT), "--bind", "127.0.0.1"],
        cwd=WEB,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    failures = []
    try:
        for _ in range(50):
            try:
                urlopen(BASE, timeout=1)
                break
            except OSError:
                time.sleep(0.2)

        with sync_playwright() as p:
            browser = p.chromium.launch()
            context = browser.new_context(permissions=["clipboard-read", "clipboard-write"])
            page = context.new_page()
            requests, errors = [], []
            page.on("request", lambda r: requests.append(r.url))
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on(
                "console",
                lambda m: errors.append(m.text) if m.type == "error" else None,
            )

            page.goto(BASE)
            page.wait_for_function("document.getElementById('history').value.length > 0")
            start = time.time()
            page.get_by_role("button", name="產生命盤與 AI 分析資料").click()
            page.get_by_text("已完成，結果在下方。").wait_for(timeout=30000)
            print(f"計算耗時：{time.time() - start:.2f} 秒")

            body = page.inner_text("#result")
            for expected in ["癸亥", "己未", "戊辰", "乙卯", "陰男", "土五局", "命主 廉貞、身主 天機", "丙辰【命宮】"]:
                if expected not in body:
                    failures.append(f"結果缺少：{expected}")

            output = page.input_value("#output")
            if "# 命盤與人生事件資料" not in output or "你是一位溫和" not in output:
                failures.append("輸出缺少預設的療癒提示詞或命盤標題")

            page.select_option("#prompt-kind", "none")
            if page.input_value("#output").startswith("你是一位"):
                failures.append("選「不附提示詞」後仍附有提示詞")

            page.select_option("#prompt-kind", "healing")
            page.get_by_role("button", name="一鍵複製").click()
            page.get_by_text("已複製").wait_for(timeout=5000)
            if page.evaluate("navigator.clipboard.readText()") != page.input_value("#output"):
                failures.append("剪貼簿內容與輸出不一致")

            page.select_option("#sex", "未提供")
            page.get_by_role("button", name="產生命盤與 AI 分析資料").click()
            page.get_by_text("紫微排盤需要性別").wait_for(timeout=10000)

            outside = [u for u in requests if not u.startswith(BASE) and not u.startswith("data:")]
            if outside:
                failures.append(f"出現對外請求：{outside}")
            if errors:
                failures.append(f"瀏覽器錯誤：{errors}")
            page.screenshot(path="/tmp/e2e-static.png", full_page=True)
            browser.close()
    finally:
        server.terminate()

    for item in failures:
        print("FAIL:", item)
    print("通過" if not failures else "失敗")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
