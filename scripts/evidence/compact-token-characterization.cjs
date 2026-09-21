const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const cmd = process.argv[2];
const token = '--layout-section-compact';
const earlyOwner = 'tokens-public-compat.css';
const lateOwner = 'visual-layout-hotfix-v2.css';
const routeFiles = [
  ['/', 'index.html'],
  ['/en/', 'en/index.html'],
  ['/en/quran-kids/', 'en/quran-kids/index.html'],
  ['/en/quran-adults/', 'en/quran-adults/index.html'],
  ['/en/arabic/', 'en/arabic/index.html'],
  ['/ru/', 'ru/index.html'],
  ['/ru/quran/', 'ru/quran/index.html'],
  ['/ru/arabic/', 'ru/arabic/index.html'],
  ['/uz/', 'uz/index.html'],
  ['/uz/quran/', 'uz/quran/index.html'],
  ['/uz/arabic/', 'uz/arabic/index.html'],
  ['/admin.html', 'admin.html']
];

function writeJson(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n');
}
function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}
function escapeRe(s) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

async function staticAnalysis(root, out) {
  const tracked = execFileSync('git', ['-C', root, 'ls-files'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  const textExt = /\.(?:css|html|js|mjs|ts|json|md)$/i;
  const declarations = [], consumers = [], stringReferences = [], allOccurrences = [];
  const tokenRe = escapeRe(token);
  for (const rel of tracked.filter(p => textExt.test(p))) {
    const full = path.join(root, rel);
    let txt = '';
    try { txt = fs.readFileSync(full, 'utf8'); } catch { continue; }
    txt.split(/\r?\n/).forEach((line, i) => {
      if (!line.includes(token)) return;
      const rec = { path: rel, line: i + 1, text: line.trim() };
      allOccurrences.push(rec);
      if (new RegExp(tokenRe + '\\s*:').test(line)) declarations.push(rec);
      if (new RegExp('var\\(\\s*' + tokenRe + '(?:\\s*[,)]|\\s)').test(line)) consumers.push(rec);
      if (/\.(?:js|mjs|ts|html)$/i.test(rel)) stringReferences.push(rec);
    });
  }

  function localCssHref(htmlFile, href) {
    if (!href || /^(?:https?:)?\/\//i.test(href) || href.startsWith('data:')) return null;
    const clean = href.split('?')[0].split('#')[0];
    if (!clean.endsWith('.css')) return null;
    return path.posix.normalize(path.posix.join(path.posix.dirname(htmlFile), clean));
  }
  function imports(cssFile, seen) {
    seen = seen || new Set();
    if (seen.has(cssFile)) return [];
    seen.add(cssFile);
    const full = path.join(root, cssFile);
    if (!fs.existsSync(full)) return [];
    const txt = fs.readFileSync(full, 'utf8');
    const outFiles = [];
    const rx = /@import\s+(?:url\()?\s*["']([^"']+)["']/g;
    let m;
    while ((m = rx.exec(txt))) {
      const imp = localCssHref(cssFile, m[1]);
      if (imp && fs.existsSync(path.join(root, imp))) outFiles.push(imp, ...imports(imp, seen));
    }
    return outFiles;
  }

  const routeOwnership = [];
  for (const pair of routeFiles) {
    const route = pair[0], htmlFile = pair[1];
    const html = fs.readFileSync(path.join(root, htmlFile), 'utf8');
    const links = [];
    const rx = /<link\b[^>]*\bhref=["']([^"']+\.css(?:\?[^"']*)?)["'][^>]*>/gi;
    let m;
    while ((m = rx.exec(html))) {
      const rel = localCssHref(htmlFile, m[1]);
      if (rel && fs.existsSync(path.join(root, rel))) links.push(rel);
    }
    const expanded = [];
    for (const rel of links) expanded.push(...imports(rel, new Set()), rel);
    const earlyIndex = expanded.indexOf(earlyOwner);
    const lateIndex = expanded.indexOf(lateOwner);
    routeOwnership.push({
      route, htmlFile, links, expandedCssOrder: expanded,
      ownsEarly: earlyIndex >= 0, ownsLate: lateIndex >= 0,
      ownsBoth: earlyIndex >= 0 && lateIndex >= 0,
      earlyIndex, lateIndex, laterOwnerAfterEarly: earlyIndex >= 0 && lateIndex > earlyIndex
    });
  }

  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'token-authority-manifest.json'), 'utf8'));
  const unresolved = (manifest.unresolved || []).find(x => x.token === token) || null;
  const decision = (manifest.conflictDecisions || []).find(x => x.token === token) || null;
  const alias = manifest.aliases && manifest.aliases[token] || null;
  const prodRefs = stringReferences.filter(x => !x.path.endsWith('.md') && !x.path.endsWith('.json'));
  const declFiles = [...new Set(declarations.map(x => x.path))].sort();

  const report = {
    token,
    declarations,
    consumers,
    productionCodeStringReferences: prodRefs,
    allOccurrenceCount: allOccurrences.length,
    allOccurrences,
    routeOwnership,
    routesOwningBoth: routeOwnership.filter(x => x.ownsBoth).map(x => x.route),
    manifest: { unresolved, decision, alias },
    assertions: {
      exactTwoDeclarations: declarations.length === 2,
      expectedDeclarationFiles: JSON.stringify(declFiles) === JSON.stringify([earlyOwner, lateOwner].sort()),
      currentManifestUnresolvedResponsive: unresolved && unresolved.status === 'unresolved-responsive',
      everyOwningRouteLoadsLateAfterEarly: routeOwnership.filter(x => x.ownsBoth).every(x => x.laterOwnerAfterEarly),
      atLeastOneOwningRoute: routeOwnership.some(x => x.ownsBoth)
    }
  };
  writeJson(out, report);
  console.log(JSON.stringify({
    declarations, consumers,
    productionCodeStringReferences: prodRefs,
    routesOwningBoth: report.routesOwningBoth,
    manifest: report.manifest,
    assertions: report.assertions
  }, null, 2));
  if (!Object.values(report.assertions).every(Boolean)) process.exit(1);
}

async function provenance(out) {
  const { chromium } = require('playwright');
  const routes = routeFiles.map(x => x[0]);
  const bases = { baseline: 'http://127.0.0.1:4173', candidate: 'http://127.0.0.1:4174' };

  async function scan(page) {
    return page.evaluate((tok) => {
      const owners = [];
      function walk(rules, href, parents) {
        for (let i = 0; i < rules.length; i++) {
          const r = rules[i];
          if (r.type === CSSRule.IMPORT_RULE && r.styleSheet) {
            const nestedHref = r.styleSheet.href || href;
            try { walk(r.styleSheet.cssRules, nestedHref, parents.concat(['@import'])); } catch {}
            continue;
          }
          if (r.style && r.style.getPropertyValue(tok)) {
            owners.push({
              href, ruleIndex: i, selector: r.selectorText || null,
              value: r.style.getPropertyValue(tok).trim(),
              important: r.style.getPropertyPriority(tok) || '',
              parentConditions: parents
            });
          }
          if (r.cssRules) {
            const label = r.conditionText || r.name || (r.media && r.media.mediaText) || (r.constructor && r.constructor.name) || 'group';
            try { walk(r.cssRules, href, parents.concat([String(label)])); } catch {}
          }
        }
      }
      for (const sheet of Array.from(document.styleSheets)) {
        try { walk(sheet.cssRules, sheet.href || 'inline', []); } catch {}
      }
      const cs = getComputedStyle(document.documentElement);
      return {
        owners,
        rootValue: cs.getPropertyValue(tok).trim(),
        canonicalValue: cs.getPropertyValue('--space-layout-section-compact').trim()
      };
    }, token);
  }

  const browser = await chromium.launch({ headless: true });
  const rows = [];
  try {
    for (const variant of Object.keys(bases)) {
      const base = bases[variant];
      for (const route of routes) {
        const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
        const page = await context.newPage();
        await page.route('**/*', async r => {
          const u = new URL(r.request().url());
          const method = r.request().method().toUpperCase();
          if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) return r.abort('blockedbyclient');
          if (!['127.0.0.1', 'localhost'].includes(u.hostname)) return r.abort('blockedbyclient');
          return r.continue();
        });
        const resp = await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}' });
        await page.waitForTimeout(300);
        rows.push(Object.assign({ variant, route, status: resp && resp.status() || null }, await scan(page)));
        await context.close();
      }
    }
  } finally { await browser.close(); }

  const baseline = rows.filter(x => x.variant === 'baseline');
  const owningRoutes = baseline.filter(x =>
    x.owners.some(o => (o.href || '').includes(earlyOwner)) &&
    x.owners.some(o => (o.href || '').includes(lateOwner))
  ).map(x => x.route);
  const assertions = {
    baselineOwningRoutesNonempty: owningRoutes.length > 0,
    baselineEachOwningRouteHasExactlyExpectedOwners: baseline.filter(x => owningRoutes.includes(x.route)).every(x => {
      const hit = x.owners.filter(o => (o.href || '').includes(earlyOwner) || (o.href || '').includes(lateOwner));
      return hit.length === 2 &&
        hit.some(o => (o.href || '').includes(earlyOwner)) &&
        hit.some(o => (o.href || '').includes(lateOwner)) &&
        hit.every(o => o.parentConditions.length === 0);
    }),
    candidateOwningRoutesHaveOnlyLateOwner: rows.filter(x => x.variant === 'candidate' && owningRoutes.includes(x.route)).every(x => {
      const hit = x.owners.filter(o => (o.href || '').includes(earlyOwner) || (o.href || '').includes(lateOwner));
      return hit.length === 1 && (hit[0].href || '').includes(lateOwner) && hit[0].parentConditions.length === 0;
    })
  };
  const report = { rows, owningRoutes, assertions };
  writeJson(out, report);
  console.log(JSON.stringify({
    owningRoutes, assertions,
    ownerRows: rows.filter(x => owningRoutes.includes(x.route)).map(x => ({ variant: x.variant, route: x.route, owners: x.owners, rootValue: x.rootValue }))
  }, null, 2));
  if (!Object.values(assertions).every(Boolean)) process.exit(1);
}

async function responsive(out, screenshotDir) {
  const { chromium } = require('playwright');
  const provenanceFile = path.join(path.dirname(out), 'compact-token-runtime-ownership.json');
  const prov = JSON.parse(fs.readFileSync(provenanceFile, 'utf8'));
  const routes = prov.owningRoutes;
  const widths = [390, 766, 767, 768, 1119, 1120, 1121, 1440];
  const langs = ['en', 'ar'];
  const bases = { baseline: 'http://127.0.0.1:4175', candidate: 'http://127.0.0.1:4176' };
  fs.mkdirSync(screenshotDir, { recursive: true });
  const blocked = [];

  async function capture(base, variant, route, width, lang, browser) {
    const height = width <= 480 ? 844 : 1000;
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
      locale: lang === 'ar' ? 'ar-EG' : 'en-US'
    });
    const page = await context.newPage();
    const localBlocked = [], pageErrors = [];
    await page.route('**/*', async r => {
      const req = r.request(), method = req.method().toUpperCase();
      const u = new URL(req.url());
      if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        localBlocked.push({ url: req.url(), method, reason: 'non-read' });
        return r.abort('blockedbyclient');
      }
      if (!['127.0.0.1', 'localhost'].includes(u.hostname)) {
        localBlocked.push({ url: req.url(), method, reason: 'external-isolation' });
        return r.abort('blockedbyclient');
      }
      return r.continue();
    });
    page.on('pageerror', e => pageErrors.push(String(e)));
    const resp = await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important;caret-color:transparent!important}' });
    if (route === '/') {
      await page.evaluate((language) => {
        const b = document.querySelector('[data-lang="' + language + '"]');
        if (b) b.click();
      }, lang);
    }
    await page.waitForTimeout(450);
    const state = await page.evaluate((tok) => {
      const root = getComputedStyle(document.documentElement);
      const probe = document.createElement('div');
      probe.setAttribute('data-compact-token-probe', '');
      probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding-top:var(' + tok + ');width:1px;height:1px;inset:0 auto auto 0;';
      document.body.appendChild(probe);
      const tokenPx = getComputedStyle(probe).paddingTop;
      probe.remove();
      const els = Array.from(document.querySelectorAll('body *')).filter(el => !el.hasAttribute('data-compact-token-probe'));
      const geometry = els.map((el, index) => {
        const r = el.getBoundingClientRect(), s = getComputedStyle(el);
        const cls = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 4).join('.') : '';
        return {
          key: index + ':' + el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + cls,
          x: +r.x.toFixed(3), y: +r.y.toFixed(3), w: +r.width.toFixed(3), h: +r.height.toFixed(3),
          display: s.display, position: s.position,
          pt: s.paddingTop, pb: s.paddingBottom, mt: s.marginTop, mb: s.marginBottom,
          gap: s.gap, rowGap: s.rowGap, columnGap: s.columnGap
        };
      });
      return {
        htmlLang: document.documentElement.lang,
        htmlDir: document.documentElement.getAttribute('dir') || '',
        computedDir: getComputedStyle(document.documentElement).direction,
        bodyClass: document.body.className,
        tokenRaw: root.getPropertyValue(tok).trim(),
        canonicalRaw: root.getPropertyValue('--space-layout-section-compact').trim(),
        tokenPx,
        bodyScrollHeight: document.body.scrollHeight,
        documentScrollHeight: document.documentElement.scrollHeight,
        geometry
      };
    }, token);
    const screenshot = await page.screenshot({ fullPage: true, animations: 'disabled' });
    const safeRoute = route === '/' ? 'root' : route.replace(/\//g, '_');
    const filename = variant + '__' + safeRoute + '__' + width + '__' + lang + '.png';
    fs.writeFileSync(path.join(screenshotDir, filename), screenshot);
    await context.close();
    blocked.push(...localBlocked.map(x => Object.assign({ variant, route, width, lang }, x)));
    return {
      variant, route, width, height, lang,
      httpStatus: resp && resp.status() || null,
      pageErrors, state,
      screenshotSha256: sha256(screenshot),
      screenshotFile: filename
    };
  }

  const browser = await chromium.launch({ headless: true });
  const rows = [];
  try {
    for (const route of routes) {
      for (const width of widths) {
        for (const lang of langs) {
          rows.push(await capture(bases.baseline, 'baseline', route, width, lang, browser));
          rows.push(await capture(bases.candidate, 'candidate', route, width, lang, browser));
        }
      }
    }
  } finally { await browser.close(); }

  const pairs = [];
  let allPass = true;
  for (const route of routes) for (const width of widths) for (const lang of langs) {
    const b = rows.find(x => x.variant === 'baseline' && x.route === route && x.width === width && x.lang === lang);
    const c = rows.find(x => x.variant === 'candidate' && x.route === route && x.width === width && x.lang === lang);
    const geomCountEqual = b.state.geometry.length === c.state.geometry.length;
    let maxDelta = 0, changedGeometry = [];
    if (geomCountEqual) {
      for (let i = 0; i < b.state.geometry.length; i++) {
        const x = b.state.geometry[i], y = c.state.geometry[i];
        const d = Math.max(...['x', 'y', 'w', 'h'].map(k => Math.abs(x[k] - y[k])));
        maxDelta = Math.max(maxDelta, d);
        if (d > 0.05 || x.key !== y.key || x.pt !== y.pt || x.pb !== y.pb || x.mt !== y.mt || x.mb !== y.mb || x.gap !== y.gap || x.rowGap !== y.rowGap || x.columnGap !== y.columnGap) {
          changedGeometry.push({ index: i, baseline: x, candidate: y, maxRectDelta: d });
        }
      }
    }
    const checks = {
      httpSuccess: b.httpStatus === 200 && c.httpStatus === 200,
      noPageErrors: b.pageErrors.length === 0 && c.pageErrors.length === 0,
      tokenRawEqual: b.state.tokenRaw === c.state.tokenRaw,
      tokenResolvedPxEqual: b.state.tokenPx === c.state.tokenPx,
      directionEqual: b.state.computedDir === c.state.computedDir,
      geometryCountEqual: geomCountEqual,
      geometryEqual: geomCountEqual && changedGeometry.length === 0,
      scrollHeightEqual: b.state.documentScrollHeight === c.state.documentScrollHeight,
      screenshotExact: b.screenshotSha256 === c.screenshotSha256
    };
    const pass = Object.values(checks).every(Boolean);
    if (!pass) allPass = false;
    pairs.push({
      route, width, lang, checks, pass,
      maxGeometryDelta: maxDelta,
      changedGeometryCount: changedGeometry.length,
      changedGeometry: changedGeometry.slice(0, 20),
      baseline: {
        tokenRaw: b.state.tokenRaw, canonicalRaw: b.state.canonicalRaw, tokenPx: b.state.tokenPx,
        dir: b.state.computedDir, htmlLang: b.state.htmlLang, htmlDir: b.state.htmlDir,
        scrollHeight: b.state.documentScrollHeight, screenshotSha256: b.screenshotSha256
      },
      candidate: {
        tokenRaw: c.state.tokenRaw, canonicalRaw: c.state.canonicalRaw, tokenPx: c.state.tokenPx,
        dir: c.state.computedDir, htmlLang: c.state.htmlLang, htmlDir: c.state.htmlDir,
        scrollHeight: c.state.documentScrollHeight, screenshotSha256: c.screenshotSha256
      }
    });
  }
  const report = {
    routes, widths, langs, stateCount: pairs.length, allPass, pairs, blockedRequests: blocked,
    summary: {
      passedPairs: pairs.filter(x => x.pass).length,
      failedPairs: pairs.filter(x => !x.pass).length,
      maxGeometryDelta: Math.max(0, ...pairs.map(x => x.maxGeometryDelta)),
      screenshotExactPairs: pairs.filter(x => x.checks.screenshotExact).length,
      tokenPxEqualPairs: pairs.filter(x => x.checks.tokenResolvedPxEqual).length,
      geometryExactPairs: pairs.filter(x => x.checks.geometryEqual).length
    }
  };
  writeJson(out, report);
  writeJson(path.join(path.dirname(out), 'compact-token-backend-boundary.json'), {
    allowed: ['GET', 'HEAD', 'OPTIONS'], blockedRequests: blocked, mutationDispatched: false
  });
  console.log(JSON.stringify({ routes, widths, langs, summary: report.summary, allPass }, null, 2));
  if (!allPass) process.exit(1);
}

async function summary(outDir) {
  const staticA = JSON.parse(fs.readFileSync(path.join(outDir, 'compact-token-static-analysis.json')));
  const runtime = JSON.parse(fs.readFileSync(path.join(outDir, 'compact-token-runtime-ownership.json')));
  const responsive = JSON.parse(fs.readFileSync(path.join(outDir, 'compact-token-responsive-matrix.json')));
  const authority = JSON.parse(fs.readFileSync(path.join(outDir, 'frozen-authorities.json')));
  const runtimeRows = runtime.rows.filter(x => runtime.owningRoutes.includes(x.route));
  const unconditionalLate = runtimeRows.filter(x => x.variant === 'baseline').every(x => {
    const late = x.owners.find(o => (o.href || '').includes(lateOwner));
    return late && late.parentConditions.length === 0;
  });
  const baselineLateValue = runtimeRows.filter(x => x.variant === 'baseline').every(x => {
    const late = x.owners.find(o => (o.href || '').includes(lateOwner));
    return late && late.value === 'clamp(3.25rem,4.7vw,4.65rem)';
  });
  const manifestStatus = staticA.manifest.unresolved && staticA.manifest.unresolved.status || null;
  const proof = {
    currentManifestStatus: manifestStatus,
    expectedManifestStatusPreserved: manifestStatus === 'unresolved-responsive',
    declarationOwners: staticA.declarations.map(x => x.path),
    declarationCount: staticA.declarations.length,
    consumerCount: staticA.consumers.length,
    productionCodeStringReferenceCount: staticA.productionCodeStringReferences.length,
    routesOwningBoth: runtime.owningRoutes,
    lateOwnerUnconditional: unconditionalLate,
    lateOwnerValueAsExpected: baselineLateValue,
    removeEarlierOwnerSimulationOnly: true,
    responsiveStatePairs: responsive.stateCount,
    responsiveAllPass: responsive.allPass,
    geometryExactPairs: responsive.summary.geometryExactPairs,
    screenshotExactPairs: responsive.summary.screenshotExactPairs,
    tokenResolvedPxEqualPairs: responsive.summary.tokenPxEqualPairs,
    maxGeometryDelta: responsive.summary.maxGeometryDelta,
    backendMutationDispatched: false
  };
  let disposition = 'DEFER / BLOCK';
  let reason = 'Characterization evidence is incomplete or a simulation delta exists.';
  if (
    staticA.assertions.exactTwoDeclarations &&
    staticA.assertions.expectedDeclarationFiles &&
    staticA.assertions.currentManifestUnresolvedResponsive &&
    staticA.assertions.everyOwningRouteLoadsLateAfterEarly &&
    runtime.assertions.baselineEachOwningRouteHasExactlyExpectedOwners &&
    runtime.assertions.candidateOwningRoutesHaveOnlyLateOwner &&
    unconditionalLate && baselineLateValue && responsive.allPass
  ) {
    disposition = 'SAFE MUTATION DESIGN — REMOVE EARLIER OWNER ONLY';
    reason = 'Across every route owning both declarations and every characterized responsive/language state, removing only the earlier tokens-public-compat declaration preserves the late unconditional hotfix owner, resolved token value, measured geometry, scroll height, and exact screenshots.';
  }
  const result = {
    target: 'C — COMPACT TOKEN OWNERSHIP',
    token,
    frozenAuthority: authority,
    sourceManifestStatus: manifestStatus,
    sourceManifestChanged: false,
    productionMutation: false,
    implementationAuthorized: false,
    simulation: {
      removed: 'tokens-public-compat.css declaration only',
      preserved: 'visual-layout-hotfix-v2.css declaration',
      candidateWasDisposable: true
    },
    proof,
    disposition,
    reason,
    nextGate: disposition.startsWith('SAFE MUTATION DESIGN')
      ? 'HUMAN REVIEW / SEPARATE IMPLEMENTATION AUTHORIZATION FOR REMOVE-EARLIER-OWNER ONLY'
      : 'NO IMPLEMENTATION GATE — RESOLVE CHARACTERIZATION BLOCKER FIRST'
  };
  writeJson(path.join(outDir, 'compact-token-characterization-summary.json'), result);
  console.log(JSON.stringify(result, null, 2));
  if (disposition === 'DEFER / BLOCK') process.exit(1);
}

(async () => {
  if (cmd === 'static') return staticAnalysis(process.argv[3], process.argv[4]);
  if (cmd === 'provenance') return provenance(process.argv[3]);
  if (cmd === 'responsive') return responsive(process.argv[3], process.argv[4]);
  if (cmd === 'summary') return summary(process.argv[3]);
  throw new Error('Unknown command: ' + cmd);
})().catch(err => {
  console.error(err && err.stack || String(err));
  process.exit(1);
});
