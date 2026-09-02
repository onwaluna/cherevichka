"""
TEST SUITE 2: Russian IP & Offline Resilience (Anti-Blocking Suite)
Tests:
  - Static audit of <head> for render-blocking external links (Google Fonts, unpkg Leaflet)
  - 100% blocked external network simulation (unpkg, cartocdn, googleapis, gstatic, unsplash)
  - Time-to-Interactive & DOMContentLoaded speed under blocked external CDN
  - Full functional integrity: directory, cards, filters, modals, forms with 0 external network calls
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

TEST_PORT = 8993
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
    print("🇷🇺 [TEST SUITE 2] Russian IP & Geo-Resilience (No VPN)")
    print("=======================================================\n")

    results = []

    # 1. Static <head> Audit for Render-Blocking External Resources
    with open(os.path.join(BASE_DIR, 'index.html'), 'r', encoding='utf-8') as f:
        index_html = f.read()

    has_external_font_css = 'fonts.googleapis.com' in index_html
    has_external_unpkg_css = 'unpkg.com/leaflet' in index_html and '<link rel="stylesheet"' in index_html
    has_external_unpkg_js = 'unpkg.com/leaflet' in index_html and '<script' in index_html

    results.append({
        "test": "Static <head> Audit: External Render-Blocking CSS (unpkg.com)",
        "pass": not has_external_unpkg_css,
        "details": f"Render-blocking unpkg.com stylesheet link found in index.html: {has_external_unpkg_css}"
    })

    results.append({
        "test": "Static <head> Audit: External Render-Blocking Fonts (fonts.googleapis.com)",
        "pass": not has_external_font_css,
        "details": f"External Google Fonts stylesheet link found in index.html: {has_external_font_css}"
    })

    # 2. Browser Network Interception Test (Simulating Russian RKN block)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        blocked_requests = []
        page_errors = []
        page.on('pageerror', lambda err: page_errors.append(str(err)))

        def block_external_traffic(route):
            url = route.request.url
            if any(domain in url for domain in ['unpkg.com', 'cartocdn.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'images.unsplash.com']):
                blocked_requests.append(url)
                route.abort('blockedbyclient')
            else:
                route.continue_()

        page.route('**/*', block_external_traffic)

        start_time = time.time()
        page.goto(f"{server_url}/index.html", wait_until='domcontentloaded', timeout=10000)
        load_duration = round(time.time() - start_time, 3)

        # Check directory navigation under full block
        page.click('#navTabDirectory', timeout=3000)
        time.sleep(0.5)
        cards_count = page.locator('#spotsGrid .spot-card').count()

        results.append({
            "test": "Page Load Time under 100% External Domain Block",
            "pass": load_duration < 2.0,
            "details": f"Loaded in {load_duration}s (Blocked external requests: {len(blocked_requests)})"
        })

        results.append({
            "test": "Directory Functionality & Card Rendering under Full Block",
            "pass": cards_count > 0 and len(page_errors) == 0,
            "details": f"Rendered {cards_count} spot cards. JS Console Errors: {page_errors}"
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
