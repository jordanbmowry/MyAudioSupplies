import { config as themeConfig } from '@archetype-themes/scripts/config'
import { prepareTransition, debounce } from '@archetype-themes/scripts/helpers/utils'
import { EVENTS, subscribe } from '@archetype-themes/utils/pubsub'

let selectors = {
  wrapper: '#HeaderWrapper',
  siteHeader: '#SiteHeader',
  megamenu: '.megamenu',
  triggerCollapsedMenu: '.site-nav__compress-menu',
  collapsedMenu: '[data-type="nav"]',
  bottomSearch: '[data-type="search"]',
  navDetails: '.site-nav__details'
}

let classes = {
  headerCompressed: 'header-wrapper--compressed',
  overlay: 'header-wrapper--overlay',
  overlayStyle: 'is-light'
}

let config = {
  wrapperOverlayed: false,
  stickyEnabled: false,
  stickyActive: false,
  subarPositionInit: false,
  threshold: 0
}

// Elements used in resize functions, defined in init
let wrapper
let siteHeader
let bottomNav
let bottomSearch

class HeaderNav extends HTMLElement {
  connectedCallback() {
    this.init()
  }

  init() {
    wrapper = document.querySelector(selectors.wrapper)
    siteHeader = document.querySelector(selectors.siteHeader)
    bottomNav = wrapper.querySelector(selectors.collapsedMenu)
    bottomSearch = wrapper.querySelector(selectors.bottomSearch)

    // Trigger collapsed state at top of header
    config.threshold = wrapper.getBoundingClientRect().bottom

    config.subarPositionInit = false
    config.stickyEnabled = siteHeader.dataset.sticky === 'true'
    if (config.stickyEnabled) {
      config.wrapperOverlayed = wrapper.classList.contains(classes.overlayStyle)
      this.stickyHeaderCheck()
    } else {
      this.disableSticky()
    }

    themeConfig.overlayHeader = siteHeader.dataset.overlay === 'true'
    // Disable overlay header if on collection template with no collection image
    if (themeConfig.overlayHeader && Shopify && Shopify.designMode) {
      if (document.body.classList.contains('template-collection') && !document.querySelector('.collection-hero')) {
        this.disableOverlayHeader()
      }
    }

    // Position menu and search bars absolutely, offsetting their height
    // with an invisible div to prevent reflows
    this.setAbsoluteBottom()
    window.addEventListener('resize', debounce(250, this.setAbsoluteBottom))

    let collapsedNavTrigger = wrapper.querySelector(selectors.triggerCollapsedMenu)
    if (collapsedNavTrigger && !collapsedNavTrigger.classList.contains('nav-trigger--initialized')) {
      collapsedNavTrigger.classList.add('nav-trigger--initialized')
      collapsedNavTrigger.addEventListener('click', function (e) {
        collapsedNavTrigger.classList.toggle('is-active')
        prepareTransition(bottomNav, function () {
          bottomNav.classList.toggle('is-active')
        })
      })
    }

    this.menuDetailsHandler()

    // Subscribe to sticky header check
    subscribe(EVENTS.headerStickyCheck, this.stickyHeaderCheck.bind(this))

    // Subscribe to overlay header disable
    subscribe(EVENTS.headerOverlayDisable, this.disableOverlayHeader)

    // Subscribe to overlay header remove class
    subscribe(EVENTS.headerOverlayRemoveClass, this.removeOverlayClass)
  }

  // Measure sub menu bar, set site header's bottom padding to it.
  // Set sub bars as absolute to avoid page jumping on collapsed state change.
  setAbsoluteBottom() {
    if (themeConfig.overlayHeader) {
      document.querySelector('.header-section').classList.add('header-section--overlay')
    }

    let activeSubBar = themeConfig.bpSmall
      ? document.querySelector('.site-header__element--sub[data-type="search"]')
      : document.querySelector('.site-header__element--sub[data-type="nav"]')

    if (activeSubBar) {
      let h = activeSubBar.offsetHeight
      // If height is 0, it was measured when hidden so ignore it.
      // Very likely it's on mobile when the address bar is being
      // hidden and triggers a resize
      if (h !== 0) {
        document.documentElement.style.setProperty('--header-padding-bottom', h + 'px')
      }

      // If not setup before, set active class on wrapper so subbars become absolute
      if (!config.subarPositionInit) {
        wrapper.classList.add('header-wrapper--init')
        config.subarPositionInit = true
      }
    }
  }

  // If the header setting to overlay the menu on the collection image
  // is enabled but the collection setting is disabled, we need to undo
  // the init of the sticky nav
  disableOverlayHeader() {
    wrapper.classList.remove(config.overlayEnabledClass, classes.overlayStyle)
    config.wrapperOverlayed = false
    themeConfig.overlayHeader = false
  }

  stickyHeaderCheck() {
    // Disable sticky header if any mega menu is taller than window
    themeConfig.stickyHeader = this.doesMegaMenuFit()

    if (themeConfig.stickyHeader) {
      config.forceStopSticky = false
      this.stickyHeader()
    } else {
      config.forceStopSticky = true
      this.disableSticky()
    }
  }

  disableSticky() {
    document.querySelector('.header-section').style.position = 'relative'
  }

  removeOverlayClass() {
    if (config.wrapperOverlayed) {
      wrapper.classList.remove(classes.overlayStyle)
    }
  }

  doesMegaMenuFit() {
    let largestMegaNav = 0
    const header = siteHeader || document.querySelector(selectors.siteHeader)
    header.querySelectorAll(selectors.megamenu).forEach((nav) => {
      let h = nav.offsetHeight
      if (h > largestMegaNav) {
        largestMegaNav = h
      }
    })

    // 120 ~ space of visible header when megamenu open
    if (window.innerHeight < largestMegaNav + 120) {
      return false
    }

    return true
  }

  stickyHeader() {
    if (window.scrollY > config.threshold) {
      this.stickyHeaderScroll()
    }

    window.addEventListener('scroll', this.stickyHeaderScroll.bind(this))
  }

  stickyHeaderScroll() {
    if (!config.stickyEnabled) {
      return
    }

    if (config.forceStopSticky) {
      return
    }

    requestAnimationFrame(this.scrollHandler)
  }

  scrollHandler() {
    if (window.scrollY > config.threshold) {
      if (config.stickyActive) {
        return
      }

      if (bottomNav) {
        prepareTransition(bottomNav)
      }
      if (bottomSearch) {
        prepareTransition(bottomSearch)
      }

      config.stickyActive = true

      wrapper.classList.add(classes.headerCompressed)

      if (config.wrapperOverlayed) {
        wrapper.classList.remove(classes.overlayStyle)
      }

      document.dispatchEvent(new CustomEvent('headerStickyChange'))
    } else {
      if (!config.stickyActive) {
        return
      }

      if (bottomNav) {
        prepareTransition(bottomNav)
      }
      if (bottomSearch) {
        prepareTransition(bottomSearch)
      }

      config.stickyActive = false

      // Update threshold in case page was loaded down the screen
      config.threshold = wrapper.getBoundingClientRect().bottom

      wrapper.classList.remove(classes.headerCompressed)

      if (config.wrapperOverlayed) {
        wrapper.classList.add(classes.overlayStyle)
      }

      document.dispatchEvent(new CustomEvent('headerStickyChange'))
    }
  }

  menuDetailsHandler() {
    const navDetails = document.querySelectorAll(selectors.navDetails)

    navDetails.forEach((navDetail) => {
      const summary = navDetail.querySelector('summary')

      // if the navDetail is open, then close it when the user clicks outside of it
      document.addEventListener('click', (evt) => {
        if (navDetail.hasAttribute('open') && !navDetail.contains(evt.target)) {
          navDetail.removeAttribute('open')
          summary.setAttribute('aria-expanded', 'false')
        } else {
          if (navDetail.hasAttribute('open')) {
            summary.setAttribute('aria-expanded', 'false')
          } else {
            summary.setAttribute('aria-expanded', 'true')
          }
        }
      })
    })
  }
}

customElements.define('header-nav', HeaderNav)
