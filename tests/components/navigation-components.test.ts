// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Injects a mock DOM structure containing a site header, mobile menu, & a carousel.
 * Since JSDOM does not render layout or CSS, this function also manually mocks
 * properties like clientWidth, scrollWidth, & getBoundingClientRect.
 */
function mountCarousel(): HTMLElement {
  // Set up the foundational HTML structure for the tests
  document.body.innerHTML = `
    <header class='site-header'>
      <nav class='main-nav'><a href='#home'>Home</a></nav>
      <details class='mobile-menu'>
        <summary>Menu</summary>
        <div class='mobile-menu-panel'><a href='#packages'>Packages</a></div>
      </details>
    </header>
    <main>
      <section id='home'></section>
      <section class='carousel-shell' data-carousel>
        <button data-carousel-direction='previous' aria-label='Previous'></button>
        <div class='carousel-track' data-carousel-track>
          <article class='card'></article>
          <article class='card'></article>
          <article class='card'></article>
        </div>
        <button data-carousel-direction='next' aria-label='Next'></button>
      </section>
      <button id='outside'>Outside</button>
    </main>
  `

  const track = document.querySelector<HTMLElement>('[data-carousel-track]')
  if (!track) {
    throw new Error('Carousel fixture was not created.')
  }

  // Mock track dimensions to simulate a scrollable area (scrollWidth > clientWidth)
  Object.defineProperty(track, 'clientWidth', { configurable: true, value: 100 })
  Object.defineProperty(track, 'scrollWidth', { configurable: true, value: 300 })

  // Mock the bounding client rect for the track container
  vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    right: 100,
    top: 0,
    bottom: 100,
    width: 100,
    height: 100,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  })

  // Mock scrollTo so we can verify if it gets called with correct coordinates
  Object.defineProperty(track, 'scrollTo', {
    configurable: true,
    value: vi.fn(),
  })

  // Mock layout for individual carousel cards to simulate them sitting side-by-side
  Array.from(track.children).forEach((card, index) => {
    vi.spyOn(card, 'getBoundingClientRect').mockImplementation(() => {
      // Calculate dynamic left position based on current scroll position
      const left = index * 100 - track.scrollLeft
      return {
        left,
        right: left + 100,
        top: 0,
        bottom: 100,
        width: 100,
        height: 100,
        x: left,
        y: 0,
        toJSON: () => ({}),
      }
    })
  })

  return track
}

describe('isolated navigation components', () => {
  beforeEach(async () => {
    vi.resetModules() // Ensure a clean module registry before each test

    // Mock requestAnimationFrame to execute synchronously
    window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
      callback(0)
      return 1
    }

    // Stub matchMedia to simulate standard motion preferences (not reduced)
    vi.stubGlobal('matchMedia', () => ({ matches: false }))

    mountCarousel()

    // Import the script to bind event listeners to the mocked DOM
    // @ts-expect-error navigation.ts is a browser script that initializes on import.
    await import('../../src/ts/navigation')
  })

  it('advances the carousel by exactly one card & updates arrow states', () => {
    const track = document.querySelector<HTMLElement>('[data-carousel-track]')
    const previousButton = document.querySelector<HTMLButtonElement>('[data-carousel-direction="previous"]',)
    const nextButton = document.querySelector<HTMLButtonElement>('[data-carousel-direction="next"]',)

    // Initial state: already at the start, so previous should be disabled
    expect(previousButton?.disabled).toBe(true)
    expect(nextButton?.disabled).toBe(false)

    // Trigger moving forward
    nextButton?.click()

    // Verify the track scrolled by exactly one card width (100px)
    expect(track?.scrollTo).toHaveBeenCalledWith({ left: 100, behavior: 'smooth' })

    // Simulate the scroll event completion to update button states
    if (track) {
      track.scrollLeft = 100
      track.dispatchEvent(new Event('scroll'))
    }

    // Now in the middle, both buttons should be active
    expect(previousButton?.disabled).toBe(false)
    expect(nextButton?.disabled).toBe(false)

    // Trigger moving backward
    previousButton?.click()
    expect(track?.scrollTo).toHaveBeenLastCalledWith({ left: 0, behavior: 'smooth' })
  })

  it('closes the mobile menu when a menu item or outside area is clicked', () => {
    const menu = document.querySelector<HTMLDetailsElement>('.mobile-menu')
    const menuLink = document.querySelector<HTMLAnchorElement>('.mobile-menu-panel a')
    const outsideButton = document.querySelector<HTMLButtonElement>('#outside')

    if (!menu || !menuLink || !outsideButton) {
      throw new Error('Mobile menu fixture was not created.')
    }

    // Test clicking a navigation link inside the menu
    menu.open = true
    menuLink.click()
    expect(menu.open).toBe(false)

    // Test clicking an element entirely outside the menu (closes on focusout/clickout)
    menu.open = true
    outsideButton.click()
    expect(menu.open).toBe(false)
  })
})
