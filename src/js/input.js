(function () {
  const $ = (s) => document.querySelector(s);
  const form = $('#tfForm');
  const input = $('#tfInput');
  const err = $('#error');
  const overlay = $('#overlay');

  $('#demo').addEventListener('click', () => {
    input.value = 'G(z) = (z^2 + 0.5z + 1) / (z^2 - 1.2z + 0.36)';
    err.classList.add('hidden');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    err.classList.add('hidden');

    try {
      const tf = window.Parser.parseTransferFunction(input.value);
      const payload = {
        raw: input.value,
        numerator: tf.numerator,
        denominator: tf.denominator
      };
      localStorage.setItem('tf', JSON.stringify(payload));   // ✅ fixed here

      overlay.classList.remove('hidden');
      overlay.classList.add('animate-fade-slide-in');

      setTimeout(() => {
        if (window.AppBridge && window.AppBridge.goto) {
          window.AppBridge.goto('discretize.html');
        } else {
          window.location.replace('discretize.html');
        }
      }, 800);
    } catch (e) {
      err.textContent = e.message;
      err.classList.remove('hidden');
    }
  });
})();