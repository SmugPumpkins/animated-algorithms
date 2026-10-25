import { MAZE, START, END, cellKey, buildSteps } from './dfs-engine.js';
import { nodes } from './dfs-flow.js';
import { Player } from '../player.js';

function flowchart() {
  const edges = [
    ['CALL','BOUNDS'], ['BOUNDS','WALL','T'], ['WALL','VISITED','F'],
    ['VISITED','EXIT','F'], ['EXIT','MARK','F'], ['MARK','UP'], ['UP','CHECK_UP'],
    ['DOWN','CHECK_DOWN'], ['CHECK_DOWN','RIGHT','F'], ['RIGHT','CHECK_RIGHT'],
    ['CHECK_RIGHT','LEFT','F'], ['LEFT','CHECK_LEFT'], ['CHECK_LEFT','FALSE_END','F'],
    ['BOUNDS','FALSE_BOUNDS','F',true], ['WALL','FALSE_WALL','T',true],
    ['VISITED','FALSE_VISITED','T',true], ['EXIT','TRUE_EXIT','T',true],
    ['CHECK_UP','TRUE_UP','T',true], ['CHECK_UP','DOWN','F',true],
    ['CHECK_DOWN','TRUE_DOWN','T',true], ['CHECK_RIGHT','TRUE_RIGHT','T',true],
    ['CHECK_LEFT','TRUE_LEFT','T',true],
  ];
  const lines = edges.map(([from,to,label,horizontal]) => {
    const a=nodes[from], b=nodes[to];
    const sign=horizontal ? Math.sign(b.x-a.x) : Math.sign(b.y-a.y);
    const x1=a.x+(horizontal ? sign*a.w/2 : 0), y1=a.y+(horizontal ? 0 : sign*a.h/2);
    const x2=b.x-(horizontal ? sign*b.w/2 : 0), y2=b.y-(horizontal ? 0 : sign*b.h/2);
    return `<path d="M${x1},${y1} L${x2},${y2}" marker-end="url(#arrow)"/>${label ? `<text class="edge-label" x="${horizontal ? (x1+x2)/2 : x1+13}" y="${horizontal ? y1-8 : (y1+y2)/2+4}">${label}</text>` : ''}`;
  }).join('');
  const shapes = Object.entries(nodes).map(([id,n]) => {
    const x=n.x-n.w/2, y=n.y-n.h/2;
    let shape;
    if (n.type === 'decision') shape=`<polygon points="${n.x},${y} ${x+n.w},${n.y} ${n.x},${y+n.h} ${x},${n.y}"/>`;
    else if (n.type === 'io') shape=`<polygon points="${x+12},${y} ${x+n.w},${y} ${x+n.w-12},${y+n.h} ${x},${y+n.h}"/>`;
    else shape=`<rect x="${x}" y="${y}" width="${n.w}" height="${n.h}" rx="${n.type==='subroutine' ? 1 : 6}"/>`;
    if(n.type==='subroutine') shape+=`<path d="M${x+18},${y} v${n.h} M${x+n.w-18},${y} v${n.h}"/>`;
    const labels=n.label.split('\n');
    return `<g class="flow-node" data-node="${id}">${shape}<text x="${n.x}" y="${n.y-(labels.length-1)*7+4}">${labels.map((line,i)=>`<tspan x="${n.x}" dy="${i ? 14 : 0}">${line}</tspan>`).join('')}</text></g>`;
  }).join('');
  return `<svg class="flowchart" viewBox="0 0 715 680" role="img" aria-label="Recursive solve flowchart. Check bounds, walls, visited cells and exit, then try up, down, right and left in order."><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z"/></marker></defs><text class="flow-title" x="210" y="29">solve(current)</text><g class="flow-edges">${lines}</g>${shapes}</svg>`;
}

const mouseIcon = `<g class="mouse-icon"><circle cx="-15" cy="-15" r="10"/><circle cx="15" cy="-15" r="10"/><circle class="ear" cx="-15" cy="-15" r="5"/><circle class="ear" cx="15" cy="-15" r="5"/><ellipse cy="3" rx="22" ry="20"/><circle class="eye" cx="-8" cy="0" r="2.8"/><circle class="eye" cx="8" cy="0" r="2.8"/><circle class="nose" cy="10" r="4"/></g>`;

function mazeMarkup() {
  return `<svg class="maze" viewBox="0 0 560 480" role="img" aria-label="Maze with six rows and seven columns. Start at row 1 column 1; exit at row 4 column 5. Coordinates start at zero.">${MAZE.map((row,r)=>row.map((wall,c)=>`<g transform="translate(${c*80},${r*80})"><rect data-cell="${r},${c}" class="cell ${wall?'wall':'open'}" x="3" y="3" width="74" height="74" rx="8"/>${cellKey([r,c]) === cellKey(START) ? '<text class="cell-label" x="40" y="70">START</text>' : cellKey([r,c]) === cellKey(END) ? '<text class="cell-label" x="40" y="70">EXIT</text>' : ''}</g>`).join('')).join('')}<rect id="candidate" class="candidate" width="66" height="66" rx="6"/><g id="mouse">${mouseIcon}</g></svg>`;
}

export function mount(root) {
  const steps=buildSteps(), player=new Player(steps.length);
  let frame, disposed=false;
  root.innerHTML = `<section class="demo-heading"><div><p class="eyebrow">CSE 3310 / RECURSIVE ALGORITHMS 1</p><h1>Depth-first search<span class="heading-dot">.</span></h1><p>One path at a time. Explore the maze, follow the calls, and watch the algorithm backtrack.</p></div><button type="button" id="fullscreen" class="button secondary">⛶ Present fullscreen</button></section>
  <section class="workspace" aria-label="Depth-first search demonstration">
    <div class="workspace-bar"><span><span class="status-dot"></span> RECURSIVE MAZE SOLVER</span><span id="playback-status">Paused · 1 step/s</span></div>
    <div class="visual-grid"><div class="maze-column"><div class="panel-heading"><h2>The maze</h2><span>up → down → right → left</span></div>${mazeMarkup()}<div class="legend"><span><i class="swatch visited"></i>Visited</span><span><i class="swatch failed"></i>Dead end</span><span><i class="swatch solution"></i>Solution</span><span><i class="swatch focus"></i>Checking</span></div><div class="stack-panel"><div class="panel-heading"><h2>Call stack</h2><span id="depth"></span></div><div id="stack" class="stack" aria-label="Current recursive calls"></div><p class="stack-hint">Newest call first · coordinates are (row, column)</p></div></div><div class="flow-column"><div class="panel-heading"><h2>The recursive flow</h2><span>Highlight = current instruction</span></div>${flowchart()}</div></div>
    <div class="explanation"><span class="step-badge" id="step-badge"></span><p id="message" aria-live="polite"></p><span id="return-value"></span></div>
    <div class="transport"><div class="timeline"><label for="timeline">Search progress</label><input id="timeline" type="range" min="0" max="${steps.length-1}" value="0"><output id="step-count" for="timeline"></output></div><div class="controls"><div class="control-group"><button type="button" id="reset" class="button secondary" title="Restart (R)">↺ <span>Reset</span></button><button type="button" id="previous" class="button secondary" aria-label="Previous step" title="Previous step (Left arrow)">←</button><button type="button" id="play" class="button primary" title="Play or pause (Space)">▶ Play</button><button type="button" id="next" class="button secondary" aria-label="Next step" title="Next step (Right arrow)">→</button></div><div class="control-group"><label class="speed-label" for="speed">Speed</label><select id="speed"><option value="0.25">Slow · 0.25 steps/s</option><option value="1" selected>Normal · 1 step/s</option><option value="10">Fast · 10 steps/s</option></select><button type="button" id="loop" class="button secondary" aria-pressed="false" title="Toggle loop (L)">⟳ Loop</button></div></div><p class="keyboard-hint"><kbd>Space</kbd> play/pause <kbd>←</kbd><kbd>→</kbd> step <kbd>F</kbd> fast <kbd>S</kbd> slow <kbd>N</kbd> normal <kbd>L</kbd> loop <kbd>R</kbd> reset <span>Esc exits fullscreen</span></p></div>
  </section><details class="teaching-notes"><summary>Teaching notes <span>Base cases, recursive calls & backtracking</span></summary><div><p><strong>Base cases:</strong> Positions outside the maze, walls, and previously visited cells return False. Reaching the exit returns True.</p><p><strong>Recursive case:</strong> Mark the cell visited, then try up, down, right, and left. Each call runs the same flowchart from the top.</p><p><strong>Backtracking:</strong> If every direction fails, return False. If a direction succeeds, pass True to the caller, revealing the solution as the call stack unwinds.</p><p><strong>Discuss:</strong> Why check visited cells? What happens if we change the direction order? Does depth-first search always find the shortest path?</p></div></details>`;
  const $=selector=>root.querySelector(selector);
  const cells=[...root.querySelectorAll('[data-cell]')], flowNodes=[...root.querySelectorAll('[data-node]')];
  function render() {
    const state=steps[player.index];
    for(const cell of cells) {
      const key=cell.dataset.cell, [r,c]=key.split(',').map(Number);
      cell.setAttribute('class',`cell ${MAZE[r][c] ? 'wall' : state.solution.includes(key) ? 'solution' : state.failed.includes(key) ? 'failed' : state.visited.includes(key) ? 'visited' : 'open'}`);
    }
    $('#mouse').setAttribute('transform',`translate(${state.mouse[1]*80+40},${state.mouse[0]*80+33})`);
    const candidate=state.candidate, inBounds=candidate && MAZE[candidate[0]]?.[candidate[1]] !== undefined;
    $('#candidate').style.display=inBounds?'':'none';
    if(inBounds) { $('#candidate').setAttribute('x',candidate[1]*80+7); $('#candidate').setAttribute('y',candidate[0]*80+7); }
    for(const node of flowNodes) node.classList.toggle('active',node.dataset.node===state.node);
    $('#depth').textContent=`Depth ${state.stack.length}`;
    $('#stack').innerHTML=state.stack.length ? [...state.stack].reverse().map((p,i)=>`<span class="stack-frame ${i===0?'top':''}"><small>${state.stack.length-i}</small> solve(${p.join(', ')})</span>`).join('') : '<span class="stack-empty">No active calls</span>';
    $('#message').textContent=state.message;
    $('#step-badge').textContent=state.node.replaceAll('_',' ');
    $('#return-value').textContent=state.returning === null ? '' : `RETURN ${state.returning ? 'TRUE' : 'FALSE'}`;
    $('#return-value').className=state.returning ? 'returns-true' : 'returns-false';
    $('#step-count').textContent=`${player.index+1} / ${steps.length}`;
    $('#timeline').value=player.index;
    $('#play').textContent=player.playing?'Ⅱ Pause':'▶ Play';
    $('#play').setAttribute('aria-label',player.playing?'Pause playback':'Play demonstration');
    $('#loop').setAttribute('aria-pressed',String(player.loop));
    $('#speed').value=player.speed;
    $('#previous').disabled=player.index===0;
    $('#next').disabled=player.index===steps.length-1;
    $('#playback-status').textContent=`${player.playing?'Playing':'Paused'} · ${player.speed} step${player.speed===1?'':'s'}/s${player.loop?' · Loop on':''}`;
  }
  function act(action) {
    const now=performance.now();
    if(action==='play') player.toggle(now);
    if(action==='loop') player.loop=!player.loop;
    if(action==='reset') player.reset(now);
    if(action==='next') player.seek(player.index+1,now);
    if(action==='previous') player.seek(player.index-1,now);
    render();
  }
  for(const action of ['play','loop','reset','next','previous']) $(`#${action}`).addEventListener('click',()=>act(action));
  $('#speed').addEventListener('change',event=>{player.setSpeed(Number(event.target.value),performance.now()); render();});
  $('#timeline').addEventListener('input',event=>{player.seek(event.target.value,performance.now()); render();});
  $('#fullscreen').addEventListener('click', async()=>{
    try { if(document.fullscreenElement) await document.exitFullscreen(); else await root.requestFullscreen(); }
    catch { $('#fullscreen').textContent='Fullscreen unavailable'; }
  });
  function fullscreenChanged() { $('#fullscreen').textContent=document.fullscreenElement?'⛶ Exit fullscreen':'⛶ Present fullscreen'; }
  document.addEventListener('fullscreenchange',fullscreenChanged);
  function onKey(event) {
    if(event.altKey||event.ctrlKey||event.metaKey||event.repeat||event.target.closest('input,select,textarea,[contenteditable="true"]')) return;
    if(event.target.closest('button,a') && (event.key===' ' || event.key==='Enter')) return;
    const action={' ':'play',l:'loop',r:'reset',ArrowLeft:'previous',ArrowRight:'next'}[event.key.length===1?event.key.toLowerCase():event.key];
    const speed={f:10,s:0.25,n:1}[event.key.toLowerCase()];
    if(action) {event.preventDefault();act(action);}
    if(speed) {
      event.preventDefault(); player.setSpeed(speed,performance.now());
      if(!player.playing) player.toggle(performance.now());
      render();
    }
  }
  document.addEventListener('keydown',onKey);
  function animate(now) { if(disposed) return; if(player.tick(now)) render(); frame=requestAnimationFrame(animate); }
  function onVisibility() {player.lastTime=performance.now();}
  document.addEventListener('visibilitychange',onVisibility);
  render(); frame=requestAnimationFrame(animate);
  return ()=>{
    disposed=true; cancelAnimationFrame(frame);
    document.removeEventListener('keydown',onKey);
    document.removeEventListener('fullscreenchange',fullscreenChanged);
    document.removeEventListener('visibilitychange',onVisibility);
  };
}
