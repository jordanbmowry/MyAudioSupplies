import CartForm from '@archetype-themes/scripts/modules/cart-form'

if (document.body.classList.contains('template-cart')) {
  var cartPageForm = document.getElementById('CartPageForm')
  if (cartPageForm) {
    var cartForm = new CartForm(cartPageForm)

    var noteBtn = cartPageForm.querySelector('.add-note')
    if (noteBtn) {
      noteBtn.addEventListener('click', function () {
        noteBtn.classList.toggle('is-active')
        cartPageForm.querySelector('.cart__note').classList.toggle('hide')
      })
    }

    document.addEventListener(
      'ajaxProduct:added',
      function (evt) {
        cartForm.buildCart()
      }.bind(this)
    )
  }
}
