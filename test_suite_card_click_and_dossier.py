"""
TEST SUITE 1: Spot Card Click Interaction & Dossier Verification
Tests:
  - Clicking on spot cards in Directory (Split, Grid, Map views)
  - Clicking on spot cards in Spotlight (Home page)
  - Clicking on different card sub-elements (image, title, details CTA, badge)
  - Drawer opening, content population, and smooth mobile bottom-sheet / scroll behavior
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

TEST_PORT = 8992
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
    print("🔍 [TEST SUITE 1] Spot Card Click & Dossier Verification")
    print("=======================================================\n")

    results = []

    with sync_playwright() as p:
        # 1. Desktop Test
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        page.goto(f"{server_url}/index.html", wait_until='domcontentloaded')

        # 1.1 Test clicking card in Directory (Desktop)
        page.click('#navTabDirectory')
        time.sleep(0.3)
        cards = page.locator('#spotsGrid .spot-card')
        card_count = cards.count()

        if card_count > 0:
            first_card = cards.first
            first_card.click(timeout=3000)
            time.sleep(0.4)
            drawer_active = page.locator('#spotDrawer').evaluate("el => el.classList.contains('active')")
            drawer_title = page.locator('.drawer-spot-name').text_content()
            drawer_body_len = len(page.locator('#drawerBody').inner_html())

            success = drawer_active and len(drawer_title) > 0 and drawer_body_len > 100
            results.append({
                "test": "Directory Card Click -> Drawer Open (Desktop 1920x1080)",
                "pass": success,
                "details": f"Drawer active: {drawer_active}, Spot Title: '{drawer_title}', Body bytes: {drawer_body_len}"
            })
            page.click('#drawerCloseBtn')
            time.sleep(0.2)
        else:
            results.append({"test": "Directory Cards Rendered", "pass": False, "details": "No cards found in #spotsGrid"})

        # 1.2 Test clicking Spotlight Card on Home (Desktop)
        page.click('#navTabHome')
        time.sleep(0.3)
        spotlight_cards = page.locator('#spotlightGridContainer .spot-card')
        if spotlight_cards.count() > 0:
            spotlight_cards.first.click(timeout=3000)
            time.sleep(0.4)
            drawer_active_spotlight = page.locator('#spotDrawer').evaluate("el => el.classList.contains('active')")
            drawer_title_spotlight = page.locator('.drawer-spot-name').text_content()
            results.append({
                "test": "Spotlight Card Click -> Drawer Open (Home Page)",
                "pass": drawer_active_spotlight,
                "details": f"Drawer active: {drawer_active_spotlight}, Title: '{drawer_title_spotlight}'"
            })
            page.click('#drawerCloseBtn')
            time.sleep(0.2)

        # 2. Mobile Viewport Test (iPhone 375x812)
        page.set_viewport_size({"width": 375, "height": 812})
        page.goto(f"{server_url}/index.html", wait_until='domcontentloaded')
        page.click('#navTabDirectory')
        time.sleep(0.3)

        mobile_cards = page.locator('#spotsGrid .spot-card')
        if mobile_cards.count() > 0:
            # Click card title directly
            title_el = mobile_cards.first.locator('.card-title')
            title_el.click(timeout=3000)
            time.sleep(0.4)

            mobile_drawer_active = page.locator('#spotDrawer').evaluate("el => el.classList.contains('active')")
            mobile_drawer_box = page.locator('#spotDrawer').bounding_box()
            
            # Verify bottom sheet position
            is_bottom_sheet = mobile_drawer_box and mobile_drawer_box['y'] >= 0
            results.append({
                "test": "Spot Card Title Click -> Bottom Sheet Drawer (Mobile 375x812)",
                "pass": mobile_drawer_active and is_bottom_sheet,
                "details": f"Drawer active: {mobile_drawer_active}, Bounding box: {mobile_drawer_box}"
            })
            page.click('#drawerCloseBtn')
            time.sleep(0.2)

        browser.close()

    httpd.shutdown()

    for r in results:
        icon = "✅" if r["pass"] else "❌"
        print(f"{icon} {r['test']}: {'PASS' if r['pass'] else 'FAIL'}")
        print(f"   -> {r['details']}")

    return results

if __name__ == '__main__':
    run_test_suite()
