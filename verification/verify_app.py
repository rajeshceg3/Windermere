from playwright.sync_api import sync_playwright

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to app...")
            page.goto("http://localhost:5173")

            # Wait for canvas to be present
            print("Waiting for canvas...")
            page.wait_for_selector("canvas", state="visible")

            # Wait for button to be present
            print("Waiting for button...")
            page.wait_for_selector("button", state="visible")

            # Check button text
            button = page.locator("button")
            text = button.text_content()
            print(f"Button text: {text}")
            if "Start Experience" not in text:
                print("Button text mismatch!")

            # Take screenshot
            print("Taking screenshot...")
            page.screenshot(path="verification/app_verification.png")
            print("Screenshot saved.")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_app()
