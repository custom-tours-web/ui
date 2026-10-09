// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

function mountCarousel(): HTMLElement {
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

  Object.defineProperty(track, 'clientWidth', { configurable: true, value: 100 })
  Object.defineProperty(track, 'scrollWidth', { configurable: true, value: 300 })
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
  Object.defineProperty(track, 'scrollTo', {
    configurable: true,
    value: vi.fn(),
  })

  Array.from(track.children).forEach((card, index) => {
    vi.spyOn(card, 'getBoundingClientRect').mockImplementation(() => {
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
    vi.resetModules()
    window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
      callback(0)
      return 1
    }
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    mountCarousel()

    // @ts-expect-error navigation.ts is a browser script that initializes on import.
    await import('../../src/ts/navigation')
  })

  it('advances the carousel by exactly one card and updates arrow states', () => {
    const track = document.querySelector<HTMLElement>('[data-carousel-track]')
    const previousButton = document.querySelector<HTMLButtonElement>(
      '[data-carousel-direction="previous"]',
    )
    const nextButton = document.querySelector<HTMLButtonElement>(
      '[data-carousel-direction="next"]',
    )

    expect(previousButton?.disabled).toBe(true)
    expect(nextButton?.disabled).toBe(false)

    nextButton?.click()

    expect(track?.scrollTo).toHaveBeenCalledWith({ left: 100, behavior: 'smooth' })

    if (track) {
      track.scrollLeft = 100
      track.dispatchEvent(new Event('scroll'))
    }

    expect(previousButton?.disabled).toBe(false)
    expect(nextButton?.disabled).toBe(false)

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

    menu.open = true
    menuLink.click()
    expect(menu.open).toBe(false)

    menu.open = true
    outsideButton.click()
    expect(menu.open).toBe(false)
  })
})
