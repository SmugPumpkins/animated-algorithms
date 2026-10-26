/* One disposable worker per run isolates the interpreter and allows Stop to
   interrupt loops immediately, including while waiting for terminal input. */
importScripts('../../vendor/skulpt/skulpt.min.js', '../../vendor/skulpt/skulpt-stdlib.js');
importScripts('./dataclasses-compat.js');

let acceptInput = null, advanceStep = null, stepping = false, currentLine = null, currentFile = null;
function variablesFor(scope) {
  return Object.entries(scope || {})
    .filter(([name, value]) => {
      if (name.startsWith('__') || !value) return false;
      if (['str', 'int', 'float', 'bool', 'list', 'dict', 'tuple', 'NoneType'].includes(value.tp$name)) return true;
      if (Sk.builtin.checkClass(value)) return false;
      try { return !!Sk.abstr.gattr(value, new Sk.builtin.str('__dataclass_fields__'), false); }
      catch { return false; }
    })
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
  const dataFiles = { ...(data.dataFiles || {}) };
  const fileAccess = data.dataFiles !== undefined;
  const publishFile = file => self.postMessage({ type: 'file', name: file.name, content: dataFiles[file.name] });
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
    nonreadopen: fileAccess,
    fileopen: fileAccess ? file => {
      const mode = file.mode.v;
      if (!['r', 'w', 'a'].includes(mode)) throw new Sk.builtin.ValueError('Supported text file modes: r, w, a');
      if (mode === 'r' && !Object.hasOwn(dataFiles, file.name)) throw new Sk.builtin.IOError(`No such file: '${file.name}'`);
      if (mode === 'w' || !Object.hasOwn(dataFiles, file.name)) {
        dataFiles[file.name] = ''; publishFile(file);
      }
      file.data$ = dataFiles[file.name];
      file.lineList = file.data$.match(/[^\n]*\n|[^\n]+$/g) || [];
      file.currentLine = 0;
      file.pos$ = mode === 'a' ? file.data$.length : 0;
    } : undefined,
    filewrite: fileAccess ? (file, text) => {
      const value = Sk.ffi.remapToJs(text);
      const old = dataFiles[file.name];
      const position = file.mode.v === 'a' ? old.length : file.pos$;
      const content = old.slice(0, position) + value + old.slice(position + value.length);
      if (content.length > 100000) throw new Sk.builtin.ValueError('File size limit reached');
      dataFiles[file.name] = file.data$ = content;
      file.pos$ = position + value.length;
      publishFile(file);
    } : undefined,
    output(text) {
      outputLength += text.length;
      if (outputLength > 100000) throw new Error('Output limit reached.');
      self.postMessage({ type: 'output', text });
    },
    read(filename) {
      if (fileAccess && Object.hasOwn(dataFiles, filename)) return dataFiles[filename];
      // The file constructor reads before invoking fileopen; that callback checks
      // existence/mode and initializes a missing write/append target safely.
      if (fileAccess && !filename.startsWith('src/') && !filename.endsWith('.py')) return '';
      const localName = Object.keys(files).find(name => filename === name || filename.endsWith('/' + name));
      if (localName) return prepareClassAnnotations(files[localName]);
      const contents = Sk.builtinFiles?.files?.[filename];
      if (filename === 'src/lib/dataclasses.py') return dataclassesModule;
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
      () => Sk.importMainWithBody(entryFile.replace(/\.py$/, ''), false, prepareClassAnnotations(data.code), true),
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
