import { prepareTransition, sizeDrawer } from '@archetype-themes/scripts/helpers/utils'
import { EVENTS, subscribe, publish } from '@archetype-themes/utils/pubsub'

let selectors = {
  wrapper: '.slide-nav__wrapper',
  nav: '.slide-nav',
  childList: '.slide-nav__dropdown',
  allLinks: 'a.slide-nav__link',
  subNavToggleBtn: '.js-toggle-submenu'
}

let classes = {
  isActive: 'is-active'
}

let defaults = {
  isOpen: false,
  menuLevel: 1,
  inHeader: false
}

/*============================================================================
  MobileNav has two uses:
  - Dropdown from header on small screens
  - Duplicated into footer, initialized as separate entity in HeaderSection
==============================================================================*/
class MobileNav extends HTMLElement {
  constructor() {
    super()
    this.config = Object.assign({}, defaults)
    this.config.inHeader = this.getAttribute('inHeader') === 'true'
  }

  connectedCallback() {
    this.container = document.getElementById(this.getAttribute('container'))
    if (!this.container) {
      return
    }

    this.wrapper = this.container.querySelector(selectors.wrapper)
    if (!this.wrapper) {
      return
    }
    this.nav = this.wrapper.querySelector(selectors.nav)

    this.init()
  }

  init() {
    // Toggle between menu levels
    this.nav.querySelectorAll(selectors.subNavToggleBtn).forEach((btn) => {
      btn.addEventListener('click', this.toggleSubNav.bind(this))
    })

    // Close nav when a normal link is clicked
    this.nav.querySelectorAll(selectors.allLinks).forEach((link) => {
      link.addEventListener('click', this.close.bind(this))
    })

    if (this.config.inHeader) {
      document.addEventListener(
        'unmatchSmall',
        function () {
          this.close(null, true)
        }.bind(this)
      )

      // Dev-friendly way to open/close mobile nav
      subscribe(EVENTS.mobileNavOpen, this.open.bind(this))
      subscribe(EVENTS.mobileNavClose, this.close.bind(this))
    }
  }

  /*============================================================================
    Open/close mobile nav drawer in header
  ==============================================================================*/
  open(evt) {
    if (evt) {
      evt.preventDefault()
    }

    sizeDrawer()

    prepareTransition(
      this.container,
      function () {
        this.container.classList.add('is-active')
      }.bind(this)
    )

    // Esc closes cart popup
    window.addEventListener('keyup', this.handleWindowKeyup)

    publish(EVENTS.headerOverlayRemoveClass)

    document.documentElement.classList.add('mobile-nav-open')
    document.dispatchEvent(new CustomEvent('MobileNav:open'))

    this.config.isOpen = true

    // Clicking out of menu closes it. Timeout to prevent immediate bubbling
    setTimeout(() => {
      window.addEventListener('click', this.handleWindowClick)
    }, 0)
  }

  handleWindowKeyup = (evt) => {
    if (evt.keyCode === 27) {
      this.close()
    }
  }

  handleWindowClick = (evt) => {
    this.close(evt)
  }

  close(evt, noAnimate) {
    let forceClose = false
    // Do not close if click event came from inside drawer,
    // unless it is a normal link with no children
    if (evt && evt.target.closest && evt.target.closest('.site-header__drawer')) {
      // If normal link, continue to close drawer
      if (evt.currentTarget && evt.currentTarget.classList) {
        if (evt.currentTarget.classList.contains('slide-nav__link')) {
          forceClose = true
        }
      }

      if (!forceClose) {
        return
      }
    }

    publish(EVENTS.mobileNavClosed)

    if (noAnimate) {
      this.container.classList.remove('is-active')
    } else {
      prepareTransition(
        this.container,
        function () {
          this.container.classList.remove('is-active')
        }.bind(this)
      )
    }

    document.documentElement.classList.remove('mobile-nav-open')
    document.dispatchEvent(new CustomEvent('MobileNav:close'))

    window.removeEventListener('keyup', this.handleWindowKeyup)
    window.removeEventListener('click', this.handleWindowClick)

    this.config.isOpen = false
  }

  /*============================================================================
    Handle switching between nav levels
  ==============================================================================*/
  toggleSubNav(evt) {
    let btn = evt.currentTarget
    this.goToSubnav(btn.dataset.target)
  }

  // If a level is sent we are going up, so target list doesn't matter
  goToSubnav(target) {
    // Activate new list if a target is passed
    let targetMenu = this.nav.querySelector(selectors.childList + '[data-parent="' + target + '"]')
    if (targetMenu) {
      this.config.menuLevel = targetMenu.dataset.level

      // Hide all level 3 menus if going to level 2
      if (this.config.menuLevel == 2) {
        this.nav.querySelectorAll(selectors.childList + '[data-level="3"]').forEach((list) => {
          list.classList.remove(classes.isActive)
        })
      }

      targetMenu.classList.add(classes.isActive)
      this.setWrapperHeight(targetMenu.offsetHeight)
    } else {
      // Going to top level, reset
      this.config.menuLevel = 1
      this.wrapper.removeAttribute('style')
      this.nav.querySelectorAll(selectors.childList).forEach((list) => {
        list.classList.remove(classes.isActive)
      })
    }

    this.wrapper.dataset.level = this.config.menuLevel
  }

  setWrapperHeight(h) {
    this.wrapper.style.height = h + 'px'
  }
}

customElements.define('mobile-nav', MobileNav)
