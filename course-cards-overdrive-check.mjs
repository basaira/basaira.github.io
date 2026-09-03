import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const required = [
  'course-cards-overdrive-v1.css',
  'course-cards-overdrive-v1.js',
  'track-buttons-v6.css'
];
for (const token of required) {
  if (!html.includes(token)) throw new Error(`Missing ${token} in index.html`);
}
if (!(html.indexOf('course-cards-overdrive-v1.css') < html.indexOf('track-buttons-v6.css'))) {
  throw new Error('course-cards-overdrive-v1.css must load before track-buttons-v6.css');
}
const articleCount = (html.match(/<article class="grid lg:grid-cols-12/g) || []).length;
if (articleCount !== 3) throw new Error(`Expected 3 track articles, found ${articleCount}`);
console.log('course-cards-overdrive-check: ok');
