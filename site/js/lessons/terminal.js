export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function pythonTokens(code) {
  return code.split(/("""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|f?"(?:\\.|[^"\\])*"|f?'(?:\\.|[^'\\])*'|#[^\n]*|\b(?:True|False|None|print|input|int|float|str|bool|def|return|if|else|elif|from|import|as|class|for|while|in|and|or|not|pass)\b|\b\d+(?:\.\d+)?\b)/g).map(text => {
    let kind = '';
    if (/^(f?["'])/.test(text)) kind = 'string';
    else if (text.startsWith('#')) kind = 'comment';
    else if (/^(True|False|None)$/.test(text)) kind = 'literal';
    else if (/^(print|input|int|float|str|bool)$/.test(text)) kind = 'builtin';
    else if (/^(def|return|if|else|elif|from|import|as|class|for|while|in|and|or|not|pass)$/.test(text)) kind = 'keyword';
    else if (/^\d/.test(text)) kind = 'number';
    return { text, kind };
  });
}
const tokenMarkup = (text, kind) => kind ? `<span class="python-${kind}">${escapeHtml(text)}</span>` : escapeHtml(text);
export function highlightPython(code) {
  return pythonTokens(code).map(({ text, kind }) => tokenMarkup(text, kind)).join('');
}
export function highlightLines(code, activeLine = null) {
  const lines = [''];
  for (const { text, kind } of pythonTokens(code)) {
    text.split('\n').forEach((part, index) => {
      if (index) lines.push('');
      lines[lines.length - 1] += tokenMarkup(part, kind);
    });
  }
  return lines.map((line, index) => `<span class="code-line${index + 1 === activeLine ? ' executing-line' : ''}">${line || ' '}</span>`).join('');
}

export function playgroundMarkup(slide) {
  const files = slide.files || [{ name: slide.entryFile || '<stdin>.py', code: slide.code }];
  const entry = slide.entryFile || files[0].name;
  const namedFiles = Boolean(slide.files);
  const fileMarkup = files.map(file => `<div class="file-pane" data-file="${escapeHtml(file.name)}" ${!slide.splitFiles && file.name !== entry ? 'hidden' : ''}>
    ${namedFiles ? `<div class="file-heading">${escapeHtml(file.name)}${file.name === entry ? ' · run this file' : ''}</div>` : ''}
    <div class="code-pane"><pre class="editor-highlight source-code" aria-hidden="true"><code>${highlightLines(file.code)}</code></pre>
      <textarea class="code-editor" aria-label="${namedFiles ? `Edit ${escapeHtml(file.name)}` : 'Edit Python code'}" data-file="${escapeHtml(file.name)}" spellcheck="false" autocapitalize="off" autocomplete="off">${escapeHtml(file.code)}</textarea>
    </div></div>`).join('');
  return `<div class="playground ${slide.initialOutput !== undefined ? 'has-terminal' : ''}">
    <div class="code-toolbar" aria-label="Python example controls"><span class="code-language">Python${files.length > 1 ? ` · ${escapeHtml(entry)}` : ''}</span><div>
      <button type="button" data-action="run" class="run-code">▶ Run</button>
      <button type="button" data-action="step" class="step-code">Step</button>
      <button type="button" data-action="stop" disabled>■ Stop</button>
      <button type="button" data-action="reset">Reset</button>
    </div></div>
    ${files.length > 1 && !slide.splitFiles ? `<div class="file-tabs" role="tablist" aria-label="Python files">${files.map(file => `<button type="button" role="tab" aria-selected="${file.name === entry}" data-open-file="${escapeHtml(file.name)}">${escapeHtml(file.name)}</button>`).join('')}</div>` : ''}
    <div class="code-workspace ${slide.splitFiles ? 'split-files' : ''}">${fileMarkup}</div>
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
  const editors = [...root.querySelectorAll('.code-editor')];
  const entryFile = slide.entryFile || editors[0].dataset.file;
  const editor = editors.find(item => item.dataset.file === entryFile);
  let activeFile = entryFile;
  function openFile(name) {
    if (slide.splitFiles) return;
    root.querySelectorAll('.file-pane').forEach(pane => { pane.hidden = pane.dataset.file !== name; });
    root.querySelectorAll('[data-open-file]').forEach(tab => tab.setAttribute('aria-selected', String(tab.dataset.openFile === name)));
  }
  function updateHighlight() {
    for (const field of editors) {
      const highlight = field.previousElementSibling;
      highlight.querySelector('code').innerHTML = highlightLines(field.value, field.dataset.file === activeFile ? activeLine : null);
      highlight.scrollTop = field.scrollTop; highlight.scrollLeft = field.scrollLeft;
    }
  }
  const terminal = $('.terminal-pane'), output = $('.terminal-output'), inputRow = $('.terminal-input-row');
  const status = $('.execution-status'), variables = $('.runtime-variables');
  let worker = null, watchdog = null, running = false, paused = false, stepMode = false, activeLine = null;
  function setActiveLine(line, filename = entryFile) {
    activeFile = filename || entryFile; activeLine = line;
    if (line) openFile(activeFile); updateHighlight();
    if (line) {
      const editor = editors.find(field => field.dataset.file === activeFile);
      if (!editor) return;
      const highlight = editor.previousElementSibling;
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
    worker?.terminate(); worker = null; running = false; paused = false; editors.forEach(field => { field.readOnly = false; });
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
    running = true; stepMode = mode === 'step'; editors.forEach(field => { field.readOnly = true; });
    status.textContent = stepMode ? 'Stepping' : 'Running';
    buttons.run.disabled = true; buttons.step.disabled = true; buttons.stop.disabled = false;
    try {
      worker = new Worker(new URL('./python-worker.js?v=20261026-modules', import.meta.url));
      const activeWorker = worker;
      worker.onmessage = ({ data }) => {
        if (worker !== activeWorker) return;
        if (data.type === 'output') append(data.text);
        else if (data.type === 'executing') { setActiveLine(data.line, data.filename); }
        else if (data.type === 'paused') {
          clearTimeout(watchdog); paused = true;
          setActiveLine(data.line, data.filename); renderVariables(data.variables);
          status.textContent = `${slide.files ? data.filename + ' · ' : ''}Paused · line ${data.line}`;
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
          if (stepMode) setActiveLine(data.line, data.filename);
          stop(output.textContent ? 'Finished' : 'Finished · no printed output', stepMode);
        } else if (data.type === 'error') {
          append(`${output.textContent && !output.textContent.endsWith('\n') ? '\n' : ''}${data.message}\n`);
          stop('Error');
        }
      };
      worker.onerror = event => { if (worker !== activeWorker) return; append(`${event.message || 'Python could not start.'}\n`); stop('Error'); };
      worker.postMessage({ type: 'run', code: editor.value, mode, entryFile, files: Object.fromEntries(editors.map(field => [field.dataset.file, field.value])) });
      startWatchdog();
    } catch (error) { append(`${error.message}\n`); stop('Error'); }
  }

  function reset() {
    stop(); activeLine = null; activeFile = entryFile;
    const originals = slide.files || [{ name: entryFile, code: slide.code }];
    for (const field of editors) {
      field.value = originals.find(file => file.name === field.dataset.file).code;
      field.scrollTop = 0; field.scrollLeft = 0;
    }
    openFile(entryFile); updateHighlight();
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
  for (const field of editors) {
    field.addEventListener('input', () => { activeLine = null; updateHighlight(); }, { signal: abort.signal });
    field.addEventListener('scroll', () => {
      const highlight = field.previousElementSibling;
      highlight.scrollTop = field.scrollTop; highlight.scrollLeft = field.scrollLeft;
    }, { signal: abort.signal });
  }
  root.querySelectorAll('[data-open-file]').forEach(tab => tab.addEventListener('click', () => openFile(tab.dataset.openFile), { signal: abort.signal }));
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
