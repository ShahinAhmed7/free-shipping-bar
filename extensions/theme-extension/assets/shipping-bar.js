(function() {
  function initShippingBar(settings) {
    const bar = document.querySelector('.shipping-bar');
    if (!bar) return;

    const threshold = settings.threshold || parseInt(bar.dataset.threshold) || 7500;
    const message = settings.progressMessage || bar.dataset.message || 'Add {amount} more for free shipping!';
    const successMsg = settings.successMessage || bar.dataset.success || "You've unlocked free shipping!";
    const color = settings.barColor || bar.dataset.color || '#1D9E75';

    const fill = bar.querySelector('.shipping-bar__fill');
    const label = bar.querySelector('.shipping-bar__message');

    fill.style.background = color;

    function updateBar(total) {
      const percent = Math.min((total / threshold) * 100, 100);
      fill.style.width = percent + '%';

      if (total >= threshold) {
        bar.classList.add('shipping-bar--complete');
        label.innerHTML = successMsg;
      } else {
        bar.classList.remove('shipping-bar--complete');
        fill.style.background = color;
        const remaining = ((threshold - total) / 100).toFixed(2);
        const formatted = '$' + remaining;
        label.innerHTML = message.replace('{amount}', '<strong>' + formatted + '</strong>');
      }
    }

    function fetchCart() {
      fetch('/cart.js')
        .then(function(res) { return res.json(); })
        .then(function(data) { updateBar(data.total_price); })
        .catch(function() { updateBar(0); });
    }

    fetchCart();
    document.addEventListener('cart:updated', fetchCart);
    document.addEventListener('cart:change', fetchCart);
  }

  function loadSettings() {
    fetch('/apps/free-shipping-bar/api/settings')
      .then(function(res) {
        if (!res.ok) throw new Error('Settings request failed');
        return res.json();
      })
      .then(function(settings) { initShippingBar(settings); })
      .catch(function() { initShippingBar({}); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSettings);
  } else {
    loadSettings();
  }
})();
