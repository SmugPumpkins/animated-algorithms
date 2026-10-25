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

export function playgroundMarkup(slide) {
  return `<div class="playground ${slide.initialOutput !== undefined ? 'has-terminal' : ''}">
    <div class="code-toolbar" aria-label="Python example controls"><span class="code-language">Python</span><div>
      <button type="button" data-action="run" class="run-code">▶ Run</button>
      <button type="button" data-action="stop" disabled>■ Stop</button>
      <button type="button" data-action="edit" aria-pressed="false">Edit code</button>
      <button type="button" data-action="reset">Reset</button>
    </div></div>
    <div class="code-pane"><pre class="source-code" tabindex="0" aria-label="Python code"><code>${highlightPython(slide.code)}</code></pre>
      <textarea class="code-editor" aria-label="Edit Python code" spellcheck="false" autocapitalize="off" autocomplete="off" hidden>${escapeHtml(slide.code)}</textarea>
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
  const editor = $('.code-editor'), source = $('.source-code');
  const terminal = $('.terminal-pane'), output = $('.terminal-output'), inputRow = $('.terminal-input-row');
  const status = $('.execution-status'), variables = $('.runtime-variables');
  let worker = null, watchdog = null, editing = false, running = false;

  function stop(message = 'Stopped') {
    if (!running && !worker) return;
    worker?.terminate(); worker = null; running = false;
    clearTimeout(watchdog); watchdog = null;
    inputRow.hidden = true;
    buttons.run.disabled = false; buttons.stop.disabled = true;
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

  function run() {
    stop(); showTerminal(); output.textContent = '';
    variables.hidden = true; variables.replaceChildren(); inputRow.hidden = true;
    running = true; status.textContent = 'Running';
    buttons.run.disabled = true; buttons.stop.disabled = false;
    try {
      worker = new Worker(new URL('./python-worker.js', import.meta.url));
      worker.onmessage = ({ data }) => {
        if (data.type === 'output') append(data.text);
        else if (data.type === 'input') {
          clearTimeout(watchdog);
          status.textContent = 'Waiting for input';
          $('.terminal-prompt').textContent = data.prompt;
          $('.terminal-input').value = '';
          inputRow.hidden = false;
          $('.terminal-input').focus({ preventScroll: true });
          scrollTerminal();
        } else if (data.type === 'complete') {
          variables.replaceChildren();
          for (const item of data.variables) {
            const chip = document.createElement('span'); chip.className = 'runtime-variable';
            const name = document.createElement('strong'); name.textContent = item.name;
            const value = document.createElement('span'); value.textContent = item.value;
            const type = document.createElement('small'); type.textContent = item.type;
            chip.append(name, value, type); variables.append(chip);
          }
          variables.hidden = data.variables.length === 0;
          stop(output.textContent ? 'Finished' : 'Finished · no printed output');
        } else if (data.type === 'error') {
          append(`${output.textContent && !output.textContent.endsWith('\n') ? '\n' : ''}${data.message}\n`);
          stop('Error');
        }
      };
      worker.onerror = event => { append(`${event.message || 'Python could not start.'}\n`); stop('Error'); };
      worker.postMessage({ type: 'run', code: editor.value });
      startWatchdog();
    } catch (error) { append(`${error.message}\n`); stop('Error'); }
  }

  function reset() {
    stop(); editor.value = slide.code; editing = false;
    editor.hidden = true; source.hidden = false;
    source.querySelector('code').innerHTML = highlightPython(slide.code);
    buttons.edit.textContent = 'Edit code'; buttons.edit.setAttribute('aria-pressed', 'false');
    output.textContent = '';
    terminal.hidden = slide.initialOutput === undefined;
    root.classList.toggle('has-terminal', !terminal.hidden);
    status.textContent = 'Ready';
    variables.replaceChildren(); variables.hidden = true;
  }

  const handlers = {
    run, stop: () => stop(), reset,
    edit() {
      editing = !editing;
      editor.hidden = !editing; source.hidden = editing;
      buttons.edit.textContent = editing ? 'View code' : 'Edit code';
      buttons.edit.setAttribute('aria-pressed', String(editing));
      if (editing) editor.focus({ preventScroll: true });
      else source.querySelector('code').innerHTML = highlightPython(editor.value);
    },
  };
  const abort = new AbortController();
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
