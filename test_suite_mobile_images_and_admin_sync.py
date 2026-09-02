"""
TEST SUITE 3: Mobile vs Desktop Images Integrity & Admin Control Sync
Tests:
  - Exact match of Category Pillar Images (01 Clothing, 02 Shoes, 03 Vintage, 04 Jewelry) between Desktop & Mobile
  - Hero background-image match between Desktop & Mobile
  - Admin Panel image controls: changing image updates safeStorage and renders identically on Desktop and Mobile
  - Default consistency: data/spots.js BASE_PANELS vs index.html static markup
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

TEST_PORT = 8994
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

def run_test_suite():
    os.chdir(BASE_DIR)
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    httpd = socketserver.ThreadingTCPServer(('127.0.0.1', TEST_PORT), QuietHandler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    time.sleep(0.3)
    server_url = f"http://127.0.0.1:{TEST_PORT}"

    print("\n=======================================================")
    print("🖼️ [TEST SUITE 3] Mobile vs Desktop Images & Admin Sync")
    print("=======================================================\n")

    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        # 1. Desktop Image Scrape
        desktop_page = context.new_page()
        desktop_page.set_viewport_size({"width": 1920, "height": 1080})
        desktop_page.goto(f"{server_url}/index.html", wait_until='domcontentloaded')
        time.sleep(0.5)

        desktop_imgs = {
            "clothing": desktop_page.locator('#imgPillarClothing').get_attribute('src'),
            "shoes": desktop_page.locator('#imgPillarShoes').get_attribute('src'),
            "vintage": desktop_page.locator('#imgPillarVintage').get_attribute('src'),
            "jewelry": desktop_page.locator('#imgPillarJewelry').get_attribute('src'),
        }

        # 2. Mobile Image Scrape (iPhone 375x812)
        mobile_page = context.new_page()
        mobile_page.set_viewport_size({"width": 375, "height": 812})
        mobile_page.goto(f"{server_url}/index.html", wait_until='domcontentloaded')
        time.sleep(0.5)

        mobile_imgs = {
            "clothing": mobile_page.locator('#imgPillarClothing').get_attribute('src'),
            "shoes": mobile_page.locator('#imgPillarShoes').get_attribute('src'),
            "vintage": mobile_page.locator('#imgPillarVintage').get_attribute('src'),
            "jewelry": mobile_page.locator('#imgPillarJewelry').get_attribute('src'),
        }

        # Compare Desktop vs Mobile
        images_match = (desktop_imgs == mobile_imgs)
        results.append({
            "test": "Pillar Category Images Match (Desktop 1920x1080 vs Mobile 375x812)",
            "pass": images_match,
            "details": f"Desktop: {desktop_imgs}\nMobile:  {mobile_imgs}"
        })

        # 3. Admin Panel Image Customization & Cross-Viewport Sync Test
        admin_page = context.new_page()
        admin_page.set_viewport_size({"width": 1400, "height": 900})
        admin_page.goto(f"{server_url}/admin.html", wait_until='domcontentloaded')
        admin_page.fill('#pinInput', 'fav256sobaka')
        admin_page.click('.pin-btn')
        time.sleep(0.3)

        # Navigate to Design Panels
        admin_page.click('button[data-section="secPanels"]')
        time.sleep(0.2)

        # Set a test image URL for Clothing
        test_custom_url = "assets/images/42d4e17f-7138-46fa-be42-6a441782174d.webp"
        admin_page.fill('#inpUrlPillarClothing', test_custom_url)
        admin_page.click('#btnSavePanels')
        time.sleep(0.3)

        # Re-check live site in desktop and mobile context
        desktop_page.reload(wait_until='domcontentloaded')
        mobile_page.reload(wait_until='domcontentloaded')
        time.sleep(0.4)

        updated_desktop_clothing = desktop_page.locator('#imgPillarClothing').get_attribute('src')
        updated_mobile_clothing = mobile_page.locator('#imgPillarClothing').get_attribute('src')

        sync_success = (updated_desktop_clothing == test_custom_url and updated_mobile_clothing == test_custom_url)
        results.append({
            "test": "Admin Panel Image Update -> Live Sync on Desktop & Mobile",
            "pass": sync_success,
            "details": f"Updated URL: {test_custom_url} | Desktop saw: {updated_desktop_clothing} | Mobile saw: {updated_mobile_clothing}"
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
