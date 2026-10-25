const storageKey = 'animated-algorithms-readable-font';
let enabled = false;
try { enabled = localStorage.getItem(storageKey) === 'true'; } catch { /* Private browsing may disable storage. */ }

const button = document.createElement('button');
button.type = 'button';
button.className = 'font-toggle';
button.textContent = 'Readable font';
button.title = 'Use Poppins for all text';
button.setAttribute('aria-label', 'Readable font: use Poppins for all text');

function apply(value) {
  enabled = value;
  document.documentElement.classList.toggle('readable-font', enabled);
  button.setAttribute('aria-pressed', String(enabled));
}

button.addEventListener('click', () => {
  apply(!enabled);
  try { localStorage.setItem(storageKey, String(enabled)); } catch { /* Still works for this page. */ }
  window.dispatchEvent(new Event('resize'));
});
window.addEventListener('storage', event => { if (event.key === storageKey) apply(event.newValue === 'true'); });
apply(enabled);
document.querySelector('[data-font-toggle-host]')?.append(button);
