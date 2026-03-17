from playwright.sync_api import sync_playwright
import time

def verify_twilight_stillness():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the local dev server
        page.goto("http://localhost:5173/")

        # Wait a bit for Three.js to initialize and render
        time.sleep(5)

        # Take a screenshot of the initial state (Dawn Surface)
        page.screenshot(path="/home/jules/verification/twilight_stillness.png")

        print("Screenshot saved to /home/jules/verification/twilight_stillness.png")
        browser.close()

if __name__ == "__main__":
    verify_twilight_stillness()
