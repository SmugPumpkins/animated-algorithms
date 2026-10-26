import Reveal from '../../vendor/reveal/reveal.mjs';
import Notes from '../../vendor/reveal/notes.mjs';
import { escapeHtml, playgroundMarkup, mountPlayground } from './terminal.js?v=20261026-strings';

const $ = selector => document.querySelector(selector);
function inlineCode(text, tokens = []) {
  if (!tokens.length) return escapeHtml(text);
  const pattern = tokens.map(token => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length).join('|');
  return String(text).split(new RegExp(`(?<![A-Za-z0-9_])(${pattern})(?![A-Za-z0-9_])`, 'g')).map(part => tokens.includes(part) ? `<span class="inline-code">${escapeHtml(part)}</span>` : escapeHtml(part)).join('').replace(/<\/span>(\s*)<span class="inline-code">/g, '$1');
}
let deck;
const controllers = new Map();
new ResizeObserver(([entry]) => {
  document.documentElement.style.setProperty('--lesson-nav-height', `${entry.target.getBoundingClientRect().height}px`);
  deck?.layout();
}).observe($('.lesson-nav'));

function slideMarkup(slide, index) {
  const title = `<h${slide.kind === 'cover' || slide.kind === 'closing' ? '1' : '2'}>${inlineCode(slide.title, slide.inlineCode)}${slide.sourceUrl ? `<a class="lesson-source" href="${escapeHtml(slide.sourceUrl)}" target="_blank" rel="noopener">GitHub source ↗</a>` : ''}</h${slide.kind === 'cover' || slide.kind === 'closing' ? '1' : '2'}>`;
  const paragraphs = (slide.paragraphs || []).map(text => `<p>${inlineCode(text, slide.inlineCode)}</p>`).join('');
  const annotations = (slide.annotations || []).map(note => `<div><h3>${escapeHtml(note.title)}</h3><p>${inlineCode(note.text, slide.inlineCode)}</p></div>`).join('');
  const documentation = slide.documentation;
  const contents = slide.kind === 'comparison'
    ? `${title}<div class="comparison-layout">${slide.examples.map(example => `<div class="example-panel">${example.paragraph ? `<div class="source-body comparison-explanation"><p>${inlineCode(example.paragraph, slide.inlineCode)}</p></div>` : ''}${playgroundMarkup(example)}</div>`).join('')}</div>${slide.caption ? `<p class="comparison-caption">${inlineCode(slide.caption, slide.inlineCode)}</p>` : ''}`
    : slide.layout === 'documentation'
      ? `${title}<div class="source-body wide-caption">${paragraphs}</div><div class="documentation-layout">${playgroundMarkup(slide)}<aside class="documentation-preview" aria-label="Function documentation"><pre>${escapeHtml(documentation.signature)}</pre><p>${escapeHtml(documentation.description)}</p><h3>Params:</h3><dl>${documentation.parameters.map(parameter => `<dt><span class="inline-code">${escapeHtml(parameter.name)}</span></dt><dd>${escapeHtml(parameter.description)}</dd>`).join('')}</dl><p><strong>Returns:</strong> ${escapeHtml(documentation.returns)}</p></aside></div>`
    : slide.kind === 'text'
    ? `${title}<div class="source-body text-layout">${paragraphs}</div>`
    : slide.layout === 'wide' || slide.layout === 'annotated'
      ? `${title}<div class="wide-layout">${slide.paragraphs ? `<div class="source-body wide-caption">${paragraphs}</div>` : ''}${playgroundMarkup(slide)}${annotations ? `<div class="code-annotations">${annotations}</div>` : ''}</div>`
    : slide.kind === 'cover'
    ? `<div class="cover-layout"><div class="cover-title">${title}</div><div class="source-body objectives"><p>${inlineCode(slide.intro, slide.inlineCode)}</p><ul>${slide.bullets.map(text => `<li>${inlineCode(text, slide.inlineCode)}</li>`).join('')}</ul></div></div>`
    : slide.kind === 'closing'
      ? `<div class="closing-layout">${title}<div class="source-body">${paragraphs}</div></div>`
      : `${title}<div class="slide-columns"><div class="source-body">${paragraphs}</div>${playgroundMarkup(slide)}</div>`;
  return `<section class="lesson-slide ${slide.kind}-slide ${slide.layout ? `layout-${escapeHtml(slide.layout)}` : ''} ${slide.denseText ? 'dense-text' : ''}" id="slide-${index + 1}" data-source-page="${slide.sourcePage}" aria-label="Slide ${index + 1}: ${escapeHtml(slide.title)}"><div class="slide-content">${contents}</div></section>`;
}

try {
  const response = await fetch('./slides.json');
  if (!response.ok) throw new Error('Lesson content could not be loaded.');
  const slides = await response.json();
  $('.slides').innerHTML = slides.map(slideMarkup).join('');
  $('#slide-select').innerHTML = '<option value="" selected disabled>Select slide</option>' + slides.map((slide, index) => `<option value="${index}">${index + 1}. ${escapeHtml(slide.title)}</option>`).join('');
  document.querySelectorAll('.lesson-slide').forEach((section, index) => {
    const examples = slides[index].examples || (slides[index].code || slides[index].files ? [slides[index]] : []);
    controllers.set(section, [...section.querySelectorAll('.playground')].map((playground, exampleIndex) => mountPlayground(playground, examples[exampleIndex])));
  });
  deck = new Reveal($('.reveal'), {
    width: 1280, height: 720, margin: 0.035, minScale: 0.2, maxScale: 2,
    embedded: true, scrollActivationWidth: null, hash: true, hashOneBasedIndex: true, controls: true,
    progress: true, slideNumber: 'c/t', transition: 'none', center: false,
    controlsBackArrows: 'visible', controlsLayout: 'edges',
    overview: false,
    keyboardCondition: event => !event.target?.closest('input,textarea,select,button'),
    plugins: [Notes],
  });
  await deck.initialize();
  $('.lesson-loading').remove();
  deck.on('slidechanged', event => { controllers.get(event.previousSlide)?.forEach(controller => controller.stop()); });
  $('#slide-select').addEventListener('change', event => {
    deck.slide(Number(event.target.value));
    event.target.value = '';
  });
  $('#fullscreen').addEventListener('click', async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { $('#fullscreen').textContent = 'Fullscreen unavailable'; }
  });
  document.addEventListener('fullscreenchange', () => {
    $('#fullscreen').textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen';
    deck.layout();
  });
  window.addEventListener('pagehide', () => { for (const group of controllers.values()) for (const controller of group) controller.destroy(); });
  window.addEventListener('resize', () => deck.layout());
} catch (error) {
  $('.lesson-loading').textContent = error.message;
  console.error(error);
}
