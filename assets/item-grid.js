import { config } from '@archetype-themes/scripts/config'
import CollectionSidebar from '@archetype-themes/scripts/modules/collection-sidebar'
import AjaxRenderer from '@archetype-themes/scripts/helpers/ajax-renderer'
import { updateAttribute } from '@archetype-themes/scripts/helpers/cart'
import { debounce } from '@archetype-themes/scripts/helpers/utils'
import { EVENTS, publish } from '@archetype-themes/utils/pubsub'

class ItemGrid extends HTMLElement {
  constructor() {
    super()
    this.isAnimating = false
    this.abortController = new AbortController()

    this.selectors = {
      sortSelect: '#SortBy',
      sortBtn: '.filter-sort',

      viewChange: '.grid-view-btn',
      productGrid: '.product-grid',

      collectionGrid: '.collection-grid__wrapper',
      sidebar: '#CollectionSidebar',
      activeTagList: '.tag-list--active-tags',
      tags: '.tag-list input',
      activeTags: '.tag-list a',
      tagsForm: '.filter-form',
      filterBar: '.collection-filter',
      priceRange: '.price-range',
      trigger: '.collapsible-trigger',

      filters: '.filter-wrapper',
      sidebarWrapper: '#CollectionSidebarFilterWrap',
      inlineWrapper: '#CollectionInlineFilterWrap'
    }

    this.config = {
      mobileFiltersInPlace: false
    }

    this.classes = {
      activeTag: 'tag--active',
      removeTagParent: 'tag--remove',
      collapsibleContent: 'collapsible-content',
      isOpen: 'is-open'
    }

    this.sectionId = this.getAttribute('data-section-id')
    this.ajaxRenderer = new AjaxRenderer({
      sections: [{ sectionId: this.sectionId, nodeId: 'AjaxContent' }],
      onReplace: this.onReplaceAjaxContent.bind(this)
    })

    document.dispatchEvent(
      new CustomEvent('collection-component:loaded', {
        detail: {
          sectionId: this.sectionId
        }
      })
    )
  }

  connectedCallback() {
    this.init()
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

  init() {
    this.config.mobileFiltersInPlace = false

    this.cloneFiltersOnMobile()
    this.initSort()
    this.initFilters()
    this.initPriceRange()
    this.initGridOptions()

    this.sidebar = new CollectionSidebar()
  }

  initSort() {
    this.queryParams = new URLSearchParams(window.location.search)
    this.sortSelect = document.querySelector(this.selectors.sortSelect)
    this.sortBtns = document.querySelectorAll(this.selectors.sortBtn)

    if (this.sortSelect) {
      this.defaultSort = this.getDefaultSortValue()
      this.sortSelect.addEventListener('change', () => {this.onSortChange()}, { signal: this.abortController.signal })
    }

    if (this.sortBtns.length) {
      this.sortBtns.forEach((btn) => {
        btn.addEventListener(
          'click',
          () => {
            document.dispatchEvent(new Event('filter:selected'))
            const sortValue = btn.dataset.value
            this.onSortChange(sortValue)
          },
          { signal: this.abortController.signal }
        )
      })
    }
  }

  getSortValue() {
    return this.sortSelect.value || this.defaultSort
  }

  getDefaultSortValue() {
    return this.sortSelect.getAttribute('data-default-sortby')
  }

  onSortChange(sortValue = null) {
    this.queryParams = new URLSearchParams(window.location.search)

    if (sortValue) {
      this.queryParams.set('sort_by', sortValue)
    } else {
      this.queryParams.set('sort_by', this.getSortValue())
    }

    this.queryParams.delete('page')
    window.location.search = this.queryParams.toString()
  }

  initGridOptions() {
    const grid = this.querySelector(this.selectors.productGrid)
    const viewBtns = this.querySelectorAll(this.selectors.viewChange)
    viewBtns.forEach((btn) => {
      btn.addEventListener(
        'click',
        () => {
          viewBtns.forEach((el) => {
            el.classList.remove('is-active')
          })
          btn.classList.add('is-active')
          const newView = btn.dataset.view
          grid.dataset.view = newView
          
          updateAttribute('product_view', newView)

          window.dispatchEvent(new Event('resize'))
        },
        { signal: this.abortController.signal }
      )
    })
  }

  initFilters() {
    const filterBar = document.querySelectorAll(this.selectors.filterBar)

    if (!filterBar.length) {
      return
    }

    document.addEventListener('matchSmall', this.cloneFiltersOnMobile.bind(this), {
      signal: this.abortController.signal
    })
    this.bindBackButton()

    publish(EVENTS.headerStickyCheck)
    if (config.stickyHeader) {
      this.setFilterStickyPosition()

      document.addEventListener('headerStickyChange', debounce(500, this.setFilterStickyPosition.bind(this)), {
        signal: this.abortController.signal
      })
      window.addEventListener('resize', debounce(500, this.setFilterStickyPosition.bind(this)), {
        signal: this.abortController.signal
      })
    }

    document.querySelectorAll(this.selectors.activeTags).forEach((tag) => {
      tag.addEventListener('click', this.onTagClick.bind(this), { signal: this.abortController.signal })
    })

    document.querySelectorAll(this.selectors.tagsForm).forEach((form) => {
      form.addEventListener('input', this.onFormSubmit.bind(this), { signal: this.abortController.signal })
    })
  }

  initPriceRange() {
    document.addEventListener('price-range:change', this.onPriceRangeChange.bind(this), {
      once: true,
      signal: this.abortController.signal
    })
  }

  onPriceRangeChange(event) {
    this.renderFromFormData(event.detail)
  }

  cloneFiltersOnMobile() {
    if (this.config.mobileFiltersInPlace) {
      return
    }

    const sidebarWrapper = document.querySelector(this.selectors.sidebarWrapper)
    if (!sidebarWrapper) {
      return
    }
    const filters = sidebarWrapper.querySelector(this.selectors.filters).cloneNode(true)

    const inlineWrapper = document.querySelector(this.selectors.inlineWrapper)

    inlineWrapper.innerHTML = ''
    inlineWrapper.append(config.filtersPrime ?? filters)
    config.filtersPrime = null

    this.config.mobileFiltersInPlace = true
  }

  renderActiveTag(parent, el) {
    const textEl = parent.querySelector('.tag__text')

    if (parent.classList.contains(this.classes.activeTag)) {
      parent.classList.remove(this.classes.activeTag)
    } else {
      parent.classList.add(this.classes.activeTag)

      if (el.closest('li').classList.contains(this.classes.removeTagParent)) {
        parent.remove()
      } else {
        document.querySelectorAll(this.selectors.activeTagList).forEach((list) => {
          const newTag = document.createElement('li')
          const newTagLink = document.createElement('a')
          newTag.classList.add('tag', 'tag--remove')
          newTagLink.classList.add('btn', 'btn--small')
          newTagLink.innerText = textEl.innerText
          newTag.appendChild(newTagLink)

          list.appendChild(newTag)
        })
      }
    }
  }

  onTagClick(evt) {
    const el = evt.currentTarget

    document.dispatchEvent(new Event('filter:selected'))

    if (el.classList.contains('no-ajax')) {
      return
    }

    evt.preventDefault()
    if (this.isAnimating) {
      return
    }

    this.isAnimating = true

    const parent = el.parentNode
    const newUrl = new URL(el.href)

    this.renderActiveTag(parent, el)
    this.updateScroll(true)
    this.startLoading()
    this.renderCollectionPage(newUrl.searchParams)
  }

  onFormSubmit(evt) {
    const el = evt.target

    document.dispatchEvent(new Event('filter:selected'))

    if (el.classList.contains('no-ajax')) {
      return
    }

    evt.preventDefault()
    if (this.isAnimating) {
      return
    }

    this.isAnimating = true

    const parent = el.closest('li')
    const formEl = el.closest('form')
    const formData = new FormData(formEl)

    this.renderActiveTag(parent, el)
    this.updateScroll(true)
    this.startLoading()
    this.renderFromFormData(formData)
  }

  onReplaceAjaxContent(newDom, section) {
    const openCollapsibleIds = this.fetchOpenCollapsibleFilters()

    openCollapsibleIds.forEach((selector) => {
      newDom.querySelectorAll(`[data-collapsible-id=${selector}]`).forEach(this.openCollapsible.bind(this))
    })

    const newContentEl = newDom.getElementById(section.nodeId)
    if (!newContentEl) {
      return
    }

    document.getElementById(section.nodeId).innerHTML = newContentEl.innerHTML

    const page = document.getElementById(section.nodeId)
    const countEl = page.querySelector('.collection-filter__item--count')
    if (countEl) {
      const count = countEl.innerText
      document.querySelectorAll('[data-collection-count]').forEach((el) => {
        el.innerText = count
      })
    }
  }

  renderFromFormData(formData) {
    const searchParams = new URLSearchParams(formData)
    this.renderCollectionPage(searchParams)
  }

  renderCollectionPage(searchParams, updateURLHash = true) {
    this.ajaxRenderer.renderPage(window.location.pathname, searchParams, updateURLHash).then(() => {
      this.init()
      this.updateScroll(false)

      document.dispatchEvent(new CustomEvent('collection:reloaded'))

      this.isAnimating = false
    })
  }

  updateScroll(animate) {
    let scrollTo = document.getElementById('AjaxContent').offsetTop

    // Scroll below the sticky header
    if (config.stickyHeader) {
      scrollTo = scrollTo - document.querySelector('#SiteHeader').offsetHeight
    }

    if (!config.bpSmall) {
      scrollTo -= 10
    }

    if (animate) {
      window.scrollTo({ top: scrollTo, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: scrollTo })
    }
  }

  bindBackButton() {
    window.removeEventListener('popstate', this._popStateHandler)
    this._popStateHandler = (state) => {
      if (state) {
        const newUrl = new URL(window.location.href)
        this.renderCollectionPage(newUrl.searchParams, false)
      }
    }
    window.addEventListener('popstate', this._popStateHandler, { signal: this.abortController.signal })
  }

  fetchOpenCollapsibleFilters() {
    const openDesktopCollapsible = Array.from(
      document.querySelectorAll(`${this.selectors.sidebar} ${this.selectors.trigger}.${this.classes.isOpen}`)
    )

    const openMobileCollapsible = Array.from(
      document.querySelectorAll(`${this.selectors.inlineWrapper} ${this.selectors.trigger}.${this.classes.isOpen}`)
    )

    return [...openDesktopCollapsible, ...openMobileCollapsible].map((trigger) => trigger.dataset.collapsibleId)
  }

  openCollapsible(el) {
    if (el.classList.contains(this.classes.collapsibleContent)) {
      el.style.height = 'auto'
    }

    el.classList.add(this.classes.isOpen)
  }

  setFilterStickyPosition() {
    const headerHeight = document.querySelector('.site-header').offsetHeight - 1
    document.querySelector(this.selectors.filterBar).style.top = headerHeight + 'px'

    // Also update top position of sticky sidebar
    const stickySidebar = this.querySelector('[data-sticky-sidebar]')
    if (stickySidebar) {
      stickySidebar.style.top = headerHeight + 30 + 'px'
    }
  }

  startLoading() {
    this.querySelector(this.selectors.collectionGrid).classList.add('unload') 
  }

  forceReload() {
    this.init()
  }
}

customElements.define('item-grid', ItemGrid)
