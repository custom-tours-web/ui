// @vitest-environment jsdom
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

describe('app integration flows', () => {
  beforeAll(async () => {
    // Dynamically compile the HAML template to HTML to test against the actual production DOM structure
    const hamlFile : string = resolve(process.cwd(), 'src/haml/index.haml')
    const renderedPage : string = execFileSync('haml', ['render', hamlFile], {
      encoding: 'utf8',
    })

    // Parse the generated HTML & inject it into the JSDOM environment
    const parsedPage = new DOMParser().parseFromString(renderedPage, 'text/html')
    document.body.innerHTML = parsedPage.body.innerHTML

    // Mock requestAnimationFrame to execute immediately for synchronous test flow
    window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
      callback(0)
      return 1
    }

    // Import the client-side scripts to initialize event listeners on the newly injected DOM
    // @ts-expect-error navigation.ts is a browser script that initializes on import.
    await import('../../src/ts/navigation')
    await import('../../src/ts/booking')
  })

  beforeEach(() => {
    // Reset the application state & URL before each test
    history.replaceState(null, '', '#home')
    vi.stubGlobal('fetch', vi.fn())
  })

  it('selects a destination from the rendered destination card & navigates to booking', () => {
    // Locate a specific destination card to simulate a user click
    const destinationCard = document.querySelector<HTMLAnchorElement>(
      '.destination-card[data-booking-destination="ooty"]',
    )
    const destinationSelect = document.querySelector<HTMLSelectElement>('#destination')

    // Simulate the click & update the hash manually since JSDOM doesn't always handle anchor routing natively
    destinationCard?.click()
    if (destinationCard) {
      window.location.hash = destinationCard.hash
    }

    // Verify the URL updated to the booking section & the form pre-selected the correct destination
    expect(destinationCard?.getAttribute('href')).toBe('#booking')
    expect(window.location.hash).toBe('#booking')
    expect(destinationSelect?.value).toBe('ooty')
  })

  it('submits the selected destination from the rendered page to the booking API', async () => {
    // Mock a successful API response from the backend
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 201 }))

    // Pre-select 'madurai' via the destination card
    const destinationCard = document.querySelector<HTMLAnchorElement>(
      '.destination-card[data-booking-destination="madurai"]',
    )
    destinationCard?.click()
    if (destinationCard) {
      window.location.hash = destinationCard.hash
    }

    // Retrieve all form fields to populate data
    const fullName = document.querySelector<HTMLInputElement>('#full-name')
    const phone = document.querySelector<HTMLInputElement>('#phone-number')
    const location = document.querySelector<HTMLInputElement>('#location')
    const fromDate = document.querySelector<HTMLInputElement>('#from-date')
    const toDate = document.querySelector<HTMLInputElement>('#to-date')
    const travelers = document.querySelector<HTMLInputElement>('#travelers')
    const form = document.querySelector<HTMLFormElement>('.booking-form')

    if (!fullName || !phone || !location || !fromDate || !toDate || !travelers || !form) {
      throw new Error('The rendered booking form is missing required fields.')
    }

    // Populate the form with test data, including extra whitespace to test trimming logic
    fullName.value = '  Mira Rao '
    phone.value = ' +91 98765 43210 '
    location.value = ' Madurai '
    fromDate.value = '2026-11-10'
    toDate.value = '2026-11-12'
    travelers.value = '2'

    // Dispatch the submit event
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    // Wait for the UI to update with the success state
    await vi.waitFor(() => {
      expect(document.querySelector('.booking-status')?.classList.contains('is-success')).toBe(true)
    })

    // Verify the API payload was formatted correctly
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5166/api/v1/booking-requests',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          fullName: 'Mira Rao',
          phoneNumber: '+91 98765 43210',
          currentLocation: 'Madurai',
          destination: 'madurai', // Selected via the card click earlier
          fromDate: '2026-11-10',
          toDate: '2026-11-12',
          numberOfMembers: 2,
          specialRequests: '',
        }),
      }),
    )

    // Verify the form resets after successful submission
    expect(fullName.value).toBe('')
  })

  it('closes the rendered mobile menu & marks the matching navigation link active', async () => {
    const mobileMenu = document.querySelector<HTMLDetailsElement>('.mobile-menu')
    const contactLink = document.querySelector<HTMLAnchorElement>(
      '.mobile-menu-panel a[href="#booking"]',
    )

    if (!mobileMenu || !contactLink) {
      throw new Error('The rendered mobile navigation is missing its contact link.')
    }

    // Open the mobile menu & click the navigation link
    mobileMenu.open = true
    contactLink.click()
    window.location.hash = contactLink.hash

    // Wait for the scroll-spy or route handler to mark the desktop link as active
    await vi.waitFor(() => {
      expect(
        document.querySelector('.main-nav a[href="#booking"]')?.getAttribute('aria-current'),
      ).toBe('location')
    })

    // Verify the route changed & the mobile menu details element closed itself
    expect(window.location.hash).toBe('#booking')
    expect(mobileMenu.open).toBe(false)
  })
})
