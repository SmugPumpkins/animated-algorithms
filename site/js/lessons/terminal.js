export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function highlightPython(code) {
  return code.split(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#[^\n]*|\b(?:True|False|None|print|input|int|float|str|bool)\b|\b\d+(?:\.\d+)?\b)/g).map(token => {
    let kind = '';
    if (/^['"]/.test(token)) kind = 'string';
    else if (token.startsWith('#')) kind = 'comment';
    else if (/^(True|False|None)$/.test(token)) kind = 'literal';
    else if (/^(print|input|int|float|str|bool)$/.test(token)) kind = 'builtin';
    else if (/^\d/.test(token)) kind = 'number';
    return kind ? `<span class="python-${kind}">${escapeHtml(token)}</span>` : escapeHtml(token);
  }).join('');
}

export function highlightLines(code, activeLine = null) {
  return code.split('\n').map((line, index) => `<span class="code-line${index + 1 === activeLine ? ' executing-line' : ''}">${highlightPython(line) || ' '}</span>`).join('');
}

export function playgroundMarkup(slide) {
  return `<div class="playground ${slide.initialOutput !== undefined ? 'has-terminal' : ''}">
    <div class="code-toolbar" aria-label="Python example controls"><span class="code-language">Python</span><div>
      <button type="button" data-action="run" class="run-code">▶ Run</button>
      <button type="button" data-action="step" class="step-code">Step</button>
      <button type="button" data-action="stop" disabled>■ Stop</button>
      <button type="button" data-action="reset">Reset</button>
    </div></div>
    <div class="code-pane"><pre class="editor-highlight source-code" aria-hidden="true"><code>${highlightLines(slide.code)}</code></pre>
      <textarea class="code-editor" aria-label="Edit Python code" spellcheck="false" autocapitalize="off" autocomplete="off">${escapeHtml(slide.code)}</textarea>
    </div>
    <div class="terminal-pane" ${slide.initialOutput === undefined ? 'hidden' : ''}>
      <div class="terminal-title"><span>OUTPUT</span><span class="execution-status">Ready</span></div>
      <div class="terminal-screen" tabindex="0" role="log" aria-label="Python output terminal"><span class="terminal-output"></span>
        <form class="terminal-input-row" hidden><span class="terminal-prompt"></span><input class="terminal-input" aria-label="Python terminal input" autocomplete="off" spellcheck="false"><button type="submit" aria-label="Submit terminal input">↵</button></form>
      </div>
      <div class="runtime-variables" aria-label="Variable values" hidden></div>
    </div>
  </div>`;
}

export function mountPlayground(root, slide) {
  const $ = selector => root.querySelector(selector);
  const buttons = Object.fromEntries([...root.querySelectorAll('[data-action]')].map(button => [button.dataset.action, button]));
  const editor = $('.code-editor'), highlight = $('.editor-highlight');
  function updateHighlight() {
    highlight.querySelector('code').innerHTML = highlightLines(editor.value, activeLine);
    highlight.scrollTop = editor.scrollTop; highlight.scrollLeft = editor.scrollLeft;
  }
  const terminal = $('.terminal-pane'), output = $('.terminal-output'), inputRow = $('.terminal-input-row');
  const status = $('.execution-status'), variables = $('.runtime-variables');
  let worker = null, watchdog = null, running = false, paused = false, stepMode = false, activeLine = null;
  function setActiveLine(line) {
    activeLine = line; updateHighlight();
    if (line) {
      const lineHeight = parseFloat(getComputedStyle(editor).lineHeight);
      const padding = parseFloat(getComputedStyle(editor).paddingTop);
      const top = padding + (line - 1) * lineHeight;
      if (top < editor.scrollTop || top + lineHeight > editor.scrollTop + editor.clientHeight) {
        editor.scrollTop = Math.max(0, top - editor.clientHeight / 2);
        highlight.scrollTop = editor.scrollTop;
      }
    }
  }
  function renderVariables(items) {
    variables.replaceChildren();
    for (const item of items) {
      const chip = document.createElement('span'); chip.className = 'runtime-variable';
      const type = document.createElement('small'); type.textContent = `${item.type}:`;
      const name = document.createElement('strong'); name.textContent = item.name;
      const value = document.createElement('span'); value.textContent = item.displayValue ?? item.value;
      chip.append(type, document.createTextNode(' '), name, document.createTextNode(' '), value); variables.append(chip);
    }
    variables.hidden = items.length === 0;
  }

  function stop(message = 'Stopped', keepHighlight = false) {
    if (!running && !worker) return;
    worker?.terminate(); worker = null; running = false; paused = false; editor.readOnly = false;
    clearTimeout(watchdog); watchdog = null;
    inputRow.hidden = true;
    buttons.run.disabled = false; buttons.step.disabled = false; buttons.stop.disabled = true;
    if (!keepHighlight) setActiveLine(null);
    status.textContent = message;
  }
  function startWatchdog() {
    clearTimeout(watchdog);
    watchdog = setTimeout(() => stop('Stopped · execution time limit'), 10000);
  }
  function scrollTerminal() {
    const screen = $('.terminal-screen'); screen.scrollTop = screen.scrollHeight;
  }
  function showTerminal() { terminal.hidden = false; root.classList.add('has-terminal'); }
  function append(text) { output.textContent += text; scrollTerminal(); }

  function run(mode = 'run') {
    if (paused && worker) {
      paused = false; stepMode = mode === 'step';
      status.textContent = stepMode ? 'Stepping' : 'Running';
      buttons.run.disabled = true; buttons.step.disabled = true;
      worker.postMessage({ type: stepMode ? 'step' : 'continue' }); startWatchdog();
      return;
    }
    stop(); setActiveLine(null); showTerminal(); output.textContent = '';
    variables.hidden = true; variables.replaceChildren(); inputRow.hidden = true;
    running = true; stepMode = mode === 'step'; editor.readOnly = true;
    status.textContent = stepMode ? 'Stepping' : 'Running';
    buttons.run.disabled = true; buttons.step.disabled = true; buttons.stop.disabled = false;
    try {
      worker = new Worker(new URL('./python-worker.js?v=20261026-step', import.meta.url));
      const activeWorker = worker;
      worker.onmessage = ({ data }) => {
        if (worker !== activeWorker) return;
        if (data.type === 'output') append(data.text);
        else if (data.type === 'executing') { setActiveLine(data.line); }
        else if (data.type === 'paused') {
          clearTimeout(watchdog); paused = true;
          setActiveLine(data.line); renderVariables(data.variables);
          status.textContent = `Line ${data.line} complete · next: ${data.nextLine}`;
          buttons.run.disabled = false; buttons.step.disabled = false;
        }
        else if (data.type === 'input') {
          clearTimeout(watchdog);
          status.textContent = 'Waiting for input';
          $('.terminal-prompt').textContent = data.prompt;
          $('.terminal-input').value = '';
          inputRow.hidden = false;
          $('.terminal-input').focus({ preventScroll: true });
          scrollTerminal();
        } else if (data.type === 'complete') {
          renderVariables(data.variables);
          if (stepMode) setActiveLine(data.line);
          stop(output.textContent ? 'Finished' : 'Finished · no printed output', stepMode);
        } else if (data.type === 'error') {
          append(`${output.textContent && !output.textContent.endsWith('\n') ? '\n' : ''}${data.message}\n`);
          stop('Error');
        }
      };
      worker.onerror = event => { if (worker !== activeWorker) return; append(`${event.message || 'Python could not start.'}\n`); stop('Error'); };
      worker.postMessage({ type: 'run', code: editor.value, mode });
      startWatchdog();
    } catch (error) { append(`${error.message}\n`); stop('Error'); }
  }

  function reset() {
    stop(); activeLine = null; editor.value = slide.code;
    editor.scrollTop = 0; editor.scrollLeft = 0; updateHighlight();
    output.textContent = '';
    terminal.hidden = slide.initialOutput === undefined;
    root.classList.toggle('has-terminal', !terminal.hidden);
    status.textContent = 'Ready';
    variables.replaceChildren(); variables.hidden = true;
  }

  const handlers = {
    run: () => run(), step: () => run('step'), stop: () => stop(), reset,

  };
  const abort = new AbortController();
  editor.addEventListener('input', () => { activeLine = null; updateHighlight(); }, { signal: abort.signal });
  editor.addEventListener('scroll', () => { highlight.scrollTop = editor.scrollTop; highlight.scrollLeft = editor.scrollLeft; }, { signal: abort.signal });
  for (const [action, button] of Object.entries(buttons)) button.addEventListener('click', handlers[action], { signal: abort.signal });
  inputRow.addEventListener('submit', event => {
    event.preventDefault(); if (!worker || inputRow.hidden) return;
    const value = $('.terminal-input').value;
    append($('.terminal-prompt').textContent + value + '\n');
    inputRow.hidden = true; status.textContent = 'Running';
    worker.postMessage({ type: 'input', value }); startWatchdog();
  }, { signal: abort.signal });
  root.addEventListener('keydown', event => {
    // Arrow keys, Space, F and Reveal shortcuts must remain ordinary input
    // when a terminal/editor/button is focused; Ctrl/Cmd+Enter runs code.
    if (event.target.closest('textarea,input,button')) {
      event.stopPropagation();
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); run(); }
    }
  }, { signal: abort.signal });
  return { stop, destroy() { stop(); abort.abort(); } };
}
