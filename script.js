document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var sent = form.querySelector('.sent');
      if (sent) {
        sent.style.display = 'block';
      }
    });
  }

  var hoursStatus = document.getElementById('hours-status');
  var hoursStatusText = document.getElementById('hours-status-text');
  var weekdayNames = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  var schedules = {
    1: { open: 11 * 60, close: 21 * 60 },
    2: { open: 11 * 60, close: 21 * 60 },
    3: { open: 11 * 60, close: 21 * 60 },
    4: { open: 11 * 60, close: 21 * 60 },
    5: { open: 11 * 60, close: 21 * 60 },
    6: { open: 9 * 60, close: 17 * 60 }
  };

  function updateHoursStatus() {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(new Date());
    var values = {};
    parts.forEach(function (part) { values[part.type] = part.value; });
    var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var today = dayNames.indexOf(values.weekday);
    var currentMinutes = Number(values.hour) * 60 + Number(values.minute);
    var todaySchedule = schedules[today];
    var isOpen = todaySchedule && currentMinutes >= todaySchedule.open && currentMinutes < todaySchedule.close;

    document.querySelectorAll('.schedule [data-day]').forEach(function (row) {
      var isToday = Number(row.dataset.day) === today || (today >= 1 && today <= 5 && row.dataset.day === '1');
      row.classList.toggle('is-today', isToday);
      if (isToday) row.setAttribute('aria-current', 'date');
      else row.removeAttribute('aria-current');
    });

    if (isOpen) {
      hoursStatus.dataset.state = 'open';
      hoursStatusText.textContent = 'Aberto agora · fechamos às ' + Math.floor(todaySchedule.close / 60) + 'h';
      return;
    }

    var nextDay = today;
    var nextSchedule = null;
    var offset = 0;
    for (; offset < 7; offset += 1) {
      nextDay = (today + offset) % 7;
      nextSchedule = schedules[nextDay];
      if (nextSchedule && (offset > 0 || nextSchedule.open > currentMinutes)) break;
      nextSchedule = null;
    }

    var opening = Math.floor(nextSchedule.open / 60) + 'h';
    var when = offset === 0 ? 'hoje' : offset === 1 ? 'amanhã' : 'na ' + weekdayNames[nextDay];
    hoursStatus.dataset.state = 'closed';
    hoursStatusText.textContent = 'Fechado agora · abrimos ' + when + ' às ' + opening;
  }

  updateHoursStatus();
  window.setInterval(updateHoursStatus, 60000);

  var galleryDialog = document.getElementById('gallery-dialog');
  var galleryImage = document.getElementById('gallery-image');
  var galleryTitle = document.getElementById('gallery-title');
  var galleryDescription = document.getElementById('gallery-description');
  var galleryPanel = document.getElementById('gallery-panel');
  var galleryTabs = Array.from(document.querySelectorAll('[data-gallery-tab]'));
  var galleryCards = Array.from(document.querySelectorAll('[data-gallery-index]'));

  function selectGalleryItem(index) {
    var card = galleryCards[index];
    var image = card.querySelector('img');
    var caption = card.querySelector('.cap');
    galleryTabs.forEach(function (tab, tabIndex) {
      var selected = tabIndex === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    galleryImage.src = image.src;
    galleryImage.alt = image.alt;
    galleryTitle.textContent = caption.textContent;
    galleryDescription.textContent = card.dataset.galleryDescription;
    galleryPanel.setAttribute('aria-labelledby', galleryTabs[index].id);
  }

  galleryTabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () { selectGalleryItem(index); });
  });
  galleryCards.forEach(function (card, index) {
    card.addEventListener('click', function () {
      selectGalleryItem(index);
      galleryDialog.showModal();
    });
  });
  document.getElementById('close-gallery').addEventListener('click', function () { galleryDialog.close(); });
  galleryDialog.addEventListener('click', function (event) {
    if (event.target === galleryDialog) galleryDialog.close();
  });
  document.querySelector('.gallery-tabs').addEventListener('keydown', function (event) {
    var currentIndex = galleryTabs.findIndex(function (tab) { return tab === document.activeElement; });
    if (currentIndex < 0) return;
    var nextIndex = currentIndex;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % galleryTabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + galleryTabs.length) % galleryTabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = galleryTabs.length - 1;
    else return;
    event.preventDefault();
    galleryTabs[nextIndex].focus();
    selectGalleryItem(nextIndex);
  });

  var cart = new Map();
  var cartDialog = document.getElementById('cart-dialog');
  var cartItems = document.getElementById('cart-items');
  var cartEmpty = document.getElementById('cart-empty');
  var cartCount = document.getElementById('cart-count');
  var cartTotal = document.getElementById('cart-total');
  var openCart = document.getElementById('open-cart');
  var checkout = document.getElementById('checkout');
  var clearCart = document.getElementById('clear-cart');
  var currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  function renderCart() {
    var entries = Array.from(cart.values());
    var itemCount = entries.reduce(function (total, item) { return total + item.quantity; }, 0);
    var total = entries.reduce(function (sum, item) { return sum + item.price * item.quantity; }, 0);

    cartCount.textContent = itemCount;
    openCart.setAttribute('aria-label', 'Abrir carrinho, ' + itemCount + (itemCount === 1 ? ' item' : ' itens'));
    cartTotal.textContent = currency.format(total);
    cartEmpty.hidden = entries.length > 0;
    checkout.disabled = entries.length === 0;
    clearCart.hidden = entries.length === 0;
    cartItems.innerHTML = entries.map(function (item) {
      return '<div class="cart-row" data-cart-id="' + item.id + '">' +
        '<div class="cart-row-info"><strong>' + item.name + '</strong><span>' + currency.format(item.price) + ' cada</span></div>' +
        '<div class="quantity-control"><button type="button" data-quantity="-1" aria-label="Remover uma unidade de ' + item.name + '">−</button>' +
        '<span>' + item.quantity + '</span><button type="button" data-quantity="1" aria-label="Adicionar uma unidade de ' + item.name + '">+</button></div>' +
        '<strong class="cart-row-total">' + currency.format(item.price * item.quantity) + '</strong>' +
        '<button class="remove-item" type="button" data-remove aria-label="Remover ' + item.name + ' do carrinho">Remover</button></div>';
    }).join('');
  }

  document.addEventListener('click', function (event) {
    var addButton = event.target.closest('[data-add]');
    if (addButton) {
      var product = addButton.closest('.menu-item');
      var productId = product.dataset.id;
      var existing = cart.get(productId);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.set(productId, {
          id: productId,
          name: product.dataset.name,
          price: Number(product.dataset.price),
          quantity: 1
        });
      }
      renderCart();
      return;
    }

    var cartRow = event.target.closest('.cart-row');
    if (cartRow && event.target.closest('[data-quantity]')) {
      var item = cart.get(cartRow.dataset.cartId);
      item.quantity += Number(event.target.closest('[data-quantity]').dataset.quantity);
      if (item.quantity <= 0) cart.delete(item.id);
      renderCart();
    } else if (cartRow && event.target.closest('[data-remove]')) {
      cart.delete(cartRow.dataset.cartId);
      renderCart();
    }
  });

  openCart.addEventListener('click', function () { cartDialog.showModal(); });
  document.getElementById('close-cart').addEventListener('click', function () { cartDialog.close(); });
  cartDialog.addEventListener('click', function (event) {
    if (event.target === cartDialog) cartDialog.close();
  });
  clearCart.addEventListener('click', function () { cart.clear(); renderCart(); });
  checkout.addEventListener('click', function () {
    var lines = Array.from(cart.values()).map(function (item) {
      return item.quantity + 'x ' + item.name + ' - ' + currency.format(item.price * item.quantity);
    });
    lines.push('Total: ' + cartTotal.textContent);
    var message = 'Olá! Gostaria de fazer este pedido:\n' + lines.join('\n');
    window.open('https://wa.me/5527123456789?text=' + encodeURIComponent(message), '_blank', 'noopener');
  });
  renderCart();
});
