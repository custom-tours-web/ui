const navigationLinks = document.querySelectorAll<HTMLAnchorElement>('.main-nav a[href^="#"]')
const mainNavigation = document.querySelector<HTMLElement>('.main-nav')
const footerContact = document.querySelector<HTMLElement>('.footer-contact')

function getCurrentHash(): string {
  return window.location.hash || '#home'
}

function findNavigationLinkByHash(hash: string): HTMLAnchorElement | null {
  for (let i = 0; i < navigationLinks.length; i += 1) {
    if (navigationLinks[i].hash === hash) {
      return navigationLinks[i]
    }
  }

  return null
}

function updateNavigationIndicator(activeLink: HTMLAnchorElement): void {
  mainNavigation?.style.setProperty('--active-link-left', `${activeLink.offsetLeft}px`)
  mainNavigation?.style.setProperty('--active-link-width', `${activeLink.offsetWidth}px`)
}

function updateNavigationLinkStates(activeLink: HTMLAnchorElement): void {
  for (let i = 0; i < navigationLinks.length; i += 1) {
    const link = navigationLinks[i]
    const isActive = link === activeLink

    link.classList.toggle('is-active', isActive)
    if (isActive) {
      link.setAttribute('aria-current', 'location')
    } else {
      link.removeAttribute('aria-current')
    }
  }
}

function setActiveNavigation(activeLink: HTMLAnchorElement): void {
  updateNavigationIndicator(activeLink)
  updateNavigationLinkStates(activeLink)
}

function updateActiveNavigation(hash: string): void {
  const matchingLink = findNavigationLinkByHash(hash)
  if (matchingLink) {
    setActiveNavigation(matchingLink)
  }
}

function getNavigationActivationLine(): number {
  const header = document.querySelector<HTMLElement>('.site-header')
  const scrollPaddingTop =
    Number.parseFloat(window.getComputedStyle(document.documentElement).scrollPaddingTop) || 0

  return Math.max(header?.getBoundingClientRect().bottom ?? 0, scrollPaddingTop) + 1
}

function findActiveNavigationLinkFromScroll(activationLine: number): HTMLAnchorElement | null {
  let activeLink: HTMLAnchorElement | null = null

  for (let i = 0; i < navigationLinks.length; i += 1) {
    const target = document.getElementById(navigationLinks[i].hash.slice(1))
    if (target && target.getBoundingClientRect().top <= activationLine) {
      activeLink = navigationLinks[i]
    }
  }

  return activeLink
}

function isAtPageBottom(): boolean {
  return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
}

function isAtDestinationsAnchor(): boolean {
  return window.location.hash === navigationLinks[navigationLinks.length - 2]?.hash
}

function findLastNavigationLink(): HTMLAnchorElement | null {
  if (navigationLinks.length > 0 && isAtPageBottom() && !isAtDestinationsAnchor()) {
    return navigationLinks[navigationLinks.length - 1]
  }

  return null
}

function getActiveNavigationLinkFromScroll(): HTMLAnchorElement | null {
  const activationLine = getNavigationActivationLine()
  const activeLink = findActiveNavigationLinkFromScroll(activationLine)

  return findLastNavigationLink() ?? activeLink
}

function updateNavigationFromScroll(): void {
  const activeLink = getActiveNavigationLinkFromScroll()
  if (activeLink) {
    setActiveNavigation(activeLink)
  }
}

function updateNavigationAfterAnimationFrame(): void {
  scrollUpdatePending = false
  updateNavigationFromScroll()
}

let scrollUpdatePending = false
function scheduleScrollUpdate(): void {
  if (scrollUpdatePending) {
    return
  }

  scrollUpdatePending = true
  window.requestAnimationFrame(updateNavigationAfterAnimationFrame)
}

function handleHashChange(): void {
  updateActiveNavigation(getCurrentHash())
}

function handleWindowResize(): void {
  scheduleScrollUpdate()
}

function initializeFooterContactAnimation(): void {
  if (!footerContact || !('IntersectionObserver' in window)) {
    return
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      footerContact.classList.toggle('is-visible', entry.isIntersecting)
    },
    { threshold: 0.2 },
  )

  observer.observe(footerContact)
}

function initializeCarousels(): void {
  const carousels = document.querySelectorAll<HTMLElement>('[data-carousel]')

  carousels.forEach((carousel) => {
    const track = carousel.querySelector<HTMLElement>('[data-carousel-track]')
    const previousButton = carousel.querySelector<HTMLButtonElement>(
      '[data-carousel-direction="previous"]',
    )
    const nextButton = carousel.querySelector<HTMLButtonElement>(
      '[data-carousel-direction="next"]',
    )

    if (!track || !previousButton || !nextButton) {
      return
    }

    const updateButtonStates = (): void => {
      previousButton.disabled = track.scrollLeft <= 1
      nextButton.disabled =
        track.scrollLeft + track.clientWidth >= track.scrollWidth - 1
    }

    const updateOverflow = (): void => {
      const previousScrollLeft = track.scrollLeft
      Array.from(track.children).forEach((card) => {
        if (card instanceof HTMLElement) {
          card.style.flexBasis = ''
          card.style.flexGrow = ''
        }
      })
      carousel.classList.remove('is-scrollable')
      const hasOverflow = track.scrollWidth > track.clientWidth + 1
      carousel.classList.toggle('is-scrollable', hasOverflow)

      if (hasOverflow && carousel.closest('#fleet') && window.innerWidth > 1200) {
        const firstCard = track.firstElementChild
        const cardWidth = firstCard?.getBoundingClientRect().width ?? 0
        const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0
        const visibleCardCount = Math.max(
          1,
          Math.floor((track.clientWidth + gap) / (cardWidth + gap)),
        )
        const adjustedCardWidth =
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

    const scrollToAdjacentCard = (direction: 'previous' | 'next'): void => {
      const trackLeft = track.getBoundingClientRect().left
      const currentScrollLeft = track.scrollLeft
      const cardPositions = Array.from(track.children, (card) =>
        card.getBoundingClientRect().left - trackLeft + currentScrollLeft,
      )
      let targetPosition: number | undefined
      if (direction === 'next') {
        targetPosition = cardPositions.find((position) => position > currentScrollLeft + 1)
      } else if (direction === 'previous') {
        targetPosition = cardPositions
          .reverse()
          .find((position) => position < currentScrollLeft - 1)
      }

      if (targetPosition === undefined) {
        return
      }

      track.scrollTo({
        left: targetPosition,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
      })
    }

    previousButton.addEventListener('click', () => scrollToAdjacentCard('previous'))
    nextButton.addEventListener('click', () => scrollToAdjacentCard('next'))
    track.addEventListener('scroll', updateButtonStates, { passive: true })
    window.addEventListener('resize', updateOverflow)
    window.addEventListener('load', updateOverflow, { once: true })
    updateOverflow()
  })
}

function initializeMobileMenu(): void {
  const mobileMenu = document.querySelector<HTMLDetailsElement>('.mobile-menu')

  if (!mobileMenu) {
    return
  }

  mobileMenu.querySelectorAll<HTMLAnchorElement>('.mobile-menu-panel a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.open = false
    })
  })

  document.addEventListener('click', (event: MouseEvent) => {
    if (mobileMenu.open && event.target instanceof Node && !mobileMenu.contains(event.target)) {
      mobileMenu.open = false
    }
  })
}

function initializeNavigation(): void {
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
