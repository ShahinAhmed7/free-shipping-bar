(function () {
  const ROOT_ID = 'shipping-bar-root';

  function formatMoney(cents) {
    return '$' + (cents / 100).toFixed(2).replace(/\.00$/, '');
  }

  function updateBar(root, total) {
    const threshold = parseInt(root.dataset.threshold, 10) || 7500;
    const fill = root.querySelector('.shipping-bar__fill');
    const message = root.querySelector('.shipping-bar__message');

    if (!fill || !message) return;

    const percent = Math.min((total / threshold) * 100, 100);
    fill.style.width = percent + '%';

    if (total >= threshold) {
      root.classList.add('shipping-bar--complete');
      message.textContent = "You've unlocked free shipping!";
    } else {
      root.classList.remove('shipping-bar--complete');
      const remaining = formatMoney(threshold - total);
      message.innerHTML = 'Add <strong>' + remaining + '</strong> more for free shipping';
    }
  }

  function fetchAndUpdate() {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;

    fetch('/cart.js')
      .then(function (res) { return res.json(); })
      .then(function (cart) { updateBar(root, cart.total_price); })
      .catch(function (err) { console.error('[shipping-bar] cart fetch failed', err); });
  }

  document.addEventListener('DOMContentLoaded', fetchAndUpdate);

  document.addEventListener('cart:updated', fetchAndUpdate);
  document.addEventListener('cart:refresh', fetchAndUpdate);

  document.addEventListener('change', function (e) {
    if (e.target && e.target.closest('[data-cart-item]')) {
      setTimeout(fetchAndUpdate, 300);
    }
  });
})();
