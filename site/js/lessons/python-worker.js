/* One disposable worker per run isolates the interpreter and allows Stop to
   interrupt loops immediately, including while waiting for terminal input. */
importScripts('../../vendor/skulpt/skulpt.min.js', '../../vendor/skulpt/skulpt-stdlib.js');

let acceptInput = null, advanceStep = null, stepping = false, currentLine = null;
function variablesFor(scope) {
  return Object.entries(scope || {})
    .filter(([name, value]) => !name.startsWith('__') && value && ['str', 'int', 'float', 'bool', 'list', 'dict', 'tuple', 'NoneType'].includes(value.tp$name))
    .map(([name, value]) => {
      const representation = Sk.misceval.objectRepr(value);
      return { name: Sk.unfixReserved(name), type: value.tp$name, value: typeof representation === 'string' ? representation : representation.v,
        displayValue: value.tp$name === 'str' ? value.v : (typeof representation === 'string' ? representation : representation.v) };
    });
}
self.onmessage = async ({ data }) => {
  if (data.type === 'step' || data.type === 'continue') {
    if (data.type === 'continue') stepping = false;
    advanceStep?.();
    return;
  }
  if (data.type === 'input') {
    if (acceptInput) {
      const resolve = acceptInput;
      acceptInput = null;
      Sk.execStart = Date.now(); // Time spent answering is not execution time.
      resolve(data.value);
    }
    return;
  }
  if (data.type !== 'run') return;
  stepping = data.mode === 'step';
  currentLine = null;
  let outputLength = 0;
  Sk.configure({
    __future__: Sk.python3,
    debugging: stepping,
    breakpoints: filename => filename === '<stdin>.py',
    execLimit: 8000,
    yieldLimit: 50,
    output(text) {
      outputLength += text.length;
      if (outputLength > 100000) throw new Error('Output limit reached.');
      self.postMessage({ type: 'output', text });
    },
    read(filename) {
      const contents = Sk.builtinFiles?.files?.[filename];
      if (contents === undefined) throw new Error(`Module not available: ${filename}`);
      return contents;
    },
    inputfunTakesPrompt: true,
    inputfun(prompt) {
      return new Promise(resolve => {
        acceptInput = resolve;
        self.postMessage({ type: 'input', prompt: String(prompt) });
      });
    },
  });
  try {
    const module = await Sk.misceval.asyncToPromise(
      () => Sk.importMainWithBody('<stdin>', false, data.code, true),
      { 'Sk.debug': suspension => {
        if (!stepping) return;
        let frame = suspension;
        while (frame.child?.$lineno) frame = frame.child;
        const line = frame.$lineno;
        const execute = () => {
          currentLine = line;
          Sk.execStart = Date.now(); Sk.lastYield = Date.now();
          self.postMessage({ type: 'executing', line });
          return suspension.resume();
        };
        // The first press executes the first statement. Subsequent breakpoints
        // retain the live interpreter, rather than replaying earlier code.
        if (currentLine === null) return Promise.resolve().then(execute);
        self.postMessage({ type: 'paused', line: currentLine, nextLine: line,
          variables: variablesFor({ ...frame.$gbl, ...frame.$loc }) });
        return new Promise((resolve, reject) => {
          advanceStep = () => {
            advanceStep = null;
            try { resolve(execute()); } catch (error) { reject(error); }
          };
        });
      } },
    );
    self.postMessage({ type: 'complete', line: currentLine, variables: variablesFor(module.$d) });
  } catch (error) {
    self.postMessage({ type: 'error', message: String(error) });
  }
};
