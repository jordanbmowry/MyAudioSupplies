import { config } from '@archetype-themes/scripts/config'
import HeaderCart from '@archetype-themes/scripts/modules/cart-drawer'
import { debounce, sizeDrawer } from '@archetype-themes/scripts/helpers/utils'
import { EVENTS, publish, subscribe } from '@archetype-themes/utils/pubsub'

class HeaderSection extends HTMLElement {
  constructor() {
    super()

    this.namespace = '.header'
    this.headerFooter = this.querySelector('#MobileNavFooter')
    this.footerMenus = document.querySelector('#FooterMenus')
    this.sectionID = this.getAttribute('data-section-id')
    this.detailsEl = this.querySelectorAll('[data-section-type="header"] details[data-hover="true"]')
    // Trigger to open header nav
    this.openTrigger = this.querySelector('.mobile-nav-trigger')
    this.isMobileNavOpen = false
    // Trigger to open header search
    this.searchTrigger = this.querySelector('.js-search-header')
    this.inlineSearchContainer = this.querySelector('.site-header__search-container')
    this.boundDocumentClick = this.handleDocumentClick.bind(this)

    this.init()

    /**
     * @event header-section:loaded
     * @description Fired when the header section has been loaded.
     * @param {string} detail.sectionId - The section's ID.
     * @param {boolean} bubbles - Whether the event bubbles up through the DOM or not.
     */
    document.dispatchEvent(
      new CustomEvent('header-section:loaded', {
        detail: {
          sectionID: this.sectionID
        },
        bubbles: true
      })
    )
  }

  init() {
    // Open/close mobile nav
    this.openTrigger.addEventListener('click', () => {
      if (this.isMobileNavOpen) {
        publish(EVENTS.mobileNavClose)
        this.openTrigger.classList.remove('is-active')
        this.isMobileNavOpen = false
      } else {
        publish(EVENTS.mobileNavOpen)
        this.isMobileNavOpen = true
        this.openTrigger.classList.add('is-active')
      }
    })

    subscribe(EVENTS.mobileNavClosed, () => {
      this.openTrigger.classList.remove('is-active')
      this.isMobileNavOpen = false
    })

    // Open header search
    this.searchTrigger.addEventListener('click', this.openInlineSearch.bind(this))

    if (Shopify && Shopify.designMode) {
      // Set a timer to resize the header in case the logo changes size
      setTimeout(function () {
        window.dispatchEvent(new Event('resize'))
      }, 500)
    }

    this.hoverMenu()

    // Enable header cart drawer when not on cart page
    if (!document.body.classList.contains('template-cart')) {
      new HeaderCart()
    }

    if (config.bpSmall) {
      this.cloneFooter()
    }

    window.addEventListener('resize', debounce(300, sizeDrawer))
  }

  hoverMenu() {
    this.detailsEl.forEach((detail) => {
      const summary = detail.querySelector('summary')
      const summaryLink = summary.dataset.link

      summary.addEventListener('click', (e) => {
        e.preventDefault()

        if (!detail.hasAttribute('open')) {
          detail.setAttribute('open', '')
          detail.setAttribute('aria-expanded', 'true')
        } else {
          window.location.href = summaryLink
        }
      })

      detail.addEventListener('focusout', (e) => {
        const isChild = detail.contains(e.relatedTarget)

        if (!isChild) {
          detail.removeAttribute('open')
          detail.setAttribute('aria-expanded', 'false')
        }
      })

      detail.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && detail.hasAttribute('open')) {
          detail.removeAttribute('open')
          detail.setAttribute('aria-expanded', 'false')
          summary.focus()
        }
      })

      detail.addEventListener('mouseover', () => {
        if (!detail.hasAttribute('open')) {
          detail.setAttribute('open', '')
          detail.setAttribute('aria-expanded', 'true')
        }
      })

      detail.addEventListener('mouseleave', () => {
        if (detail.hasAttribute('open')) {
          detail.removeAttribute('open')
          detail.setAttribute('aria-expanded', 'false')
        }
      })
    })
  }

  cloneFooter() {
    if (!this.headerFooter) {
      return
    }

    const clone = this.footerMenus.cloneNode(true)
    clone.id = ''

    // Append cloned footer menus to mobile nav
    this.headerFooter.appendChild(clone)

    // If localization form, update IDs so they don't match footer
    const localizationForm = this.headerFooter.querySelector('.multi-selectors')
    if (localizationForm) {
      // Loop disclosure buttons and update ids and aria attributes
      localizationForm.querySelectorAll('[data-disclosure-toggle]').forEach((el) => {
        const controls = el.getAttribute('aria-controls')
        const describedby = el.getAttribute('aria-describedby')

        el.setAttribute('aria-controls', controls + '-header')
        el.setAttribute('aria-describedby', describedby + '-header')

        const list = document.getElementById(controls)
        if (list) {
          list.id = controls + '-header'
        }

        const label = document.getElementById(describedby)
        if (label) {
          label.id = describedby + '-header'
        }
      })
    }
  }

  openInlineSearch(evt) {
    evt.preventDefault()
    evt.stopImmediatePropagation()
    let container = this.querySelector('.site-header__search-container')
    container.classList.add('is-active')

    publish(EVENTS.predictiveSearchOpen, {
      detail: {
        context: 'header'
      }
    })

    this.enableCloseListeners()
  }

  enableCloseListeners() {
    // Clicking out of search area closes it. Timeout to prevent immediate bubbling
    setTimeout(() => {
      document.addEventListener('click', this.boundDocumentClick)
    }, 0)

    this.searchCloseAllUnsubscribe = subscribe(EVENTS.predictiveSearchCloseAll, () => {
      this.searchCloseAllUnsubscribe()
      this.close()
    })
  }

  handleDocumentClick(evt) {
    this.close(evt)
  }

  close(evt) {
    // If close button is clicked, close as expected.
    // Otherwise, ignore clicks in search results, search form, or container elements
    if (evt && evt.target.closest) {
      if (evt.target.closest('.site-header__element--sub')) {
        return
      } else if (evt.target.closest('#SearchResultsWrapper')) {
        return
      } else if (evt.target.closest('.site-header__search-container')) {
        return
      }
    }

    publish(EVENTS.predictiveSearchClose)

    document.activeElement.blur()

    if (this.inlineSearchContainer) {
      this.inlineSearchContainer.classList.remove('is-active')
    }

    document.removeEventListener('click', this.boundDocumentClick)
  }
}

customElements.define('header-section', HeaderSection)
