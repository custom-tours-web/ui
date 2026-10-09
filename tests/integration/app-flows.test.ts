// @vitest-environment jsdom
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

describe('app integration flows', () => {
  beforeAll(async () => {
    const hamlFile = resolve(process.cwd(), 'src/haml/index.haml')
    const renderedPage = execFileSync('haml', ['render', hamlFile], {
      encoding: 'utf8',
    })
    const parsedPage = new DOMParser().parseFromString(renderedPage, 'text/html')
    document.body.innerHTML = parsedPage.body.innerHTML

    window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
      callback(0)
      return 1
    }

    // @ts-expect-error navigation.ts is a browser script that initializes on import.
    await import('../../src/ts/navigation')
    await import('../../src/ts/booking')
  })

  beforeEach(() => {
    history.replaceState(null, '', '#home')
    vi.stubGlobal('fetch', vi.fn())
  })

  it('selects a destination from the rendered destination card and navigates to booking', () => {
    const destinationCard = document.querySelector<HTMLAnchorElement>(
      '.destination-card[data-booking-destination="ooty"]',
    )
    const destinationSelect = document.querySelector<HTMLSelectElement>('#destination')

    destinationCard?.click()
    if (destinationCard) {
      window.location.hash = destinationCard.hash
    }

    expect(destinationCard?.getAttribute('href')).toBe('#booking')
    expect(window.location.hash).toBe('#booking')
    expect(destinationSelect?.value).toBe('ooty')
  })

  it('submits the selected destination from the rendered page to the booking API', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 201 }))

    const destinationCard = document.querySelector<HTMLAnchorElement>(
      '.destination-card[data-booking-destination="madurai"]',
    )
    destinationCard?.click()
    if (destinationCard) {
      window.location.hash = destinationCard.hash
    }

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

    fullName.value = '  Mira Rao '
    phone.value = ' +91 98765 43210 '
    location.value = ' Madurai '
    fromDate.value = '2026-11-10'
    toDate.value = '2026-11-12'
    travelers.value = '2'

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    await vi.waitFor(() => {
      expect(document.querySelector('.booking-status')?.classList.contains('is-success')).toBe(true)
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5166/api/v1/booking-requests',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          fullName: 'Mira Rao',
          phoneNumber: '+91 98765 43210',
          currentLocation: 'Madurai',
          destination: 'madurai',
          fromDate: '2026-11-10',
          toDate: '2026-11-12',
          numberOfMembers: 2,
          specialRequests: '',
        }),
      }),
    )
    expect(fullName.value).toBe('')
  })

  it('closes the rendered mobile menu and marks the matching navigation link active', async () => {
    const mobileMenu = document.querySelector<HTMLDetailsElement>('.mobile-menu')
    const contactLink = document.querySelector<HTMLAnchorElement>(
      '.mobile-menu-panel a[href="#booking"]',
    )

    if (!mobileMenu || !contactLink) {
      throw new Error('The rendered mobile navigation is missing its contact link.')
    }

    mobileMenu.open = true
    contactLink.click()
    window.location.hash = contactLink.hash

    await vi.waitFor(() => {
      expect(
        document.querySelector('.main-nav a[href="#booking"]')?.getAttribute('aria-current'),
      ).toBe('location')
    })

    expect(window.location.hash).toBe('#booking')
    expect(mobileMenu.open).toBe(false)
  })
})
