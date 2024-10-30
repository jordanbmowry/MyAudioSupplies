import { unlockMobileScrolling, lockMobileScrolling } from '@archetype-themes/scripts/helpers/a11y'
import { prepareTransition } from '@archetype-themes/scripts/helpers/utils'

let selectors = {
  sidebarId: 'CollectionSidebar',
  trigger: '.collection-filter__btn',
  mobileWrapper: '#CollectionInlineFilterWrap',
  filters: '.filter-wrapper',
  filterBar: '.collection-filter'
}

let config = {
  isOpen: false,
  namespace: '.collection-filters'
}

function getScrollFilterTop() {
  let scrollTop = window.pageYOffset || document.documentElement.scrollTop
  let elTop = document.querySelector(selectors.filterBar).getBoundingClientRect().top
  return elTop + scrollTop
}

// Set a max-height on drawers when they're opened via CSS variable
// to account for changing mobile window heights
function sizeDrawer() {
  let header = document.getElementById('HeaderWrapper').offsetHeight
  let filters = document.querySelector(selectors.filterBar).offsetHeight
  let max = window.innerHeight - header - filters
  document.documentElement.style.setProperty('--maxFiltersHeight', `${max}px`)
}

export default class CollectionSidebar {
  constructor() {
    // Do not load when no sidebar exists
    if (!document.getElementById(selectors.sidebarId)) {
      return
    }

    document.addEventListener('filter:selected', this.close.bind(this))
    this.init()
  }

  init() {
    config.isOpen = false
    unlockMobileScrolling()

    // This function runs on page load, and when the collection section loads
    // so we need to be mindful of not duplicating event listeners
    this.container = document.getElementById(selectors.sidebarId)
    this.trigger = document.querySelector(selectors.trigger)
    this.wrapper = document.querySelector(selectors.mobileWrapper)
    this.filters = this.wrapper.querySelector(selectors.filters)

    this.trigger.removeEventListener('click', this._toggleHandler)
    this._toggleHandler = this.toggle.bind(this)
    this.trigger.addEventListener('click', this._toggleHandler)
  }

  /*============================================================================
    Open and close filter drawer
  ==============================================================================*/
  toggle() {
    if (config.isOpen) {
      this.close()
    } else {
      this.open()
    }
  }

  open() {
    sizeDrawer()

    // Scroll to top of filter bar when opened
    let scrollTo = getScrollFilterTop()
    window.scrollTo({ top: scrollTo, behavior: 'smooth' })

    this.trigger.classList.add('is-active')

    prepareTransition(
      this.filters,
      function () {
        this.filters.classList.add('is-active')
      }.bind(this)
    )
    config.isOpen = true

    lockMobileScrolling()

    // Bind the keyup event handler
    this._keyupHandler = (evt) => {
      if (evt.keyCode === 27) {
        this.close()
      }
    }
    window.addEventListener('keyup', this._keyupHandler)
  }

  close() {
    this.trigger.classList.remove('is-active')

    prepareTransition(
      this.filters,
      function () {
        this.filters.classList.remove('is-active')
      }.bind(this)
    )
    config.isOpen = false

    unlockMobileScrolling()

    // Remove the keyup event handler
    window.removeEventListener('keyup', this._keyupHandler)
  }

  onSelect() {
    this.open()
  }

  onDeselect() {
    this.close()
  }
}
