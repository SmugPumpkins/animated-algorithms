import { FLOW_ROLES, flowLegend } from '../flowchart-theme.js';
import { escapeHtml } from './terminal.js?v=20261026-textfiles';

export function flowchartSteps(example) {
  const steps = [];
  const add = (node, text) => steps.push({node, text});
  add('start', 'Start the algorithm.');
  if (example === 'sequence') {
    const name = 'Alex';
    add('input', `Example input: name = "${name}".`);
    const message = 'Hello' + name;
    add('message', `Join "Hello" and name: message = "${message}".`);
    add('output', `Display message: ${message}`);
  } else if (example === 'selection') {
    const temp = 25, warm = 21;
    add('values', `Set temp_celsius = ${temp} and WARM = ${warm}.`);
    add('check', `${temp} > ${warm} is ${temp > warm ? 'True' : 'False'}.`);
    add(temp > warm ? 'hot' : 'sweater', temp > warm ? 'Display: Wow, it sure is hot!' : 'Display: Grab a sweater!');
  } else if (example === 'iteration') {
    let total = 0, i = 0;
    add('values', 'Set total = 0 and i = 0.');
    while (true) {
      add('check', `${i} < 3 is ${i < 3 ? 'True' : 'False'}.`);
      if (i >= 3) break;
      total += i;
      add('total', `Add i to total: total = ${total}.`);
      i++;
      add('increment', `Increase i by 1: i = ${i}. Return to the decision.`);
    }
    add('output', `Display total: ${total}`);
  } else throw new Error(`Unknown flowchart example: ${example}`);
  add('end', 'End the algorithm.');
  return steps;
}

function nodeMarkup(node) {
  if (!Object.hasOwn(FLOW_ROLES, node.role)) throw new Error(`Unknown flowchart role: ${node.role}`);
  const {width:w, height:h} = node;
  let shape;
  if (node.type === 'terminator') shape = `<rect width="${w}" height="${h}" rx="${h / 2}"/>`;
  else if (node.type === 'decision') shape = `<polygon points="${w/2},0 ${w},${h/2} ${w/2},${h} 0,${h/2}"/>`;
  else if (node.type === 'io') shape = `<polygon points="22,0 ${w},0 ${w-22},${h} 0,${h}"/>`;
  else if (node.type === 'process' || node.type === 'predefined') shape = `<rect width="${w}" height="${h}" rx="4"/>${node.type === 'predefined' ? `<path d="M14 0V${h} M${w-14} 0V${h}"/>` : ''}`;
  else throw new Error(`Unknown flowchart shape: ${node.type}`);
  const lines = node.lines || [];
  return `<g class="flow-node" data-node="${escapeHtml(node.id)}" data-role="${node.role}" transform="translate(${node.x} ${node.y})">${shape}<text x="${w/2}" y="${h/2 - (lines.length-1)*13 + 7}" text-anchor="middle">${lines.map((line,i) => `<tspan x="${w/2}" dy="${i ? 26 : 0}">${escapeHtml(line)}</tspan>`).join('')}</text></g>`;
}

export function flowchartMarkup(slide, index) {
  const diagram = slide.diagram;
  const marker = `lesson-arrow-${index}`;
  const roles = [...new Set(diagram.nodes.map(node => node.role))];
  return `<div class="lesson-flow-panel" ${slide.flowExample ? 'data-flow-player' : ''}>
    ${slide.flowExample ? '<div class="code-toolbar"><span class="code-language">Flowchart</span><div><button type="button" data-flow="run" class="run-code">▶ Run</button><button type="button" data-flow="step">Step</button><button type="button" data-flow="stop" disabled>■ Stop</button><button type="button" data-flow="reset">Reset</button></div></div>' : ''}
    <div class="lesson-flow-visual"><svg class="flowchart lesson-flowchart" viewBox="0 0 ${diagram.width} ${diagram.height}" role="img" aria-label="${escapeHtml(slide.title)} flowchart"><defs><marker id="${marker}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0L10 5L0 10Z"/></marker></defs><g class="flow-edges">${diagram.edges.map(edge => `<path d="${escapeHtml(edge.path)}" marker-end="url(#${marker})"/>${edge.label ? `<text class="edge-label" x="${edge.x}" y="${edge.y}">${escapeHtml(edge.label)}</text>` : ''}`).join('')}</g>${diagram.nodes.map(nodeMarkup).join('')}</svg></div>
    ${roles.length ? flowLegend(roles) : ''}
    ${slide.flowExample ? '<p class="flow-step-status" aria-live="polite">Press Run or Step to follow the algorithm.</p>' : ''}
  </div>`;
}

export function mountFlowchart(root, example) {
  const steps = flowchartSteps(example), buttons = Object.fromEntries([...root.querySelectorAll('[data-flow]')].map(button => [button.dataset.flow, button]));
  const status = root.querySelector('.flow-step-status');
  let position = -1, timer = null;
  function stop() { clearInterval(timer); timer = null; buttons.stop.disabled = true; buttons.run.disabled = false; buttons.step.disabled = false; }
  function advance() {
    if (position >= steps.length - 1) return stop();
    const step = steps[++position];
    root.querySelectorAll('[data-node]').forEach(node => node.classList.toggle('active', node.dataset.node === step.node));
    status.textContent = `${position + 1} / ${steps.length} · ${step.text}`;
    if (position === steps.length - 1) stop();
  }
  function reset() { stop(); position = -1; root.querySelectorAll('.active').forEach(node => node.classList.remove('active')); status.textContent = 'Press Run or Step to follow the algorithm.'; }
  const abort = new AbortController();
  buttons.run.addEventListener('click', () => { if (position === steps.length - 1) reset(); advance(); if (position < steps.length - 1) { timer = setInterval(advance, 1000); buttons.run.disabled = true; buttons.step.disabled = true; buttons.stop.disabled = false; } }, {signal:abort.signal});
  buttons.step.addEventListener('click', () => { stop(); if (position === steps.length - 1) reset(); advance(); }, {signal:abort.signal});
  buttons.stop.addEventListener('click', stop, {signal:abort.signal});
  buttons.reset.addEventListener('click', reset, {signal:abort.signal});
  return {stop, destroy() {stop(); abort.abort();}};
}
