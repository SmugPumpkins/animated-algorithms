import Reveal from '../../vendor/reveal/reveal.mjs';
import Notes from '../../vendor/reveal/notes.mjs';
import { escapeHtml, playgroundMarkup, mountPlayground } from './terminal.js';

const $ = selector => document.querySelector(selector);
function inlineCode(text, tokens = []) {
  if (!tokens.length) return escapeHtml(text);
  const pattern = tokens.map(token => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length).join('|');
  return String(text).split(new RegExp(`(?<![A-Za-z0-9_])(${pattern})(?![A-Za-z0-9_])`, 'g')).map(part => tokens.includes(part) ? `<code>${escapeHtml(part)}</code>` : escapeHtml(part)).join('');
}
let deck;
const controllers = new Map();
new ResizeObserver(([entry]) => {
  document.documentElement.style.setProperty('--lesson-nav-height', `${entry.target.getBoundingClientRect().height}px`);
  deck?.layout();
}).observe($('.lesson-nav'));

function slideMarkup(slide, index) {
  const title = `<h${slide.kind === 'cover' || slide.kind === 'closing' ? '1' : '2'}>${inlineCode(slide.title, slide.inlineCode)}</h${slide.kind === 'cover' || slide.kind === 'closing' ? '1' : '2'}>`;
  const paragraphs = (slide.paragraphs || []).map(text => `<p>${inlineCode(text, slide.inlineCode)}</p>`).join('');
  const contents = slide.kind === 'cover'
    ? `<div class="cover-layout"><div class="cover-title">${title}</div><div class="source-body objectives"><p>${inlineCode(slide.intro, slide.inlineCode)}</p><ul>${slide.bullets.map(text => `<li>${inlineCode(text, slide.inlineCode)}</li>`).join('')}</ul></div></div>`
    : slide.kind === 'closing'
      ? `<div class="closing-layout">${title}<div class="source-body">${paragraphs}</div></div>`
      : `${title}<div class="slide-columns"><div class="source-body">${paragraphs}</div>${playgroundMarkup(slide)}</div>`;
  return `<section class="lesson-slide ${slide.kind}-slide" id="slide-${index + 1}" data-source-page="${slide.sourcePage}" aria-label="Slide ${index + 1}: ${escapeHtml(slide.title)}"><div class="slide-content">${contents}</div></section>`;
}

try {
  const response = await fetch('./slides.json');
  if (!response.ok) throw new Error('Lesson content could not be loaded.');
  const slides = await response.json();
  $('.slides').innerHTML = slides.map(slideMarkup).join('');
  $('#slide-select').innerHTML = slides.map((slide, index) => `<option value="${index}">${index + 1}. ${escapeHtml(slide.title)}</option>`).join('');
  document.querySelectorAll('.lesson-slide').forEach((section, index) => {
    if (slides[index].code) controllers.set(section, mountPlayground(section.querySelector('.playground'), slides[index]));
  });
  deck = new Reveal($('.reveal'), {
    width: 1280, height: 720, margin: 0.035, minScale: 0.2, maxScale: 2,
    embedded: true, scrollActivationWidth: null, hash: true, hashOneBasedIndex: true, controls: true,
    progress: true, slideNumber: 'c/t', transition: 'none', center: false,
    controlsBackArrows: 'visible', controlsLayout: 'edges',
    keyboardCondition: event => !document.body.classList.contains('reading-mode') && !event.target?.closest('input,textarea,select,button'),
    plugins: [Notes],
  });
  await deck.initialize();
  $('.lesson-loading').remove();
  const sync = () => { $('#slide-select').value = String(deck.getIndices().h); };
  sync();
  deck.on('slidechanged', event => { controllers.get(event.previousSlide)?.stop(); sync(); });
  $('#slide-select').addEventListener('change', event => {
    const index = Number(event.target.value);
    if (document.body.classList.contains('reading-mode')) document.querySelectorAll('.lesson-slide')[index].scrollIntoView({ behavior: 'auto' });
    else deck.slide(index);
  });
  $('#overview').addEventListener('click', () => deck.toggleOverview());
  $('#fullscreen').addEventListener('click', async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { $('#fullscreen').textContent = 'Fullscreen unavailable'; }
  });
  document.addEventListener('fullscreenchange', () => {
    $('#fullscreen').textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen';
    deck.layout();
  });
  $('#reading').addEventListener('click', () => {
    const reading = document.body.classList.toggle('reading-mode');
    if (deck.isOverview()) deck.toggleOverview(false);
    $('#reading').setAttribute('aria-pressed', String(reading));
    $('#reading').textContent = reading ? 'Slideshow view' : 'Reading view';
    $('#overview').disabled = reading;
    for (const controller of controllers.values()) controller.stop();
    document.querySelectorAll('.lesson-slide').forEach(section => {
      if (reading) { section.removeAttribute('aria-hidden'); section.removeAttribute('inert'); }
    });
    if (!reading) { deck.sync(); deck.layout(); $('.lesson-stage').scrollTop = 0; }
  });
  window.addEventListener('pagehide', () => { for (const controller of controllers.values()) controller.destroy(); });
  window.addEventListener('resize', () => deck.layout());
} catch (error) {
  $('.lesson-loading').textContent = error.message;
  console.error(error);
}
