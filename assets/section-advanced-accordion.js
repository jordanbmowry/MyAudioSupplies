import { HTMLSectionElement } from '@archetype-themes/scripts/helpers/section'

class AdvancedAccordion extends HTMLSectionElement {
  constructor() {
    super()
    this.accordion = this.querySelector('.advanced-accordion')
  }

  onSectionLoad() {
    this.accordion.setAttribute('open', '')
  }

  onBlockSelect() {
    this.accordion.setAttribute('open', '')
  }
}

customElements.define('advanced-accordion', AdvancedAccordion)
