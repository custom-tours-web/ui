// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let animationFrames: FrameRequestCallback[] = []
let windowListeners: Array<
  [string, EventListenerOrEventListenerObject, boolean | AddEventListenerOptions | undefined]
> = []
let documentListeners: Array<
  [string, EventListenerOrEventListenerObject, boolean | AddEventListenerOptions | undefined]
> = []

function addNavigationPage(): void {
  document.documentElement.style.cssText = ''
  document.body.innerHTML = `
    <header class='site-header'>
      <nav class='main-nav'>
        <a href='#home'>Home</a>
        <a href='#packages'>Packages</a>
        <a href='#destinations'>Destinations</a>
        <a href='#fleet'>Fleet</a>
      </nav>
      <details class='mobile-menu'>
        <summary>Menu</summary>
        <div class='mobile-menu-panel'><a href='#packages'>Packages</a></div>
      </details>
    </header>
    <main>
      <section id='home'></section>
      <section id='packages'></section>
      <section id='destinations'></section>
      <section id='fleet'></section>
      <button id='outside'>Outside</button>
    </main>
    <footer class='footer-contact'></footer>
  `
  history.replaceState(null, '', '/')
  animationFrames = []
  windowListeners = []
  documentListeners = []
  const addWindowListener = window.addEventListener.bind(window)
  const addDocumentListener = document.addEventListener.bind(document)
  vi.spyOn(window, 'addEventListener').mockImplementation((type, listener, options) => {
    if (listener) {
      windowListeners.push([type, listener, options])
    }
    addWindowListener(type, listener, options)
  })
  vi.spyOn(document, 'addEventListener').mockImplementation((type, listener, options) => {
    if (listener) {
      documentListeners.push([type, listener, options])
    }
    addDocumentListener(type, listener, options)
  })
  window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
    animationFrames.push(callback)
    return animationFrames.length
  }
  window.matchMedia = vi.fn().mockReturnValue({ matches: false })
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 })
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    value: 2000,
  })
  const header = document.querySelector<HTMLElement>('.site-header')
  if (header) {
    setRect(header, { top: 0, bottom: 60, left: 0, width: 800 })
  }
}

function setRect(
  element: Element,
  rect: { top: number; bottom?: number; left?: number; width?: number },
): void {
  const { top, bottom = top, left = 0, width = 0 } = rect
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    top,
    bottom,
    left,
    width,
    right: left + width,
    height: bottom - top,
    x: left,
    y: top,
    toJSON: () => ({}),
  })
}

async function loadNavigation(): Promise<void> {
  await import('../src/ts/navigation')
}

function flushAnimationFrames(): void {
  const callbacks = animationFrames
  animationFrames = []
  callbacks.forEach((callback) => callback(0))
}

function activeLink(): HTMLAnchorElement | null {
  return document.querySelector<HTMLAnchorElement>('.main-nav a.is-active')
}

describe('navigation behavior', () => {
  beforeEach(() => {
    vi.resetModules()
    addNavigationPage()
  })

  afterEach(() => {
    windowListeners.forEach(([type, listener, options]) =>
      window.removeEventListener(type, listener, options),
    )
    documentListeners.forEach(([type, listener, options]) =>
      document.removeEventListener(type, listener, options),
    )
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('defaults to home and updates the active link and indicator on hash changes', async () => {
    await loadNavigation()

    expect(animationFrames).toHaveLength(1)
    expect(activeLink()?.hash).toBe('#home')
    expect(activeLink()?.getAttribute('aria-current')).toBe('location')

    const packagesLink = document.querySelector<HTMLAnchorElement>(
      '.main-nav a[href="#packages"]',
    )
    if (!packagesLink) {
      throw new Error('Packages navigation link was not created.')
    }
    Object.defineProperties(packagesLink, {
      offsetLeft: { configurable: true, value: 120 },
      offsetWidth: { configurable: true, value: 90 },
    })
    history.replaceState(null, '', '/#packages')
    window.dispatchEvent(new Event('hashchange'))

    expect(activeLink()).toBe(packagesLink)
    expect(packagesLink.getAttribute('aria-current')).toBe('location')
    expect(
      document
        .querySelector<HTMLElement>('.main-nav')
        ?.style.getPropertyValue('--active-link-left'),
    ).toBe('120px')
    expect(
      document
        .querySelector<HTMLElement>('.main-nav')
        ?.style.getPropertyValue('--active-link-width'),
    ).toBe('90px')
    expect(
      document.querySelector<HTMLAnchorElement>('.main-nav a[href="#home"]')?.hasAttribute(
        'aria-current',
      ),
    ).toBe(false)
  })

  it('keeps the current active link for a hash with no matching navigation item', async () => {
    await loadNavigation()
    const homeLink = activeLink()

    history.replaceState(null, '', '/#unknown')
    window.dispatchEvent(new Event('hashchange'))

    expect(activeLink()).toBe(homeLink)
  })

  it('updates the active link from section positions after a scroll frame', async () => {
    history.replaceState(null, '', '/')
    const home = document.querySelector('#home')
    const packages = document.querySelector('#packages')
    const destinations = document.querySelector('#destinations')
    const fleet = document.querySelector('#fleet')
    if (!home || !packages || !destinations || !fleet) {
      throw new Error('Navigation page sections were not created.')
    }
    setRect(home, { top: -30 })
    setRect(packages, { top: 20 })
    setRect(destinations, { top: 80 })
    setRect(fleet, { top: 300 })
    await loadNavigation()
    expect(window.addEventListener).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
      { passive: true },
    )
    flushAnimationFrames()

    window.dispatchEvent(new Event('scroll'))
    expect(animationFrames).toHaveLength(1)
    flushAnimationFrames()

    expect(activeLink()?.hash).toBe('#packages')
  })

  it('keeps the hash-selected link when no section has crossed the activation line', async () => {
    history.replaceState(null, '', '/#packages')
    const sections = ['home', 'packages', 'destinations', 'fleet']
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section instanceof HTMLElement)
    sections.forEach((section) => setRect(section, { top: 500 }))

    await loadNavigation()
    flushAnimationFrames()

    expect(activeLink()?.hash).toBe('#packages')
  })

  it('includes sections positioned exactly on the activation line', async () => {
    history.replaceState(null, '', '/')
    const home = document.querySelector('#home')
    const packages = document.querySelector('#packages')
    const destinations = document.querySelector('#destinations')
    const fleet = document.querySelector('#fleet')
    if (!home || !packages || !destinations || !fleet) {
      throw new Error('Navigation page sections were not created.')
    }
    setRect(home, { top: 10 })
    setRect(packages, { top: 61 })
    setRect(destinations, { top: 62 })
    setRect(fleet, { top: 400 })

    await loadNavigation()
    flushAnimationFrames()
    window.dispatchEvent(new Event('scroll'))
    flushAnimationFrames()

    expect(activeLink()?.hash).toBe('#packages')
  })

  it('uses scroll padding when calculating the navigation activation line', async () => {
    history.replaceState(null, '', '/')
    document.documentElement.style.scrollPaddingTop = '100px'
    const home = document.querySelector('#home')
    const packages = document.querySelector('#packages')
    const destinations = document.querySelector('#destinations')
    const fleet = document.querySelector('#fleet')
    if (!home || !packages || !destinations || !fleet) {
      throw new Error('Navigation page sections were not created.')
    }
    setRect(home, { top: 90 })
    setRect(packages, { top: 101 })
    setRect(destinations, { top: 102 })
    setRect(fleet, { top: 400 })

    await loadNavigation()
    flushAnimationFrames()
    window.dispatchEvent(new Event('scroll'))
    flushAnimationFrames()

    expect(activeLink()?.hash).toBe('#packages')
  })

  it('coalesces scroll updates until the pending animation frame completes', async () => {
    history.replaceState(null, '', '/')
    await loadNavigation()
    flushAnimationFrames()
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('resize'))

    expect(animationFrames).toHaveLength(1)
    flushAnimationFrames()
    window.dispatchEvent(new Event('scroll'))
    expect(animationFrames).toHaveLength(1)
  })

  it('schedules a fresh scroll update when the window is resized', async () => {
    await loadNavigation()
    flushAnimationFrames()

    window.dispatchEvent(new Event('resize'))

    expect(animationFrames).toHaveLength(1)
  })

  it('uses the scroll position when there is no site header', async () => {
    const mainNavigation = document.querySelector('.main-nav')
    document.querySelector('.site-header')?.remove()
    const home = document.querySelector('#home')
    const packages = document.querySelector('#packages')
    const destinations = document.querySelector('#destinations')
    const fleet = document.querySelector('#fleet')
    if (!mainNavigation || !home || !packages || !destinations || !fleet) {
      throw new Error('Navigation page elements were not created.')
    }
    document.body.prepend(mainNavigation)
    setRect(home, { top: 0 })
    setRect(packages, { top: 1 })
    setRect(destinations, { top: 20 })
    setRect(fleet, { top: 100 })

    await loadNavigation()
    flushAnimationFrames()

    expect(activeLink()?.hash).toBe('#packages')
  })

  it('activates the last navigation link at the bottom except at the destinations anchor', async () => {
    history.replaceState(null, '', '/')
    const homeSection = document.querySelector('#home')
    const packagesSection = document.querySelector('#packages')
    const destinationsSection = document.querySelector('#destinations')
    const fleetSection = document.querySelector('#fleet')
    if (!homeSection || !packagesSection || !destinationsSection || !fleetSection) {
      throw new Error('Navigation page sections were not created.')
    }
    setRect(homeSection, { top: 0 })
    setRect(packagesSection, { top: 20 })
    setRect(destinationsSection, { top: 40 })
    setRect(fleetSection, { top: 1000 })
    await loadNavigation()
    flushAnimationFrames()

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1398 })
    window.dispatchEvent(new Event('scroll'))
    flushAnimationFrames()
    expect(activeLink()?.hash).toBe('#fleet')

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1397 })
    window.dispatchEvent(new Event('scroll'))
    flushAnimationFrames()
    expect(activeLink()?.hash).toBe('#destinations')

    window.location.hash = '#destinations'
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1398 })
    window.dispatchEvent(new Event('hashchange'))
    window.dispatchEvent(new Event('scroll'))
    flushAnimationFrames()
    expect(activeLink()?.hash).toBe('#destinations')
  })

  it('updates footer visibility when its intersection observer fires', async () => {
    let observerCallback: IntersectionObserverCallback | undefined
    let observerOptions: IntersectionObserverInit | undefined
    const observe = vi.fn()
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
          observerCallback = callback
          observerOptions = options
        }

        observe = observe
      },
    )
    await loadNavigation()

    const footer = document.querySelector<HTMLElement>('.footer-contact')
    expect(observe).toHaveBeenCalledWith(footer)
    expect(observerOptions).toEqual({ threshold: 0.2 })
    observerCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    )
    expect(footer?.classList.contains('is-visible')).toBe(true)
    observerCallback?.(
      [{ isIntersecting: false } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    )
    expect(footer?.classList.contains('is-visible')).toBe(false)
  })

  it('does not observe a footer when IntersectionObserver is unavailable', async () => {
    Reflect.deleteProperty(window, 'IntersectionObserver')
    await expect(loadNavigation()).resolves.toBeUndefined()
    expect(document.querySelector('.footer-contact')?.classList.contains('is-visible')).toBe(
      false,
    )
  })

  it('initializes carousels and moves to adjacent cards using the motion preference', async () => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `<div data-carousel>
        <button data-carousel-direction='previous'></button>
        <div data-carousel-track><article></article><article></article><article></article><article></article><article></article></div>
        <button data-carousel-direction='next'></button>
      </div>`,
    )
    const carousel = document.querySelector<HTMLElement>('[data-carousel]')
    const track = carousel?.querySelector<HTMLElement>('[data-carousel-track]')
    const cards = track ? Array.from(track.children) : []
    const previous = carousel?.querySelector<HTMLButtonElement>(
      '[data-carousel-direction="previous"]',
    )
    const next = carousel?.querySelector<HTMLButtonElement>(
      '[data-carousel-direction="next"]',
    )
    if (!carousel || !track || !previous || !next) {
      throw new Error('Test carousel controls were not created.')
    }
    Object.defineProperties(track, {
      scrollLeft: { configurable: true, writable: true, value: 0 },
      clientWidth: { configurable: true, value: 100 },
      scrollWidth: { configurable: true, value: 300 },
    })
    track.style.columnGap = '10px'
    setRect(track, { top: 0, left: 10, width: 100 })
    const cardPositions = [0, 100, 149, 151, 200]
    cards.forEach((card, index) =>
      setRect(card, { top: 0, left: 10 + cardPositions[index], width: 100 }),
    )
    const scrollTo = vi.fn()
    track.scrollTo = scrollTo
    const addTrackListener = vi.spyOn(track, 'addEventListener')

    await loadNavigation()

    expect(addTrackListener).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
      { passive: true },
    )
    expect(carousel.classList.contains('is-scrollable')).toBe(true)
    expect(previous.disabled).toBe(true)
    expect(next.disabled).toBe(false)
    next.click()
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 100, behavior: 'smooth' })

    Object.defineProperty(track, 'scrollLeft', { configurable: true, writable: true, value: 150 })
    cards.forEach((card, index) =>
      setRect(card, { top: 0, left: 10 + cardPositions[index] - 150, width: 100 }),
    )
    track.dispatchEvent(new Event('scroll'))
    expect(previous.disabled).toBe(false)
    previous.click()
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 100, behavior: 'smooth' })
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })
    next.click()
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 200, behavior: 'auto' })
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
  })

  it('updates carousel button states and resets scroll when there is no overflow', async () => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `<div data-carousel>
        <button data-carousel-direction='previous'></button>
        <div data-carousel-track><article></article></div>
        <button data-carousel-direction='next'></button>
      </div>`,
    )
    const carousel = document.querySelector<HTMLElement>('[data-carousel]')
    const track = carousel?.querySelector<HTMLElement>('[data-carousel-track]')
    const previous = carousel?.querySelector<HTMLButtonElement>(
      '[data-carousel-direction="previous"]',
    )
    const next = carousel?.querySelector<HTMLButtonElement>(
      '[data-carousel-direction="next"]',
    )
    if (!carousel || !track || !previous || !next) {
      throw new Error('Test carousel controls were not created.')
    }
    Object.defineProperties(track, {
      scrollLeft: { configurable: true, writable: true, value: 20 },
      clientWidth: { configurable: true, value: 100 },
      scrollWidth: { configurable: true, value: 101 },
    })

    await loadNavigation()

    expect(carousel.classList.contains('is-scrollable')).toBe(false)
    expect(track.scrollLeft).toBe(0)
    expect(previous.disabled).toBe(true)
    expect(next.disabled).toBe(true)

    Object.defineProperties(track, {
      scrollLeft: { configurable: true, writable: true, value: 100 },
      clientWidth: { configurable: true, value: 100 },
      scrollWidth: { configurable: true, value: 201 },
    })
    track.dispatchEvent(new Event('scroll'))
    expect(previous.disabled).toBe(false)
    expect(next.disabled).toBe(true)
  })

  it('sizes overflowing fleet cards for the desktop viewport and clears sizing without overflow', async () => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `<section id='fleet'><div data-carousel>
        <button data-carousel-direction='previous'></button>
        <div data-carousel-track><article></article><article></article><article></article></div>
        <button data-carousel-direction='next'></button>
      </div></section>`,
    )
    const carousel = document.querySelector<HTMLElement>('#fleet [data-carousel]')
    const track = carousel?.querySelector<HTMLElement>('[data-carousel-track]')
    const cards = track ? Array.from(track.children) : []
    if (!carousel || !track) {
      throw new Error('Fleet carousel was not created.')
    }
    Object.defineProperties(track, {
      scrollLeft: { configurable: true, writable: true, value: 25 },
      clientWidth: { configurable: true, value: 420 },
      scrollWidth: { configurable: true, value: 500 },
    })
    track.style.columnGap = '30px'
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1300 })
    setRect(track, { top: 0, left: 0, width: 420 })
    cards.forEach((card, index) => setRect(card, { top: 0, left: index * 150, width: 120 }))

    await loadNavigation()

    expect(carousel.classList.contains('is-scrollable')).toBe(true)
    expect((cards[0] as HTMLElement).style.flexBasis).toBe('120px')
    expect((cards[0] as HTMLElement).style.flexGrow).toBe('0')
    expect(track.scrollLeft).toBe(25)

    Object.defineProperty(track, 'scrollWidth', { configurable: true, value: 420 })
    window.dispatchEvent(new Event('resize'))
    expect(carousel.classList.contains('is-scrollable')).toBe(false)
    expect((cards[0] as HTMLElement).style.flexBasis).toBe('')
    expect((cards[0] as HTMLElement).style.flexGrow).toBe('')
    expect(track.scrollLeft).toBe(0)
  })

  it('does not resize fleet cards at the desktop breakpoint', async () => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `<section id='fleet'><div data-carousel>
        <button data-carousel-direction='previous'></button>
        <div data-carousel-track></div>
        <button data-carousel-direction='next'></button>
      </div></section>`,
    )
    const track = document.querySelector<HTMLElement>('[data-carousel-track]')
    const card = document.createElement('article')
    track?.append(card)
    if (!track) {
      throw new Error('Fleet carousel track was not created.')
    }
    Object.defineProperties(track, {
      clientWidth: { configurable: true, value: 200 },
      scrollWidth: { configurable: true, value: 400 },
    })
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 })
    setRect(track, { top: 0, left: 0, width: 200 })
    setRect(card, { top: 0, left: 0, width: 100 })

    await loadNavigation()

    expect(card.style.flexBasis).toBe('')
    expect(card.style.flexGrow).toBe('')
  })

  it('does not adjust non-HTML cards while recalculating carousel overflow', async () => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `<section id='fleet'><div data-carousel>
        <button data-carousel-direction='previous'></button>
        <div data-carousel-track></div>
        <button data-carousel-direction='next'></button>
      </div></section>`,
    )
    const track = document.querySelector<HTMLElement>('[data-carousel-track]')
    const svgCard = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svgCard.style.flexBasis = '12px'
    svgCard.style.flexGrow = '3'
    track?.append(svgCard)
    if (!track) {
      throw new Error('Test carousel track was not created.')
    }
    Object.defineProperties(track, {
      clientWidth: { configurable: true, value: 100 },
      scrollWidth: { configurable: true, value: 200 },
    })
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1300 })
    setRect(track, { top: 0, left: 0, width: 100 })
    setRect(svgCard, { top: 0, left: 0, width: 50 })

    await loadNavigation()

    expect(svgCard.style.flexBasis).toBe('12px')
    expect(svgCard.style.flexGrow).toBe('3')
  })

  it('safely handles an overflowing empty fleet track', async () => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `<section id='fleet'><div data-carousel>
        <button data-carousel-direction='previous'></button>
        <div data-carousel-track></div>
        <button data-carousel-direction='next'></button>
      </div></section>`,
    )
    const carousel = document.querySelector<HTMLElement>('#fleet [data-carousel]')
    const track = carousel?.querySelector<HTMLElement>('[data-carousel-track]')
    if (!carousel || !track) {
      throw new Error('Fleet carousel was not created.')
    }
    Object.defineProperties(track, {
      clientWidth: { configurable: true, value: 200 },
      scrollWidth: { configurable: true, value: 400 },
    })
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1300 })

    await loadNavigation()

    expect(carousel.classList.contains('is-scrollable')).toBe(true)
  })

  it('uses the overflow calculation at its exact threshold', async () => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `<div data-carousel>
        <button data-carousel-direction='previous'></button>
        <div data-carousel-track></div>
        <button data-carousel-direction='next'></button>
      </div>`,
    )
    const carousel = document.querySelector<HTMLElement>('[data-carousel]')
    const track = carousel?.querySelector<HTMLElement>('[data-carousel-track]')
    if (!carousel || !track) {
      throw new Error('Test carousel was not created.')
    }
    Object.defineProperties(track, {
      clientWidth: { configurable: true, value: 100 },
      scrollWidth: { configurable: true, value: 101 },
    })

    await loadNavigation()

    expect(carousel.classList.contains('is-scrollable')).toBe(false)
  })

  it('treats a one-pixel carousel offset as already scrolled', async () => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `<div data-carousel>
        <button data-carousel-direction='previous'></button>
        <div data-carousel-track><article></article></div>
        <button data-carousel-direction='next'></button>
      </div>`,
    )
    const track = document.querySelector<HTMLElement>('[data-carousel-track]')
    const previous = document.querySelector<HTMLButtonElement>(
      '[data-carousel-direction="previous"]',
    )
    if (!track || !previous) {
      throw new Error('Test carousel controls were not created.')
    }
    Object.defineProperties(track, {
      scrollLeft: { configurable: true, writable: true, value: 1 },
      clientWidth: { configurable: true, value: 100 },
      scrollWidth: { configurable: true, value: 300 },
    })

    await loadNavigation()

    expect(previous.disabled).toBe(true)
  })

  it('updates carousel overflow on the first load event only', async () => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `<div data-carousel>
        <button data-carousel-direction='previous'></button>
        <div data-carousel-track><article></article></div>
        <button data-carousel-direction='next'></button>
      </div>`,
    )
    const carousel = document.querySelector<HTMLElement>('[data-carousel]')
    const track = carousel?.querySelector<HTMLElement>('[data-carousel-track]')
    if (!carousel || !track) {
      throw new Error('Test carousel was not created.')
    }
    const addTrackListener = vi.spyOn(track, 'addEventListener')
    Object.defineProperties(track, {
      clientWidth: { configurable: true, value: 100 },
      scrollWidth: { configurable: true, value: 100, writable: true },
    })

    await loadNavigation()
    expect(addTrackListener).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
      { passive: true },
    )
    expect(vi.mocked(window.addEventListener)).toHaveBeenCalledWith(
      'load',
      expect.any(Function),
      { once: true },
    )
    expect(carousel.classList.contains('is-scrollable')).toBe(false)

    Object.defineProperty(track, 'scrollWidth', { configurable: true, value: 200 })
    window.dispatchEvent(new Event('load'))
    expect(carousel.classList.contains('is-scrollable')).toBe(true)

    Object.defineProperty(track, 'scrollWidth', { configurable: true, value: 100 })
    window.dispatchEvent(new Event('load'))
    expect(carousel.classList.contains('is-scrollable')).toBe(true)
  })

  it.each([
    `<div data-carousel><div data-carousel-track></div><button data-carousel-direction='next'></button></div>`,
    `<div data-carousel><button data-carousel-direction='previous'></button><div data-carousel-track></div></div>`,
    `<div data-carousel><button data-carousel-direction='previous'></button><button data-carousel-direction='next'></button></div>`,
  ])('ignores a carousel missing any required control', async (markup) => {
    document.body.insertAdjacentHTML('beforeend', markup)

    await expect(loadNavigation()).resolves.toBeUndefined()
  })

  it('ignores incomplete carousel markup and does not move beyond the first or last card', async () => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `<div data-carousel><div data-carousel-track></div></div>
       <div data-carousel>
         <button data-carousel-direction='previous'></button>
         <div data-carousel-track><article></article></div>
         <button data-carousel-direction='next'></button>
       </div>`,
    )
    const track = document.querySelectorAll<HTMLElement>('[data-carousel-track]')[1]
    const previous = document.querySelector<HTMLButtonElement>(
      '[data-carousel-direction="previous"]',
    )
    const next = document.querySelector<HTMLButtonElement>(
      '[data-carousel-direction="next"]',
    )
    if (!previous || !next) {
      throw new Error('Test carousel controls were not created.')
    }
    Object.defineProperties(track, {
      scrollLeft: { configurable: true, writable: true, value: 0 },
      clientWidth: { configurable: true, value: 100 },
      scrollWidth: { configurable: true, value: 200 },
    })
    setRect(track, { top: 0, left: 0, width: 100 })
    const scrollTo = vi.fn()
    track.scrollTo = scrollTo

    await loadNavigation()

    previous.click()
    expect(scrollTo).not.toHaveBeenCalled()
    Object.defineProperty(track, 'scrollLeft', { configurable: true, writable: true, value: 100 })
    next.click()
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('closes the mobile menu after selecting a link or clicking outside', async () => {
    await loadNavigation()

    const menu = document.querySelector<HTMLDetailsElement>('.mobile-menu')
    const menuLink = document.querySelector<HTMLAnchorElement>('.mobile-menu-panel a')
    if (!menu || !menuLink) {
      throw new Error('Test mobile menu was not created.')
    }
    menu.open = true
    menu.querySelector('.mobile-menu-panel')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    )
    expect(menu.open).toBe(true)

    menu.open = true
    menuLink.click()
    expect(menu.open).toBe(false)

    menu.open = true
    document.querySelector<HTMLButtonElement>('#outside')?.click()
    expect(menu.open).toBe(false)

    menu.open = true
    menu.querySelector('.mobile-menu-panel')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    )
    expect(menu.open).toBe(true)
  })

  it('ignores clicks whose event target is not a DOM node', async () => {
    await loadNavigation()

    const menu = document.querySelector<HTMLDetailsElement>('.mobile-menu')
    const clickListener = documentListeners.find(([type]) => type === 'click')?.[1]
    if (!menu || typeof clickListener !== 'function') {
      throw new Error('Mobile menu click handler was not registered.')
    }
    menu.open = true
    const event = new MouseEvent('click')
    Object.defineProperty(event, 'target', { configurable: true, value: {} })

    expect(() => clickListener(event)).not.toThrow()
    expect(menu.open).toBe(true)
  })

  it('does not require navigation links or a mobile menu to initialize', async () => {
    document.body.innerHTML = ''

    await expect(loadNavigation()).resolves.toBeUndefined()

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 2000 })
    window.dispatchEvent(new Event('scroll'))
    flushAnimationFrames()
    expect(activeLink()).toBeNull()
  })
})
