import { escapeHtml, highlightPython, highlightLines } from '../site/js/lessons/terminal.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const slides = JSON.parse(readFileSync(path.join(root, 'site/lessons/cse1110/introduction-to-python/slides.json'), 'utf8'));
const source = JSON.parse(readFileSync(path.join(root, 'docs/lessons/introduction-to-python-source.json'), 'utf8'));
const words = text => {
  const result = new Map();
  for (const word of text.match(/[A-Za-z_]+|\d+(?:\.\d+)?/g) || []) result.set(word, (result.get(word) || 0) + 1);
  return [...result].sort(([a], [b]) => a.localeCompare(b));
};

test('all 16 original slides retain every source word, code token and output value', () => {
  assert.equal(slides.length, source.pages.length);
  assert.equal(slides.length, 16);
  slides.forEach((slide, index) => {
    assert.equal(slide.sourcePage, index + 1);
    const text = [slide.title, slide.intro || '', ...(slide.bullets || []), ...(slide.paragraphs || []), slide.code || '', slide.initialOutput !== undefined ? `OUTPUT\n${slide.initialOutput}` : ''].join('\n');
    assert.deepEqual(words(text), words(source.pages[index].text), `Original content differs on slide ${index + 1}`);
  });
});

function runPython(code, inputs = [], mode = 'run', advance = 'step', project = {}) {
  return new Promise((resolve, reject) => {
    let output = '', promptCount = 0;
    const steps = [];
    const context = vm.createContext({ console, setTimeout, clearTimeout, setInterval, clearInterval });
    context.self = context;
    context.importScripts = (...names) => names.forEach(name => {
      const filename = path.resolve(root, 'site/js/lessons', name);
      vm.runInContext(readFileSync(filename, 'utf8'), context, { filename });
    });
    context.postMessage = message => {
      if (message.type === 'output') output += message.text;
      else if (message.type === 'paused') {
        steps.push(JSON.parse(JSON.stringify({ ...message, output })));
        queueMicrotask(() => context.onmessage({ data: { type: advance } }));
      }
      else if (message.type === 'input') {
        const value = inputs[promptCount++];
        if (value === undefined) { reject(new Error('Unexpected input request')); return; }
        output += message.prompt + value + '\n';
        queueMicrotask(() => context.onmessage({ data: { type: 'input', value } }));
      } else if (message.type === 'complete') resolve({ output, variables: JSON.parse(JSON.stringify(message.variables)), promptCount, steps, line: message.line });
      else if (message.type === 'error') reject(new Error(message.message));
    };
    const filename = path.join(root, 'site/js/lessons/python-worker.js');
    vm.runInContext(readFileSync(filename, 'utf8'), context, { filename });
    context.onmessage({ data: { type: 'run', code, mode, ...project } });
  });
}

test('every original Python example runs with the expected real output', async () => {
  for (const slide of slides.filter(slide => slide.code)) {
    const result = await runPython(slide.code);
    assert.equal(result.output, slide.expectedOutput, slide.title);
  }
});

test('Python pauses for multiple real input values, resumes, and preserves types', async () => {
  const result = await runPython('name = input("Name: ")\nage = int(input("Age: "))\nprint("Hello", name)\nprint(age + 1)', ['Alex', '15']);
  assert.equal(result.output, 'Name: Alex\nAge: 15\nHello Alex\n16\n');
  assert.equal(result.promptCount, 2);
  assert.deepEqual(result.variables.find(value => value.name === 'name'), { name: 'name', type: 'str', value: "'Alex'", displayValue: 'Alex' });
  assert.deepEqual(result.variables.find(value => value.name === 'age'), { name: 'age', type: 'int', value: '15', displayValue: '15' });
});

test('Python type conversion errors are reported instead of generating pretend output', async () => {
  await assert.rejects(runPython('number = int(input("Number: "))\nprint(number)', ['not-a-number']), /ValueError/);
});


test('stepping executes one statement per advance and updates values without replay', async () => {
  const result = await runPython('score = 100\nprint(score)\nscore = 120\nprint(score)', [], 'step');
  assert.deepEqual(result.steps.map(step => step.line), [1, 2, 3]);
  assert.deepEqual(result.steps.map(step => step.output), ['', '100\n', '100\n']);
  assert.deepEqual(result.steps.map(step => step.variables.find(item => item.name === 'score').value), ['100', '100', '120']);
  assert.equal(result.line, 4);
  assert.equal(result.output, '100\n120\n');
});

test('stepping follows branches and loops and accepts input just once', async () => {
  const result = await runPython('name = input("Name: ")\nfor i in range(2):\n    if i == 1:\n        print(name)\nprint("Done")', ['Nathan'], 'step');
  assert.equal(result.promptCount, 1);
  assert.equal(result.output, 'Name: Nathan\nNathan\nDone\n');
  assert.ok(result.steps.some(step => step.line === 4));
  assert.ok(result.steps.filter(step => step.line === 3).length === 2);
});


test('Run continues a paused interpreter without restarting or repeating output', async () => {
  const result = await runPython('score = 100\nprint(score)\nscore = 120\nprint(score)', [], 'step', 'continue');
  assert.equal(result.steps.length, 1);
  assert.equal(result.output, '100\n120\n');
});

test('all original examples also finish correctly when stepping', async () => {
  for (const slide of slides.filter(slide => slide.code)) {
    const result = await runPython(slide.code, [], 'step');
    assert.equal(result.output, slide.expectedOutput, slide.title);
  }
});


const externalSlides = JSON.parse(readFileSync(path.join(root, 'site/lessons/cse2110/external-modules/slides.json'), 'utf8'));
test('external modules lesson examples run and step with their real companion files', async () => {
  for (const slide of externalSlides.filter(slide => slide.code || slide.files)) {
    const files = Object.fromEntries((slide.files || []).map(file => [file.name, file.code]));
    const code = slide.code || files[slide.entryFile];
    for (const mode of ['run', 'step']) {
      const result = await runPython(code, [], mode, 'step', { files, ...(slide.entryFile ? { entryFile: slide.entryFile } : {}) });
      assert.equal(result.output, slide.expectedOutput, `${slide.title}: ${mode}`);
    }
  }
});

test('stepping enters imported functions and skips their guarded tests', async () => {
  const slide = externalSlides.find(slide => slide.title === 'Import without running the tests');
  const files = Object.fromEntries(slide.files.map(file => [file.name, file.code]));
  const result = await runPython(files[slide.entryFile], [], 'step', 'step', { files, entryFile: slide.entryFile });
  assert.equal(result.output, '14\n');
  assert.ok(result.steps.some(step => step.filename.endsWith('math_tools.py')), 'Must pause inside the companion file');
});


test('syntax highlighting preserves multiline docstrings and safely escapes code', () => {
  const code = 'def explain():\n    """Line one.\n    Line two <tag> & text.\n    """\n    return 2';
  assert.equal(highlightPython(code).replace(/<[^>]+>/g, ''), escapeHtml(code));
  assert.equal((highlightLines(code).match(/class="code-line/g) || []).length, code.split('\n').length);
  assert.match(highlightLines(code), /python-string[^>]*>.*&lt;tag&gt;/);
});

test('registered lesson links and slide counts match the deployed lesson files', async () => {
  const { modules } = await import('../site/js/catalog.js');
  for (const module of modules) {
    assert.equal(new Set(module.lessons.map(lesson => lesson.id)).size, module.lessons.length);
    for (const lesson of module.lessons) {
      const folder = path.resolve(root, 'site', lesson.href);
      assert.ok(readFileSync(path.join(folder, 'index.html'), 'utf8').includes(module.code));
      assert.equal(JSON.parse(readFileSync(path.join(folder, 'slides.json'), 'utf8')).length, lesson.slideCount);
    }
  }
});


const functionSlides = JSON.parse(readFileSync(path.join(root, 'site/lessons/cse2110/focus-on-functions/slides.json'), 'utf8'));
const functionSource = JSON.parse(readFileSync(path.join(root, 'docs/lessons/focus-on-functions-source.json'), 'utf8'));
test('Focus on Functions preserves slide order and extractable source wording', () => {
  assert.equal(functionSlides.length, 15);
  functionSlides.forEach((slide, index) => assert.equal(slide.sourcePage, index + 1));
  for (const page of [1, 2, 3, 4, 5, 6, 7, 8, 11]) {
    const slide = functionSlides[page - 1];
    const text = [slide.title, slide.intro || '', ...(slide.bullets || []), ...(slide.paragraphs || []), slide.caption || '', slide.code || '', ...(slide.examples || []).map(example => example.code), slide.initialOutput ? `OUTPUT\n${slide.initialOutput}` : ''].join('\n');
    assert.deepEqual(words(text), words(functionSource[page - 1].text), `Original content differs on page ${page}`);
  }
});

test('function examples run and step, including real input and intentional type errors', async () => {
  for (const slide of functionSlides) {
    for (const example of slide.examples || (slide.code ? [slide] : [])) {
      if (example.randomExample) continue;
      for (const mode of ['run', 'step']) {
        const execution = runPython(example.code, example.testInputs || [], mode);
        if (example.expectedError) await assert.rejects(execution, new RegExp(example.expectedError));
        else {
          const result = await execution;
          assert.equal(result.output, example.expectedOutput, `${slide.title} / ${example.label || ''}: ${mode}`);
        }
      }
    }
  }
});

test('both full battle-game versions accept real choices and finish in run and step modes', async () => {
  for (const mode of ['run', 'step']) {
    const results = [];
    for (const slide of functionSlides.filter(slide => slide.randomExample)) {
      const result = await runPython('import random\nrandom.seed(42)\n' + slide.code, Array(30).fill('1'), mode);
      assert.match(result.output, /A monster appears!/);
      assert.match(result.output, /Final Score: \d+/);
      assert.ok(result.promptCount > 0);
      results.push(result.output);
    }
    assert.equal(results[0], results[1], 'Refactoring must retain the game behaviour');
  }
});


const stringSlides = JSON.parse(readFileSync(path.join(root, 'site/lessons/cse2120/manipulating-strings/slides.json'), 'utf8'));
const stringSource = JSON.parse(readFileSync(path.join(root, 'docs/lessons/manipulating-strings-source.json'), 'utf8'));
test('string lesson preserves method explanations and removes the file-handling framing', () => {
  assert.equal(stringSlides.length, 9);
  stringSlides.forEach((slide, index) => {
    assert.equal(slide.sourcePage, index + 1);
    assert.doesNotMatch([slide.title, slide.intro || '', ...(slide.bullets || []), ...(slide.paragraphs || [])].join(' '), /\bfiles?\b/i);
  });
  for (const page of [3, 5, 6, 7, 8]) {
    const slide = stringSlides[page - 1];
    const text = [slide.title, ...slide.paragraphs, slide.code, `OUTPUT\n${slide.initialOutput}`].join('\n');
    assert.deepEqual(words(text), words(stringSource[page - 1].text), `Source method wording differs on slide ${page}`);
  }
});

test('every string manipulation example produces real expected output in run and step modes', async () => {
  for (const slide of stringSlides.filter(slide => slide.code)) {
    for (const mode of ['run', 'step']) {
      const result = await runPython(slide.code, [], mode);
      assert.equal(result.output, slide.expectedOutput, `${slide.title}: ${mode}`);
      if (slide.highlightWhitespace) assert.equal(result.output, 'hello\nhello   \n   hello\n');
      if (slide.sourcePage === 9) {
        assert.equal(result.variables.find(item => item.name === 'age').type, 'int');
        assert.equal(result.variables.find(item => item.name === 'price').type, 'float');
      }
    }
  }
});


const listSlides = JSON.parse(readFileSync(path.join(root, 'site/lessons/cse2120/lists/slides.json'), 'utf8'));
const listSource = JSON.parse(readFileSync(path.join(root, 'docs/lessons/lists-source.json'), 'utf8'));
test('Lists retains all 21 original slides, explanations, code and output values', () => {
  assert.equal(listSlides.length, 21);
  listSlides.forEach((slide, index) => {
    assert.equal(slide.sourcePage, index + 1);
    const text = [slide.title, slide.intro || '', ...(slide.bullets || []), ...(slide.paragraphs || []), slide.code || '', slide.initialOutput !== undefined ? `OUTPUT\n${slide.initialOutput}` : ''].join('\n');
    assert.deepEqual(words(text), words(listSource[index].text), `Source content differs on page ${index + 1}`);
  });
});

test('all Lists examples run and step with genuine list results and IndexError', async () => {
  for (const slide of listSlides.filter(slide => slide.code)) {
    for (const mode of ['run', 'step']) {
      const execution = runPython(slide.code, [], mode);
      if (slide.expectedError) await assert.rejects(execution, new RegExp(slide.expectedError));
      else assert.equal((await execution).output, slide.expectedOutput, `${slide.title} (${slide.sourcePage}): ${mode}`);
    }
  }
});

test('stepping shows alias mutations together while the copied list stays independent', async () => {
  const result = await runPython(listSlides[20].code, [], 'step');
  const mutation = result.steps.find(step => step.line === 4);
  const value = name => mutation.variables.find(item => item.name === name).value;
  assert.equal(value('original'), "['red', 'green', 'blue', 'yellow']");
  assert.equal(value('reference'), value('original'));
  assert.equal(value('copied'), "['red', 'green', 'blue']");
});
