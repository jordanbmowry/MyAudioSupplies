import { config } from '@archetype-themes/scripts/config'
import { EVENTS, publish } from '@archetype-themes/utils/pubsub'

let hasLoadedBefore = false

class CollectionHeader extends HTMLElement {
  constructor() {
    super()
    this.namespace = '.collection-header'

    var heroImageContainer = this.querySelector('.collection-hero')
    if (heroImageContainer) {
      if (hasLoadedBefore) {
        this.checkIfNeedReload()
      }

      heroImageContainer.classList.remove('loading', 'loading--delayed')
      heroImageContainer.classList.add('loaded')
    } else if (config.overlayHeader) {
      publish(EVENTS.headerOverlayDisable)
    }

    hasLoadedBefore = true
  }

  checkIfNeedReload() {
    if (!Shopify.designMode) {
      return
    }

    if (config.overlayHeader) {
      var header = document.querySelector('.header-wrapper')
      if (!header.classList.contains('header-wrapper--overlay')) {
        location.reload()
      }
    }
  }
}

customElements.define('section-collection-header', CollectionHeader)
