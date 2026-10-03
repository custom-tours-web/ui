const navigationLinks = document.querySelectorAll<HTMLAnchorElement>(".main-nav a[href^='#']");
const mainNavigation = document.querySelector<HTMLElement>(".main-nav");

function getCurrentHash(): string {
  return window.location.hash || "#home";
}

function findNavigationLinkByHash(hash: string): HTMLAnchorElement | null {
  for (let i = 0; i < navigationLinks.length; i += 1) {
    if (navigationLinks[i].hash === hash) {
      return navigationLinks[i];
    }
  }

  return null;
}

function updateNavigationIndicator(activeLink: HTMLAnchorElement): void {
  mainNavigation?.style.setProperty("--active-link-left", `${activeLink.offsetLeft}px`);
  mainNavigation?.style.setProperty("--active-link-width", `${activeLink.offsetWidth}px`);
}

function updateNavigationLinkStates(activeLink: HTMLAnchorElement): void {
  for (let i = 0; i < navigationLinks.length; i += 1) {
    const link = navigationLinks[i];
    const isActive = link === activeLink;

    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  }
}

function setActiveNavigation(activeLink: HTMLAnchorElement): void {
  updateNavigationIndicator(activeLink);
  updateNavigationLinkStates(activeLink);
}

function updateActiveNavigation(hash: string): void {
  const matchingLink = findNavigationLinkByHash(hash);
  if (matchingLink) {
    setActiveNavigation(matchingLink);
  }
}

function getNavigationActivationLine(): number {
  const header = document.querySelector<HTMLElement>(".site-header");
  const scrollPaddingTop =
    Number.parseFloat(window.getComputedStyle(document.documentElement).scrollPaddingTop) || 0;

  return Math.max(header?.getBoundingClientRect().bottom ?? 0, scrollPaddingTop) + 1;
}

function findActiveNavigationLinkFromScroll(activationLine: number): HTMLAnchorElement | null {
  let activeLink: HTMLAnchorElement | null = null;

  for (let i = 0; i < navigationLinks.length; i += 1) {
    const target = document.getElementById(navigationLinks[i].hash.slice(1));
    if (target && target.getBoundingClientRect().top <= activationLine) {
      activeLink = navigationLinks[i];
    }
  }

  return activeLink;
}

function isAtPageBottom(): boolean {
  return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
}

function isAtDestinationsAnchor(): boolean {
  return window.location.hash === navigationLinks[navigationLinks.length - 2]?.hash;
}

function findLastNavigationLink(): HTMLAnchorElement | null {
  if (navigationLinks.length > 0 && isAtPageBottom() && !isAtDestinationsAnchor()) {
    return navigationLinks[navigationLinks.length - 1];
  }

  return null;
}

function getActiveNavigationLinkFromScroll(): HTMLAnchorElement | null {
  const activationLine = getNavigationActivationLine();
  const activeLink = findActiveNavigationLinkFromScroll(activationLine);

  return findLastNavigationLink() ?? activeLink;
}

function updateNavigationFromScroll(): void {
  const activeLink = getActiveNavigationLinkFromScroll();
  if (activeLink) {
    setActiveNavigation(activeLink);
  }
}

function updateNavigationAfterAnimationFrame(): void {
  scrollUpdatePending = false;
  updateNavigationFromScroll();
}

let scrollUpdatePending = false;
function scheduleScrollUpdate(): void {
  if (scrollUpdatePending) {
    return;
  }

  scrollUpdatePending = true;
  window.requestAnimationFrame(updateNavigationAfterAnimationFrame);
}

function handleHashChange(): void {
  updateActiveNavigation(getCurrentHash());
}

function handleWindowResize(): void {
  scheduleScrollUpdate();
}

function initializeNavigation(): void {
  updateActiveNavigation(getCurrentHash());
  scheduleScrollUpdate();

  window.addEventListener("hashchange", handleHashChange);
  window.addEventListener("scroll", scheduleScrollUpdate, { passive: true });
  window.addEventListener("resize", handleWindowResize);
}

initializeNavigation();
