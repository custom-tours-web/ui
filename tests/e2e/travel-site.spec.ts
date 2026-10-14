// Import custom test & expect from the coverage fixture to enable code coverage tracking during E2E tests
import { Locator } from 'playwright/test'
import { expect, test } from './coverage-fixture'

// E2E Test: Verify the initial render & structural integrity of the main page
test('renders the travel sections & their cards', async ({ page }) => {
  // Navigate to the root URL
  await page.goto('/')

  // Verify the page metadata & main hero heading
  await expect(page).toHaveTitle(/South India Travel/)
  await expect(page.getByRole('heading', { name: /Explore South India with/i })).toBeVisible()

  // Assert that the correct number of items are rendered for each main section
  await expect(page.locator('#packages .tour-card')).toHaveCount(3)
  await expect(page.locator('#destinations .destination-card')).toHaveCount(5)
  await expect(page.locator('#fleet .fleet-card')).toHaveCount(7)
})

// E2E Test: Simulate a full user journey from clicking a destination to booking a trip
test('selects a destination & submits the booking request', async ({ page }) => {
  // Intercept the API call to prevent actual backend submissions & assert the outgoing payload
  await page.route('http://localhost:5166/api/v1/booking-requests', async (route) => {
    // Validate request method & headers
    expect(route.request().method()).toBe('POST')
    expect(route.request().headers()['content-type']).toContain('application/json')

    // Assert the form data maps correctly to the expected JSON payload
    expect(await route.request().postDataJSON()).toEqual({
      fullName: 'Mira Rao',
      phoneNumber: '+91 98765 43210',
      currentLocation: 'Madurai',
      destination: 'ooty',
      fromDate: '2030-11-10',
      toDate: '2030-11-12',
      numberOfMembers: 2,
      specialRequests: '',
    })

    // Fulfill the request with a mocked 201 Created success response
    await route.fulfill({ status: 201, body: JSON.stringify({ id: 'e2e-booking' }) })
  })

  // Start the user journey
  await page.goto('/')

  // Click a specific destination which should navigate to the booking section & auto-fill the destination
  await page.getByRole('link', { name: 'Plan a trip to Ooty' }).click()
  await expect(page).toHaveURL(/#booking$/)
  await expect(page.locator('#destination')).toHaveValue('ooty')

  // Fill out the required booking form fields
  await page.locator('#full-name').fill('Mira Rao')
  await page.locator('#phone-number').fill('+91 98765 43210')
  await page.locator('#location').fill('Madurai')
  await page.locator('#from-date').fill('2030-11-10')
  await page.locator('#to-date').fill('2030-11-12')
  await page.locator('#travelers').fill('2')

  // Submit the form
  await page.getByRole('button', { name: 'Book' }).click()

  // Verify the UI updates to show a success message to the user
  await expect(page.locator('.booking-status')).toContainText(
    'Your booking request was sent successfully.',
  )
})

// E2E Test: Verify mobile-specific interactions & layout
test('closes mobile navigation after choosing a section', async ({ page }) => {
  // Emulate a mobile device viewport (e.g., iPhone 12/13 dimensions)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const menu : Locator = page.locator('.mobile-menu')

  // Open the mobile hamburger menu
  await page.locator('.menu-toggle').click()
  await expect(menu).toHaveJSProperty('open', true)

  // Select a link from within the mobile menu
  await menu.getByRole('link', { name: 'Contact' }).click()

  // Verify the page navigated to the correct section & the mobile menu automatically closed
  await expect(page).toHaveURL(/#booking$/)
  await expect(menu).toHaveJSProperty('open', false)

  // Ensure the desktop/main nav still reflects the correct active state behind the scenes
  await expect(page.locator('.main-nav a[href="#booking"]')).toHaveAttribute(
    'aria-current',
    'location',
  )
})
