import Reveal from '../../vendor/reveal/reveal.mjs';
import Notes from '../../vendor/reveal/notes.mjs';
import { escapeHtml, playgroundMarkup, mountPlayground } from './terminal.js?v=20261026-textfiles';
import { loadAssignment, assignmentMarkup } from './assignments.js?v=20261026-wrapups';
import { flowchartMarkup, mountFlowchart } from './flowchart.js?v=20261026-flowcharts';

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
  const cyclePositions = [[240, 20], [460, 160], [370, 360], [110, 360], [20, 160]];
  const cycle = slide.cycle ? `<svg class="lesson-cycle" viewBox="0 0 700 480" role="img" aria-label="Read-process-write cycle"><defs><marker id="cycle-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="#a09cb8"/></marker></defs>${["M450 65L540 145", "M565 250L515 345", "M355 405L325 405", "M150 345L105 250", "M155 145L235 85"].map(d => `<path class="cycle-links" d="${d}"/>`).join('')}${slide.cycle.map((node, i) => {
    const [x,y] = cyclePositions[i];
    const lines = [''];
    for (const word of node.label.split(' ')) {
      if ((lines.at(-1) + ' ' + word).trim().length > 14) lines.push(word);
      else lines[lines.length - 1] = (lines.at(-1) + ' ' + word).trim();
    }
    return `<g class="flow-node" data-node="cycle-${i}" data-role="${escapeHtml(node.role)}" transform="translate(${x} ${y})"><rect width="210" height="90" rx="12"/><text x="105" y="37" text-anchor="middle"><tspan x="105">${escapeHtml(lines[0])}</tspan><tspan x="105" dy="28">${escapeHtml(lines[1] || '')}</tspan></text></g>`;
  }).join('')}</svg>` : '';
  const title = `<h${slide.kind === 'cover' || slide.kind === 'closing' ? '1' : '2'}>${inlineCode(slide.title, slide.inlineCode)}${slide.sourceUrl ? `<a class="lesson-source" href="${escapeHtml(slide.sourceUrl)}" target="_blank" rel="noopener">GitHub source ↗</a>` : ''}</h${slide.kind === 'cover' || slide.kind === 'closing' ? '1' : '2'}>`;
  const paragraphs = (slide.paragraphs || []).map(text => `<p>${inlineCode(text, slide.inlineCode)}</p>`).join('')
    + (slide.bodyBullets ? `<ul class="lesson-body-list">${slide.bodyBullets.map(text => `<li>${inlineCode(text, slide.inlineCode)}</li>`).join('')}</ul>` : '')
    + (slide.afterBullets || []).map(text => `<p>${inlineCode(text, slide.inlineCode)}</p>`).join('');
  const stages = slide.stageLabels ? `<ol class="ipo-stages" aria-label="Program stages">${slide.stageLabels.map(label => `<li>${escapeHtml(label)}</li>`).join('')}</ol>` : '';
  const ipoChart = slide.ipoChart ? `<table class="ipo-chart"><thead><tr>${slide.ipoChart.headers.map(header => `<th scope="col">${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody><tr>${slide.ipoChart.cells.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr></tbody></table>` : '';
  const indexGrid = slide.indexGrid ? `<table class="lesson-index-grid" aria-label="Row and column indices"><tbody>${slide.indexGrid.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : '';
  const annotations = (slide.annotations || []).map(note => `<div><h3>${escapeHtml(note.title)}</h3><p>${inlineCode(note.text, slide.inlineCode)}</p></div>`).join('');
  const documentation = slide.documentation;
  const contents = slide.kind === 'flowchart'
    ? `${title}<div class="${slide.flowLayout === 'wide' ? 'lesson-flow-wide' : 'slide-columns'}"><div class="source-body">${paragraphs}</div>${flowchartMarkup(slide,index)}</div>`
    : slide.kind === 'resource'
    ? `<h2><a class="lesson-resource-link" href="${escapeHtml(slide.resourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(slide.title)} ↗</a></h2><div class="slide-columns"><div class="source-body">${paragraphs}</div><img class="lesson-resource-image" src="${escapeHtml(slide.image)}" alt="${escapeHtml(slide.imageAlt)}"></div>`
    : slide.kind === 'wrapup'
    ? `${title}<ul class="wrapup-list source-body">${slide.bullets.map(text => `<li>${inlineCode(text, slide.inlineCode)}</li>`).join('')}</ul><aside class="assignment-next" aria-label="Next step" data-assignment-next><p>Loading assignment link…</p></aside>`
    : slide.kind === 'comparison'
    ? `${title}<div class="comparison-layout">${slide.examples.map(example => `<div class="example-panel">${example.paragraph ? `<div class="source-body comparison-explanation"><p>${inlineCode(example.paragraph, slide.inlineCode)}</p></div>` : ''}${playgroundMarkup(example)}</div>`).join('')}</div>${slide.caption ? `<p class="comparison-caption">${inlineCode(slide.caption, slide.inlineCode)}</p>` : ''}`
    : slide.layout === 'documentation'
      ? `${title}<div class="source-body wide-caption">${paragraphs}</div><div class="documentation-layout">${playgroundMarkup(slide)}<aside class="documentation-preview" aria-label="Function documentation"><pre>${escapeHtml(documentation.signature)}</pre><p>${escapeHtml(documentation.description)}</p><h3>Params:</h3><dl>${documentation.parameters.map(parameter => `<dt><span class="inline-code">${escapeHtml(parameter.name)}</span></dt><dd>${escapeHtml(parameter.description)}</dd>`).join('')}</dl><p><strong>Returns:</strong> ${escapeHtml(documentation.returns)}</p></aside></div>`
    : slide.kind === 'cycle'
    ? `${title}<div class="slide-columns"><div class="source-body">${paragraphs}</div>${cycle}</div>`
    : slide.ipoChart
    ? `${title}<div class="ipo-layout"><div class="source-body">${paragraphs}</div>${ipoChart}</div>`
    : slide.kind === 'text'
    ? `${title}<div class="source-body text-layout">${paragraphs}</div>`
    : slide.layout === 'wide' || slide.layout === 'annotated'
      ? `${title}<div class="wide-layout">${slide.paragraphs ? `<div class="source-body wide-caption">${paragraphs}</div>` : ''}${playgroundMarkup(slide)}${annotations ? `<div class="code-annotations">${annotations}</div>` : ''}</div>`
    : slide.kind === 'cover'
    ? `<div class="cover-layout"><div class="cover-title">${title}</div><div class="source-body objectives"><p>${inlineCode(slide.intro, slide.inlineCode)}</p>${slide.objectiveLead ? `<p>${inlineCode(slide.objectiveLead, slide.inlineCode)}</p>` : ''}<ul>${slide.bullets.map(text => `<li>${inlineCode(text, slide.inlineCode)}</li>`).join('')}</ul></div></div>`
    : slide.kind === 'closing'
      ? `<div class="closing-layout">${title}<div class="source-body">${paragraphs}</div></div>`
      : `${title}<div class="slide-columns"><div class="source-body">${paragraphs}${stages}${indexGrid}</div>${playgroundMarkup(slide)}</div>`;
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
    const mounted = [...section.querySelectorAll('.playground')].map((playground, exampleIndex) => mountPlayground(playground, examples[exampleIndex]));
    const flow = section.querySelector('[data-flow-player]');
    if (flow) mounted.push(mountFlowchart(flow, slides[index].flowExample));
    controllers.set(section, mounted);
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
  const lessonParts = location.pathname.split('/').filter(Boolean);
  const lessonKey = lessonParts.slice(lessonParts.lastIndexOf('lessons') + 1, lessonParts.lastIndexOf('lessons') + 3).join('/');
  const assignmentAbort = new AbortController();
  loadAssignment(lessonKey, { signal: assignmentAbort.signal }).then(assignment => {
    document.querySelectorAll('[data-assignment-next]').forEach(panel => { panel.innerHTML = assignmentMarkup(assignment); });
    deck.layout();
  }).catch(error => {
    if (assignmentAbort.signal.aborted) return;
    console.error('Assignment links:', error);
    document.querySelectorAll('[data-assignment-next]').forEach(panel => { panel.innerHTML = assignmentMarkup({ status: 'unavailable' }); });
    deck.layout();
  });
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
  window.addEventListener('pagehide', () => { assignmentAbort.abort(); for (const group of controllers.values()) for (const controller of group) controller.destroy(); });
  window.addEventListener('resize', () => deck.layout());
} catch (error) {
  $('.lesson-loading').textContent = error.message;
  console.error(error);
}
