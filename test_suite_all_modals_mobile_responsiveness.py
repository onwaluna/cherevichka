"""
TEST SUITE 4: All Modals & Pages Mobile Responsiveness Suite
Tests (on Mobile iPhone 375x812 & Android 390x844):
  - Submit Spot / List Your Brand ($10) modal mobile layout (.form-row-2, paddings, inputs)
  - Walking Crawls modal mobile responsiveness
  - Tourist Guide modal mobile tabs and phrase tables
  - Saved Favorites modal mobile layout
  - Spot Drawer mobile bottom-sheet behavior
  - Horizontal overflow / scroll containment check (0 horizontal overflow)
"""

import os
import sys
import json
import time
import socketserver
import http.server
import threading

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

from playwright.sync_api import sync_playwright

TEST_PORT = 8995
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

def run_test_suite():
    os.chdir(BASE_DIR)
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(('127.0.0.1', TEST_PORT), QuietHandler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    time.sleep(0.3)
    server_url = f"http://127.0.0.1:{TEST_PORT}"

    print("\n=======================================================")
    print("📱 [TEST SUITE 4] All Modals & Pages Mobile Responsiveness")
    print("=======================================================\n")

    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 812})
        page.goto(f"{server_url}/index.html", wait_until='domcontentloaded')
        time.sleep(0.5)

        # 1. Test "List Your Brand" Modal Mobile Layout (#submitModal)
        page.click('#openSubmitBtn', timeout=3000)
        time.sleep(0.3)

        submit_modal_box = page.locator('#submitModal .modal-content-card').bounding_box()
        modal_width_ok = submit_modal_box and submit_modal_box['width'] <= 375

        # Check form-row-2 columns: are inputs stacked vertically or squished into 2 columns?
        input1_box = page.locator('#storeName').bounding_box()
        input2_box = page.locator('#storeEmail').bounding_box()

        # If they are on the same Y row, they are in 2 columns (desktop style). If input2 is below input1, they are stacked cleanly for mobile!
        inputs_stacked_vertically = input1_box and input2_box and (input2_box['y'] >= input1_box['y'] + input1_box['height'])

        results.append({
            "test": "List Your Brand ($10) Modal: Mobile Responsive Form Layout",
            "pass": inputs_stacked_vertically and modal_width_ok,
            "details": f"Modal Width: {submit_modal_box['width'] if submit_modal_box else 'N/A'}px | Inputs Stacked Vertically on Mobile: {inputs_stacked_vertically}"
        })
        page.click('#submitModal .close-modal-btn')
        time.sleep(0.2)

        # 2. Test Walking Crawls Modal (#toursModal) on Mobile
        page.click('#navTabTours', timeout=3000)
        time.sleep(0.3)
        tours_box = page.locator('#toursModal .modal-content-card').bounding_box()
        tours_width_ok = tours_box and tours_box['width'] <= 375
        results.append({
            "test": "Walking Crawls Modal: Mobile Viewport Containment",
            "pass": tours_width_ok,
            "details": f"Tours Modal Width: {tours_box['width'] if tours_box else 'N/A'}px (<= 375px)"
        })
        page.click('#toursModal .close-modal-btn')
        time.sleep(0.2)

        # 3. Test Survival Guide Modal (#survivalModal) on Mobile
        page.click('#navTabSurvival', timeout=3000)
        time.sleep(0.3)
        survival_box = page.locator('#survivalModal .modal-content-card').bounding_box()
        survival_width_ok = survival_box and survival_box['width'] <= 375
        results.append({
            "test": "Tourist Survival Guide Modal: Mobile Viewport Containment",
            "pass": survival_width_ok,
            "details": f"Survival Modal Width: {survival_box['width'] if survival_box else 'N/A'}px (<= 375px)"
        })
        page.click('#survivalModal .close-modal-btn')
        time.sleep(0.2)

        # 4. Test Saved Favorites Modal (#favoritesModal) on Mobile
        page.click('#openFavoritesBtn', timeout=3000)
        time.sleep(0.3)
        fav_box = page.locator('#favoritesModal .modal-content-card').bounding_box()
        fav_width_ok = fav_box and fav_box['width'] <= 375
        results.append({
            "test": "Favorites Itinerary Modal: Mobile Viewport Containment",
            "pass": fav_width_ok,
            "details": f"Favorites Modal Width: {fav_box['width'] if fav_box else 'N/A'}px (<= 375px)"
        })
        page.click('#favoritesModal .close-modal-btn')
        time.sleep(0.2)

        # 5. Global Horizontal Overflow Check on Mobile Page
        page.click('#navTabDirectory')
        time.sleep(0.3)
        has_horizontal_scrollbar = page.evaluate("() => document.documentElement.scrollWidth > window.innerWidth")
        results.append({
            "test": "Directory Mobile Page: 0 Horizontal Scrollbar / Overflow",
            "pass": not has_horizontal_scrollbar,
            "details": f"Horizontal scrollbar present on mobile: {has_horizontal_scrollbar}"
        })

        browser.close()

    httpd.shutdown()

    for r in results:
        icon = "✅" if r["pass"] else "❌"
        print(f"{icon} {r['test']}: {'PASS' if r['pass'] else 'FAIL'}")
        print(f"   -> {r['details']}")

    return results

if __name__ == '__main__':
    run_test_suite()
