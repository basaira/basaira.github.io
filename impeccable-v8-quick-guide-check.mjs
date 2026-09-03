import fs from 'node:fs';
const html = fs.readFileSync('index.html','utf8');
const css = fs.readFileSync('quick-guide-impeccable-v8.css','utf8');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
function ok(cond,msg){ if(!cond){ console.error('IMPECCABLE V8 CHECK FAILED:',msg); process.exit(1); } console.log('✓',msg); }
ok(html.includes('quick-guide-impeccable-v8.css?v=20260901-guide8'), 'v8 concise-guide polish stylesheet is loaded.');
const styles=[...html.matchAll(/<link href="([^"]+\.css[^"]*)" rel="stylesheet"\/>/g)].map(m=>m[1]);
ok(styles.at(-1)==='track-buttons-v6.css?v=20260830-surgical2', 'Track CTA stylesheet remains the final stylesheet.');
ok(css.includes('#quick-guide .basair-guide__intro--learning'), 'Opening guide layout is scoped to #quick-guide.');
ok(css.includes('#quick-guide .outcome-ledger'), 'Outcome ledger refinement is scoped to #quick-guide.');
ok(css.includes('body.route-ru #quick-guide') && css.includes('body.route-uz #quick-guide') && css.includes('body.route-fr #quick-guide'), 'Long-language responsive safeguards exist.');
ok(!css.includes('border-left:') && !css.includes('border-right:'), 'No banned side-stripe accent was introduced.');
ok(!css.includes('background-clip:text') && !css.includes('-webkit-background-clip:text'), 'No gradient text was introduced.');
ok(css.includes('word-break:normal') && css.includes('overflow-wrap:break-word'), 'Long copy wraps at safe word boundaries.');
ok(!css.includes('box-shadow:0 40px') && !css.includes('box-shadow: 0 40px'), 'Heavy ledger shadow is not reintroduced.');
console.log('Impeccable v8 concise-guide invariants passed.');
