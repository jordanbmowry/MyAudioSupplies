import noUiSlider from 'nouislider'
import { config } from '@archetype-themes/scripts/config'
import { formatMoney } from '@archetype-themes/scripts/helpers/currency'

if (typeof noUiSlider === 'undefined') {
  throw new Error('theme.PriceRange is missing vendor noUiSlider: // =require vendor/nouislider.js')
}

const defaultStep = 10
const selectors = {
  priceRange: '.price-range',
  priceRangeSlider: '.price-range__slider',
  priceRangeInputMin: '.price-range__input-min',
  priceRangeInputMax: '.price-range__input-max',
  priceRangeDisplayMin: '.price-range__display-min',
  priceRangeDisplayMax: '.price-range__display-max',
  filters: '#CollectionSidebarFilterWrap .filter-wrapper'
}

class PriceRange extends HTMLElement {
  connectedCallback() {
    if (!config.filtersPrime) {
      config.filtersPrime = document.querySelector(selectors.filters).cloneNode(true)
    }

    this.init()
  }

  init() {
    if (!this.classList.contains('price-range')) {
      throw new Error('You must instantiate PriceRange with a valid container')
    }

    this.formEl = this.closest('form')
    this.sliderEl = this.querySelector(selectors.priceRangeSlider)
    this.inputMinEl = this.querySelector(selectors.priceRangeInputMin)
    this.inputMaxEl = this.querySelector(selectors.priceRangeInputMax)
    this.displayMinEl = this.querySelector(selectors.priceRangeDisplayMin)
    this.displayMaxEl = this.querySelector(selectors.priceRangeDisplayMax)
    this.moneyFormat = this.dataset.moneyFormat
    this.superScript = this.dataset.superScript === 'true'

    this.minRange = parseFloat(this.dataset.min) || 0
    this.minValue = parseFloat(this.dataset.minValue) || 0
    this.maxRange = parseFloat(this.dataset.max) || 100
    this.maxValue = parseFloat(this.dataset.maxValue) || this.maxRange

    return this.createPriceRange()
  }

  createPriceRange() {
    if (this.sliderEl && this.sliderEl.noUiSlider && typeof this.sliderEl.noUiSlider.destroy === 'function') {
      this.sliderEl.noUiSlider.destroy()
    }

    const slider = noUiSlider.create(this.sliderEl, {
      connect: true,
      step: defaultStep,
      // Do not allow overriding these options
      start: [this.minValue, this.maxValue],
      range: {
        min: this.minRange,
        max: this.maxRange
      }
    })

    slider.on('update', (values) => {
      this.displayMinEl.innerHTML = formatMoney(values[0], this.moneyFormat, this.superScript)
      this.displayMaxEl.innerHTML = formatMoney(values[1], this.moneyFormat, this.superScript)

      /**
       * @event price-range:update
       * @description Triggered when the price range slider is updated.
       * @param {object} detail - The values of the price range slider.
       */
      document.dispatchEvent(
        new CustomEvent('price-range:update', {
          detail: values
        })
      )
    })

    slider.on('change', (values) => {
      this.inputMinEl.value = values[0]
      this.inputMaxEl.value = values[1]

      const formData = new FormData(this.formEl)

      /**
       * @event price-range:change
       * @description Triggered when the price range slider is changed.
       * @param {Object} formData - The form data.
       */
      document.dispatchEvent(
        new CustomEvent('price-range:change', {
          detail: formData
        })
      )
    })

    return slider
  }
}

customElements.define('price-range', PriceRange)
