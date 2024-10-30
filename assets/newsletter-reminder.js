import Cookies from 'js-cookie'
import Modals from '@archetype-themes/scripts/modules/modal'
import { HTMLSectionElement } from '@archetype-themes/scripts/helpers/section'

/*============================================================================
  NewsletterReminder
==============================================================================*/

class NewsletterReminder extends HTMLSectionElement {
  constructor() {
    super()
    this.closeBtn = this.querySelector('[data-close-button]')
    this.popupTrigger = this.querySelector('[data-message]')

    this.newsletterId = `NewsletterPopup-${this.sectionId}`
    this.cookie = Cookies.get(`newsletter-${this.sectionId}`)
    this.cookieName = `newsletter-${this.sectionId}`
    this.secondsBeforeShow = this.dataset.delaySeconds
    this.expiry = parseInt(this.dataset.delayDays)
    this.modal = new Modals(`NewsletterPopup-${this.newsletterId}`, 'newsletter-popup-modal')

    this.init()
  }

  connectedCallback() {
    super.connectedCallback()
    this.style.display = 'block'
  }

  init() {
    document.addEventListener(`modalOpen.${this.newsletterId}`, () => this.hide())
    document.addEventListener(`modalClose.${this.newsletterId}`, () => this.show())
    document.addEventListener(`newsletter:openReminder`, () => this.show(0))

    this.closeBtn.addEventListener('click', () => {
      this.hide()
      Cookies.set(this.cookieName, 'opened', { path: '/', expires: this.expiry })
    })

    this.popupTrigger.addEventListener('click', () => {
      /**
       * @event reminder:openNewsletter
       * @description Fired when the reminder to open the newsletter is triggered.
       * @param {boolean} bubbles - Indicates whether the event bubbles up through the DOM or not.
       */
      const reminderOpen = new CustomEvent('reminder:openNewsletter', { bubbles: true })
      this.dispatchEvent(reminderOpen)

      this.hide()
    })
  }

  show(time = this.secondsBeforeShow, forceOpen = false) {
    const reminderAppeared = sessionStorage.getItem('reminderAppeared') === 'true'

    if (!reminderAppeared || forceOpen) {
      setTimeout(() => {
        this.dataset.enabled = 'true'
        sessionStorage.setItem('reminderAppeared', true)
      }, time * 1000)
    }
  }

  hide() {
    this.dataset.enabled = 'false'
  }

  onBlockSelect() {
    this.show(0, true)
  }

  onBlockDeselect() {
    this.hide()
  }
}

customElements.define('newsletter-reminder', NewsletterReminder)
