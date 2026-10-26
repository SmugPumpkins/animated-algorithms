/* One disposable worker per run isolates the interpreter and allows Stop to
   interrupt loops immediately, including while waiting for terminal input. */
importScripts('../../vendor/skulpt/skulpt.min.js', '../../vendor/skulpt/skulpt-stdlib.js');

let acceptInput = null, advanceStep = null, stepping = false, currentLine = null, currentFile = null;
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
  currentLine = null; currentFile = null;
  const files = data.files || {};
  const entryFile = data.entryFile || '<stdin>.py';
  const resolveFile = filename => Object.keys(files).find(name => filename === name || filename.endsWith('/' + name)) || filename;
  const localFile = filename => filename === entryFile || Object.hasOwn(files, resolveFile(filename));
  let outputLength = 0;
  Sk.configure({
    __future__: Sk.python3,
    debugging: stepping,
    breakpoints: localFile,
    execLimit: 8000,
    yieldLimit: 50,
    output(text) {
      outputLength += text.length;
      if (outputLength > 100000) throw new Error('Output limit reached.');
      self.postMessage({ type: 'output', text });
    },
    read(filename) {
      const localName = Object.keys(files).find(name => filename === name || filename.endsWith('/' + name));
      if (localName) return files[localName];
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
      () => Sk.importMainWithBody(entryFile.replace(/\.py$/, ''), false, data.code, true),
      { 'Sk.debug': suspension => {
        if (!stepping) return;
        let frame = suspension;
        for (let child = suspension.child; child; child = child.child) {
          if (child.$lineno !== undefined) frame = child;
        }
        const line = frame.$lineno;
        const execute = () => {
          currentLine = line; currentFile = resolveFile(frame.$filename);
          Sk.execStart = Date.now(); Sk.lastYield = Date.now();
          self.postMessage({ type: 'executing', line, filename: currentFile });
          return suspension.resume();
        };
        // The first press executes the first statement. Subsequent breakpoints
        // retain the live interpreter, rather than replaying earlier code.
        if (currentLine === null) return Promise.resolve().then(execute);
        self.postMessage({ type: 'paused', line: currentLine, filename: currentFile, nextLine: line, nextFile: resolveFile(frame.$filename),
          variables: variablesFor({ ...frame.$gbl, ...frame.$loc }) });
        return new Promise((resolve, reject) => {
          advanceStep = () => {
            advanceStep = null;
            try { resolve(execute()); } catch (error) { reject(error); }
          };
        });
      } },
    );
    self.postMessage({ type: 'complete', line: currentLine, filename: currentFile, variables: variablesFor(module.$d) });
  } catch (error) {
    self.postMessage({ type: 'error', message: String(error) });
  }
};
