import os
import sys
import time
import socketserver
import http.server
import threading

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

from playwright.sync_api import sync_playwright

TEST_PORT = 8998
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args): pass

def run_tests():
    os.chdir(BASE_DIR)
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    httpd = socketserver.ThreadingTCPServer(('127.0.0.1', TEST_PORT), QuietHandler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    time.sleep(0.3)
    server_url = f"http://127.0.0.1:{TEST_PORT}"

    print("\n=======================================================")
    print("🔍 VERIFYING 3 BUGFIXES (MOBILE HERO, MAP/LIST, I18N)")
    print("=======================================================\n")

    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # -------------------------------------------------------------
        # TEST 1: Mobile Homepage (320px, 375px, 390px, 430px)
        # -------------------------------------------------------------
        for w in [320, 375, 390, 430]:
            page = browser.new_page(viewport={"width": w, "height": 800})
            page.goto(f"{server_url}/index.html", wait_until='domcontentloaded')
            time.sleep(0.3)

            # Check that country buttons are hidden
            sec_btns = page.locator('.hero-cta-actions .btn-hero-secondary')
            sec_visible = any(sec_btns.nth(i).is_visible() for i in range(sec_btns.count()))

            # Check that primary CTA is visible and working
            prim_btn = page.locator('#heroExploreDirBtn')
            prim_visible = prim_btn.is_visible()
            prim_box = prim_btn.bounding_box()

            # Click CTA and check navigation to directory
            prim_btn.click(timeout=2000)
            time.sleep(0.2)
            in_directory = page.locator('#pageDirectory').evaluate("el => el.classList.contains('active-page')")

            t1_pass = (not sec_visible) and prim_visible and in_directory and (prim_box and prim_box['width'] <= w)
            results.append({
                "test": f"Task 1: Mobile Hero Clean Single CTA ({w}px)",
                "pass": t1_pass,
                "details": f"Secondary btns visible: {sec_visible}, Primary CTA visible: {prim_visible}, In Directory: {in_directory}"
            })
            page.close()

        # Desktop check: secondary buttons must remain visible on 1920x1080
        desktop_page = browser.new_page(viewport={"width": 1920, "height": 1080})
        desktop_page.goto(f"{server_url}/index.html", wait_until='domcontentloaded')
        time.sleep(0.3)
        d_sec_btns = desktop_page.locator('.hero-cta-actions .btn-hero-secondary')
        d_sec_visible = all(d_sec_btns.nth(i).is_visible() for i in range(d_sec_btns.count()))
        results.append({
            "test": "Task 1: Desktop Hero Secondary Country Buttons Visible (1920x1080)",
            "pass": d_sec_visible,
            "details": f"Desktop secondary buttons count: {d_sec_btns.count()}, All visible: {d_sec_visible}"
        })
        desktop_page.close()

        # -------------------------------------------------------------
        # TEST 2: The Directory List / Map Switching on Mobile (375x812)
        # -------------------------------------------------------------
        m_page = browser.new_page(viewport={"width": 375, "height": 812})
        m_page.goto(f"{server_url}/index.html", wait_until='domcontentloaded')
        m_page.click('#navTabDirectory')
        time.sleep(0.3)

        # Initial state: List mode
        cards_init_count = m_page.locator('#spotsGrid .spot-card').count()
        cards_pane_vis_1 = m_page.locator('.cards-pane').is_visible()
        map_pane_vis_1 = m_page.locator('.map-pane-sticky').is_visible()

        # Toggle to Map mode
        toggle_btn = m_page.locator('#btnMobileToggleView')
        toggle_btn.click(timeout=2000)
        time.sleep(0.4)

        cards_pane_vis_2 = m_page.locator('.cards-pane').is_visible()
        map_pane_vis_2 = m_page.locator('.map-pane-sticky').is_visible()
        map_box = m_page.locator('.map-pane-sticky').bounding_box()
        map_height_ok = map_box and map_box['height'] >= 350

        # Toggle back to List mode
        toggle_btn.click(timeout=2000)
        time.sleep(0.4)

        cards_pane_vis_3 = m_page.locator('.cards-pane').is_visible()
        map_pane_vis_3 = m_page.locator('.map-pane-sticky').is_visible()
        cards_after_count = m_page.locator('#spotsGrid .spot-card').count()

        t2_pass = (cards_pane_vis_1 and not map_pane_vis_1 and
                   not cards_pane_vis_2 and map_pane_vis_2 and map_height_ok and
                   cards_pane_vis_3 and not map_pane_vis_3 and cards_after_count == cards_init_count)

        results.append({
            "test": "Task 2: The Directory Mobile List <-> Map Toggle",
            "pass": t2_pass,
            "details": f"Init(Cards:{cards_pane_vis_1}, Map:{map_pane_vis_1}) -> MapMode(Cards:{cards_pane_vis_2}, Map:{map_pane_vis_2}, Height:{map_box['height'] if map_box else 0}px) -> ReturnList(Cards:{cards_pane_vis_3}, Map:{map_pane_vis_3}, CardsCount:{cards_after_count})"
        })
        m_page.close()

        # -------------------------------------------------------------
        # TEST 3: Localization in Footer & English Mode
        # -------------------------------------------------------------
        l_page = browser.new_page(viewport={"width": 1280, "height": 800})
        l_page.goto(f"{server_url}/index.html", wait_until='domcontentloaded')
        time.sleep(0.3)

        # Switch to EN
        l_page.click('#langSwitcher button[data-lang="en"]')
        time.sleep(0.2)
        submit_en = l_page.locator('#footerSubmitLink').text_content().strip()
        adv_en = l_page.locator('#footerAdvertiseLink').text_content().strip()
        en_ok = (submit_en == "List your brand" and adv_en == "For independent ateliers and boutiques")

        # Switch to RU
        l_page.click('#langSwitcher button[data-lang="ru"]')
        time.sleep(0.2)
        submit_ru = l_page.locator('#footerSubmitLink').text_content().strip()
        adv_ru = l_page.locator('#footerAdvertiseLink').text_content().strip()
        ru_ok = (submit_ru == "Разместить бренд" and adv_ru == "Для независимых ателье и бутиков")

        # Switch to ZH
        l_page.click('#langSwitcher button[data-lang="zh"]')
        time.sleep(0.2)
        submit_zh = l_page.locator('#footerSubmitLink').text_content().strip()
        adv_zh = l_page.locator('#footerAdvertiseLink').text_content().strip()
        zh_ok = (submit_zh == "品牌入驻" and adv_zh == "独立工坊与买手店")

        t3_pass = en_ok and ru_ok and zh_ok
        results.append({
            "test": "Task 3: Footer Trilingual Localization (EN/RU/ZH)",
            "pass": t3_pass,
            "details": f"EN: '{submit_en}' / '{adv_en}' | RU: '{submit_ru}' / '{adv_ru}' | ZH: '{submit_zh}' / '{adv_zh}'"
        })
        l_page.close()

        browser.close()

    httpd.shutdown()

    print("\n" + "=" * 60)
    all_passed = True
    for r in results:
        icon = "✅ [PASS]" if r["pass"] else "❌ [FAIL]"
        print(f"{icon} {r['test']}")
        print(f"   -> {r['details']}")
        if not r["pass"]:
            all_passed = False
    print("=" * 60 + "\n")
    return all_passed

if __name__ == '__main__':
    ok = run_tests()
    sys.exit(0 if ok else 1)
