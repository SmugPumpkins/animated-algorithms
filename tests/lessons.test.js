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

function runPython(code, inputs = [], mode = 'run', advance = 'step') {
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
    context.onmessage({ data: { type: 'run', code, mode } });
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
