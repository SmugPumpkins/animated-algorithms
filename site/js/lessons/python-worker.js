/* One disposable worker per run isolates the interpreter and allows Stop to
   interrupt loops immediately, including while waiting for terminal input. */
importScripts('../../vendor/skulpt/skulpt.min.js', '../../vendor/skulpt/skulpt-stdlib.js');

let acceptInput = null;
self.onmessage = async ({ data }) => {
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
  let outputLength = 0;
  Sk.configure({
    __future__: Sk.python3,
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
    const module = await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody('<stdin>', false, data.code, true));
    const variables = Object.entries(module.$d)
      .filter(([name, value]) => !name.startsWith('__') && value && ['str', 'int', 'float', 'bool', 'list', 'dict', 'tuple', 'NoneType'].includes(value.tp$name))
      .map(([name, value]) => {
        const representation = Sk.misceval.objectRepr(value);
        return { name: Sk.unfixReserved(name), type: value.tp$name, value: typeof representation === 'string' ? representation : representation.v };
      });
    self.postMessage({ type: 'complete', variables });
  } catch (error) {
    self.postMessage({ type: 'error', message: String(error) });
  }
};
