// Cache DOM elements for the primary navigation & footer to avoid repeated queries.
const navigationLinks = document.querySelectorAll<HTMLAnchorElement>('.main-nav a[href^="#"]')
const mainNavigation = document.querySelector<HTMLElement>('.main-nav')
const footerContact = document.querySelector<HTMLElement>('.footer-contact')

// Retrieves the current URL hash, defaulting to '#home' if none is present.
const getCurrentHash = (): string => window.location.hash || '#home'

// Iterates through cached navigation links to find the one matching the provided hash.
const findNavigationLinkByHash = (hash: string): HTMLAnchorElement | null => {
  for (let i = 0; i < navigationLinks.length; i += 1) if (navigationLinks[i].hash === hash) return navigationLinks[i]

  return null
}

// Updates CSS custom properties to animate the sliding active indicator under the current link.
const updateNavigationIndicator = (activeLink: HTMLAnchorElement): void => {
  mainNavigation?.style.setProperty('--active-link-left', `${activeLink.offsetLeft}px`)
  mainNavigation?.style.setProperty('--active-link-width', `${activeLink.offsetWidth}px`)
}

// Toggles the 'is-active' class & 'aria-current' accessibility attribute for all navigation links based on the active state.
const updateNavigationLinkStates = (activeLink: HTMLAnchorElement): void => {
  for (let i = 0; i < navigationLinks.length; i += 1) {
    const link : HTMLAnchorElement = navigationLinks[i]
    const isActive : boolean = link === activeLink

    link.classList.toggle('is-active', isActive)
    isActive ? link.setAttribute('aria-current', 'location') : link.removeAttribute('aria-current')
  }
}

// Master function to trigger both visual indicator & state updates for the active link.
const setActiveNavigation = (activeLink: HTMLAnchorElement): void => {
  updateNavigationIndicator(activeLink)
  updateNavigationLinkStates(activeLink)
}

const updateActiveNavigation = (hash: string): void => {
  const matchingLink : HTMLAnchorElement = findNavigationLinkByHash(hash)!
  if (matchingLink) setActiveNavigation(matchingLink)
}

// Calculates the Y-coordinate threshold where a scrolled section becomes active.
// This accounts for the fixed site header & the document's scroll padding.
const getNavigationActivationLine = (): number => {
  const header = document.querySelector<HTMLElement>('.site-header')
  const scrollPaddingTop : number =
    Number.parseFloat(window.getComputedStyle(document.documentElement).scrollPaddingTop) || 0

  return Math.max(header?.getBoundingClientRect().bottom ?? 0, scrollPaddingTop) + 1
}

// Identifies which navigation link should be active based on the current scroll position crossing the activation line.
const findActiveNavigationLinkFromScroll = (activationLine: number): HTMLAnchorElement | null => {
  let activeLink: HTMLAnchorElement | null = null

  for (let i = 0; i < navigationLinks.length; i += 1) {
    const target : HTMLElement = document.getElementById(navigationLinks[i].hash.slice(1))!
    if (target && target.getBoundingClientRect().top <= activationLine)  activeLink = navigationLinks[i]
  }
  return activeLink
}

// Checks if the user has scrolled to the absolute bottom of the page.
const isAtPageBottom = (): boolean => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2

// Special case check to prevent overriding the active state if the user explicitly clicked the destinations anchor.
const isAtDestinationsAnchor = (): boolean => window.location.hash === navigationLinks[navigationLinks.length - 2]?.hash

// Forces the last navigation link to become active when the user reaches the bottom of the page, unless the destinations anchor was explicitly selected.
const findLastNavigationLink = (): HTMLAnchorElement | null => {
  if (navigationLinks.length > 0 && isAtPageBottom() && !isAtDestinationsAnchor()) return navigationLinks[navigationLinks.length - 1]

  return null
}

// Determines the correct active link by checking both standard scroll position & bottom-of-page edge cases.
const getActiveNavigationLinkFromScroll = (): HTMLAnchorElement | null => {
  const activationLine : number = getNavigationActivationLine()
  const activeLink : HTMLAnchorElement = findActiveNavigationLinkFromScroll(activationLine)!

  return findLastNavigationLink() ?? activeLink
}

const updateNavigationFromScroll = (): void => {
  const activeLink : HTMLAnchorElement = getActiveNavigationLinkFromScroll()!
  if (activeLink) setActiveNavigation(activeLink)
}

// Throttles scroll-based DOM updates using requestAnimationFrame to maintain performance.
const updateNavigationAfterAnimationFrame = (): void => {
  scrollUpdatePending = false
  updateNavigationFromScroll()
}

let scrollUpdatePending = false
const scheduleScrollUpdate = (): void => {
  if (scrollUpdatePending) return

  scrollUpdatePending = true
  window.requestAnimationFrame(updateNavigationAfterAnimationFrame)
}

const handleHashChange = (): void => updateActiveNavigation(getCurrentHash())

const handleWindowResize = (): void => scheduleScrollUpdate()

// Fades in the footer contact section when it enters the viewport using an IntersectionObserver.
const initializeFooterContactAnimation = (): void => {
  if (!footerContact || !('IntersectionObserver' in window)) return

  const observer = new IntersectionObserver(
    ([entry]) => {
      footerContact.classList.toggle('is-visible', entry.isIntersecting)
    },
    { threshold: 0.2 },
  )

  observer.observe(footerContact)
}

// Bootstraps logic for any element marked with 'data-carousel', managing overflow states, button disabling, & smooth scrolling.
const initializeCarousels = (): void => {
  const carousels = document.querySelectorAll<HTMLElement>('[data-carousel]')

  carousels.forEach((carousel) => {
    const track = carousel.querySelector<HTMLElement>('[data-carousel-track]')
    const previousButton = carousel.querySelector<HTMLButtonElement>(
      '[data-carousel-direction="previous"]',
    )
    const nextButton = carousel.querySelector<HTMLButtonElement>(
      '[data-carousel-direction="next"]',
    )

    if (!track || !previousButton || !nextButton) return

    // Disables previous/next buttons based on the track's current scroll position relative to its boundaries.
    const updateButtonStates = (): void => {
      previousButton.disabled = track.scrollLeft <= 1
      nextButton.disabled =
        track.scrollLeft + track.clientWidth >= track.scrollWidth - 1
    }

    // Evaluates whether the carousel content overflows the container & applies responsive resizing for the '#fleet' section on wide screens.
    const updateOverflow = (): void => {
      const previousScrollLeft : number = track.scrollLeft
      Array.from(track.children).forEach((card) => {
        if (card instanceof HTMLElement) {
          card.style.flexBasis = ''
          card.style.flexGrow = ''
        }
      })
      carousel.classList.remove('is-scrollable')
      const hasOverflow : boolean = track.scrollWidth > track.clientWidth + 1
      carousel.classList.toggle('is-scrollable', hasOverflow)

      // Specifically adjust card widths for the fleet carousel when the viewport exceeds 1200px.
      if (hasOverflow && carousel.closest('#fleet') && window.innerWidth > 1200) {
        const firstCard : Element = track.firstElementChild!
        const cardWidth : number = firstCard?.getBoundingClientRect().width ?? 0
        const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0
        const visibleCardCount = Math.max(
          1,
          Math.floor((track.clientWidth + gap) / (cardWidth + gap)),
        )
        const adjustedCardWidth : number =
          (track.clientWidth - gap * (visibleCardCount - 1)) / visibleCardCount

        Array.from(track.children).forEach((card) => {
          if (card instanceof HTMLElement) {
            card.style.flexBasis = `${adjustedCardWidth}px`
            card.style.flexGrow = '0'
          }
        })
      }

      track.scrollLeft = hasOverflow ? previousScrollLeft : 0
      updateButtonStates()
    }

    // Calculates the position of the next fully hidden card & scrolls it into view, respecting the user's motion preferences.
    const scrollToAdjacentCard = (direction: 'previous' | 'next'): void => {
      const trackLeft: number = track.getBoundingClientRect().left
      const currentScrollLeft : number = track.scrollLeft
      const cardPositions : number[] = Array.from(track.children, (card) =>
        card.getBoundingClientRect().left - trackLeft + currentScrollLeft,
      )
      let targetPosition: number | undefined

      if (direction === 'next') targetPosition = cardPositions.find((position) => position > currentScrollLeft + 1)
      else if (direction === 'previous') targetPosition = cardPositions.reverse().find((position) => position < currentScrollLeft - 1)

      if (targetPosition === undefined) return

      track.scrollTo({
        left: targetPosition,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
      })
    }

    // Attach passive listeners to improve scroll performance.
    previousButton.addEventListener('click', () => scrollToAdjacentCard('previous'))
    nextButton.addEventListener('click', () => scrollToAdjacentCard('next'))
    track.addEventListener('scroll', updateButtonStates, { passive: true })
    window.addEventListener('resize', updateOverflow)
    window.addEventListener('load', updateOverflow, { once: true })
    updateOverflow()
  })
}

// Binds closing logic to the mobile `<details>` menu, automatically collapsing it when a link or outside area is clicked.
const initializeMobileMenu = (): void => {
  const mobileMenu = document.querySelector<HTMLDetailsElement>('.mobile-menu')

  if (!mobileMenu) return

  mobileMenu.querySelectorAll<HTMLAnchorElement>('.mobile-menu-panel a').forEach((link) => link.addEventListener('click', () => mobileMenu.open = false))

  document.addEventListener('click', (event: MouseEvent) => {
    if (mobileMenu.open && event.target instanceof Node && !mobileMenu.contains(event.target)) mobileMenu.open = false
  })
}

// Main initialization sequence, triggering all layout calculations & binding global event listeners.
const initializeNavigation = (): void => {
  updateActiveNavigation(getCurrentHash())
  scheduleScrollUpdate()
  initializeFooterContactAnimation()
  initializeCarousels()
  initializeMobileMenu()

  window.addEventListener('hashchange', handleHashChange)
  window.addEventListener('scroll', scheduleScrollUpdate, { passive: true })
  window.addEventListener('resize', handleWindowResize)
}

initializeNavigation()
