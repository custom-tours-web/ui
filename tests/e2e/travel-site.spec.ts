import { expect, test } from "./coverage-fixture"

test("renders the travel sections and their cards", async ({ page }) => {
  await page.goto("/")

  await expect(page).toHaveTitle(/South India Travel/)
  await expect(page.getByRole("heading", { name: /Explore South India with/i })).toBeVisible()
  await expect(page.locator("#packages .tour-card")).toHaveCount(3)
  await expect(page.locator("#destinations .destination-card")).toHaveCount(5)
  await expect(page.locator("#fleet .fleet-card")).toHaveCount(7)
})

test("selects a destination and submits the booking request", async ({ page }) => {
  await page.route("http://localhost:5166/api/v1/booking-requests", async (route) => {
    expect(route.request().method()).toBe("POST")
    expect(route.request().headers()["content-type"]).toContain("application/json")
    expect(await route.request().postDataJSON()).toEqual({
      fullName: "Mira Rao",
      phoneNumber: "+91 98765 43210",
      currentLocation: "Madurai",
      destination: "ooty",
      fromDate: "2030-11-10",
      toDate: "2030-11-12",
      numberOfMembers: 2,
      specialRequests: "",
    })
    await route.fulfill({ status: 201, body: JSON.stringify({ id: "e2e-booking" }) })
  })

  await page.goto("/")
  await page.getByRole("link", { name: "Plan a trip to Ooty" }).click()
  await expect(page).toHaveURL(/#booking$/)
  await expect(page.locator("#destination")).toHaveValue("ooty")

  await page.locator("#full-name").fill("Mira Rao")
  await page.locator("#phone-number").fill("+91 98765 43210")
  await page.locator("#location").fill("Madurai")
  await page.locator("#from-date").fill("2030-11-10")
  await page.locator("#to-date").fill("2030-11-12")
  await page.locator("#travelers").fill("2")
  await page.getByRole("button", { name: "Book" }).click()

  await expect(page.locator(".booking-status")).toContainText(
    "Your booking request was sent successfully.",
  )
})

test("closes mobile navigation after choosing a section", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")

  const menu = page.locator(".mobile-menu")
  await page.locator(".menu-toggle").click()
  await expect(menu).toHaveJSProperty("open", true)
  await menu.getByRole("link", { name: "Contact" }).click()

  await expect(page).toHaveURL(/#booking$/)
  await expect(menu).toHaveJSProperty("open", false)
  await expect(page.locator('.main-nav a[href="#booking"]')).toHaveAttribute(
    "aria-current",
    "location",
  )
})
