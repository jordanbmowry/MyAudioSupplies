// This is the javascript entrypoint for the announcement-bar snippet.
// This file and all its inclusions will be processed through postcss

import { config } from '@archetype-themes/scripts/config'
import { HTMLSectionElement } from '@archetype-themes/scripts/helpers/section'
import { Slideshow } from '@archetype-themes/scripts/modules/slideshow'

class AnnouncementBar extends HTMLSectionElement {
  connectedCallback() {
    super.connectedCallback()

    if (parseInt(this.dataset.blockCount) === 1) {
      return
    }

    const args = {
      autoPlay: 5000,
      avoidReflow: true,
      cellAlign: config.rtl ? 'right' : 'left',
      fade: true
    }

    this.flickity = new Slideshow(this, args)
  }

  disconnectedCallback() {
    super.disconnectedCallback()

    if (this.flickity && typeof this.flickity.destroy === 'function') {
      this.flickity.destroy()
    }
  }

  // Go to slide if selected in the editor
  onBlockSelect({ detail: { blockId } }) {
    const slide = this.querySelector('#AnnouncementSlide-' + blockId)
    const index = parseInt(slide.dataset.index)

    if (this.flickity && typeof this.flickity.pause === 'function') {
      this.flickity.goToSlide(index)
      this.flickity.pause()
    }
  }

  onBlockDeselect() {
    if (this.flickity && typeof this.flickity.play === 'function') {
      this.flickity.play()
    }
  }
}

customElements.define('announcement-bar', AnnouncementBar)
