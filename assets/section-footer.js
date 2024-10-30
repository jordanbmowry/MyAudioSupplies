import { config } from '@archetype-themes/scripts/config'

class FooterSection extends HTMLElement {
  constructor() {
    super()

    this.ids = {
      mobileNav: 'MobileNav',
      footerNavWrap: 'FooterMobileNavWrap',
      footerNav: 'FooterMobileNav'
    }

    /**
     * @event footer-section:loaded
     * @description Fired when the footer section has been loaded.
     * @param {string} detail.sectionId - The section's ID.
     */
    document.dispatchEvent(
      new CustomEvent('footer-section:loaded', {
        detail: {
          sectionId: this.sectionId
        }
      })
    )

    this.init()
  }

  init() {
    // Change email icon to submit text
    const newsletterInput = document.querySelector('.footer__newsletter-input')
    if (newsletterInput) {
      newsletterInput.addEventListener('keyup', function () {
        newsletterInput.classList.add('footer__newsletter-input--active')
      })
    }

    // If on mobile, copy the mobile nav to the footer
    if (config.bpSmall) {
      this.initDoubleMobileNav()
    }
  }

  initDoubleMobileNav() {
    const menuPlaceholder = document.getElementById(this.ids.footerNavWrap)
    if (!menuPlaceholder) {
      return
    }

    const mobileNav = document.getElementById(this.ids.mobileNav)
    const footerNav = document.getElementById(this.ids.footerNav)
    const clone = mobileNav.cloneNode(true)
    const navEl = clone.querySelector('.slide-nav__wrapper')
    navEl.setAttribute('container', this.ids.footerNav)
    navEl.setAttribute('inHeader', 'false')

    // Append cloned nav to footer, initialize JS, then show it
    footerNav.appendChild(navEl)

    menuPlaceholder.classList.remove('hide')
  }
}

customElements.define('footer-section', FooterSection)
