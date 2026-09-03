import fs from 'node:fs';

const formJs = fs.readFileSync(new URL('./form-overdrive-v1.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');

function ok(value, message) {
  if (!value) throw new Error(`FAIL: ${message}`);
  console.log(`OK: ${message}`);
}

ok(formJs.includes('const observer = new MutationObserver(sync);'), 'existing submit-state MutationObserver is preserved');
ok(formJs.includes("observer.observe(form, { attributes: true, subtree: true, childList: true"), 'observer behavior remains present');
ok(formJs.includes('if (stateEl.textContent !== nextState) stateEl.textContent = nextState;'), 'state caption write is idempotent');
ok(formJs.includes('if (hintEl.textContent !== nextHint) hintEl.textContent = nextHint;'), 'hint caption write is idempotent');
ok(formJs.includes('Main-thread safety:'), 'freeze guard is documented in place');
ok(html.includes('form-overdrive-v1.js?v=20260831-freeze1'), 'browser cache key points to repaired form module');
console.log('Main-thread freeze regression check passed.');
