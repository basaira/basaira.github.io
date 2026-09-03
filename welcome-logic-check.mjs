import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('index.html', 'utf8');
const splashAnchor = html.indexOf('id="splash-screen"');
const scriptStart = html.indexOf('<script>', splashAnchor);
const scriptEnd = html.indexOf('</script>', scriptStart);
if (splashAnchor < 0 || scriptStart < 0 || scriptEnd < 0) {
  throw new Error('Welcome controller script not found');
}
const source = html.slice(scriptStart + '<script>'.length, scriptEnd);

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`✓ ${message}`);
}

function makeClassList(initial = []) {
  const values = new Set(initial);
  return {
    add(...names) { names.forEach((name) => values.add(name)); },
    remove(...names) { names.forEach((name) => values.delete(name)); },
    contains(name) { return values.has(name); },
    toArray() { return [...values]; }
  };
}

function createRuntime() {
  let now = 0;
  let timerId = 0;
  const timers = new Map();
  const windowListeners = new Map();
  const styles = new Map();
  const attrs = new Map();
  const splash = {
    classList: makeClassList(['basair-splash']),
    dataset: {},
    style: { setProperty(name, value) { styles.set(name, String(value)); } },
    setAttribute(name, value) { attrs.set(name, String(value)); }
  };
  const body = { classList: makeClassList(['route-en', 'relative']) };
  const documentElement = { classList: makeClassList() };

  const windowObject = {
    performance: { now: () => now },
    matchMedia: () => ({ matches: false }),
    setTimeout(fn, delay = 0) {
      const id = ++timerId;
      timers.set(id, { at: now + Math.max(0, Number(delay) || 0), fn });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
    addEventListener(type, fn) {
      const list = windowListeners.get(type) || [];
      list.push(fn);
      windowListeners.set(type, list);
    }
  };

  const documentObject = {
    body,
    documentElement,
    getElementById(id) { return id === 'splash-screen' ? splash : null; }
  };

  const context = {
    window: windowObject,
    document: documentObject,
    performance: windowObject.performance,
    Date,
    Object,
    Math,
    console
  };
  windowObject.window = windowObject;
  windowObject.document = documentObject;

  vm.runInNewContext(source, context, { filename: 'index.html#welcome-controller' });

  function advance(ms) {
    const target = now + ms;
    while (true) {
      let chosenId = null;
      let chosen = null;
      for (const [id, timer] of timers) {
        if (timer.at <= target && (!chosen || timer.at < chosen.at || (timer.at === chosen.at && id < chosenId))) {
          chosenId = id;
          chosen = timer;
        }
      }
      if (!chosen) break;
      timers.delete(chosenId);
      now = chosen.at;
      chosen.fn();
    }
    now = target;
  }

  return { windowObject, splash, body, styles, attrs, advance };
}

{
  const rt = createRuntime();
  assert(rt.windowObject.BasairBoot?.state() === 'visible', 'welcome starts in visible state');
  rt.windowObject.BasairBoot.ready();
  rt.advance(849);
  assert(!rt.splash.classList.contains('splash-hidden'), 'app-ready respects the 850ms minimum welcome duration');
  rt.advance(1);
  assert(rt.splash.classList.contains('splash-hidden'), 'app-ready releases the welcome layer at the minimum boundary');
  assert(rt.styles.get('opacity') === '0', 'release applies an explicit invisible terminal opacity');
  assert(rt.styles.get('visibility') === 'hidden', 'release applies an explicit hidden terminal visibility');
  assert(rt.styles.get('pointer-events') === 'none', 'released welcome layer cannot block interaction');
  assert(rt.attrs.get('aria-hidden') === 'true', 'released welcome layer is hidden from assistive technology');
  assert(rt.body.classList.contains('motion-entered') && !rt.body.classList.contains('motion-prep'), 'application entrance state is restored on release');
  rt.advance(380);
  assert(rt.styles.get('display') === 'none', 'welcome layer is visually retired after its exit transition');
}

{
  const rt = createRuntime();
  rt.advance(1799);
  assert(!rt.splash.classList.contains('splash-hidden'), 'watchdog does not fire prematurely');
  rt.advance(1);
  assert(rt.splash.classList.contains('splash-hidden'), 'absolute watchdog releases the page even if app.js never becomes ready');
  assert(rt.splash.dataset.releaseReason === 'absolute-watchdog', 'watchdog release reason is recorded for diagnostics');
  rt.advance(380);
  assert(rt.styles.get('display') === 'none', 'watchdog path also retires the welcome layer completely');
}

console.log('WELCOME LOGIC CHECK PASSED');
