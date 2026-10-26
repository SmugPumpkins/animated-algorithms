import { escapeHtml, highlightPython, highlightLines } from '../site/js/lessons/terminal.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const slides = JSON.parse(readFileSync(path.join(root, 'site/lessons/cse1110/introduction-to-python/slides.json'), 'utf8')).filter(slide => slide.sourcePage !== null);
const source = JSON.parse(readFileSync(path.join(root, 'docs/lessons/introduction-to-python-source.json'), 'utf8'));
const words = text => {
  const result = new Map();
  for (const word of text.match(/[A-Za-z_]+|\d+(?:\.\d+)?/g) || []) result.set(word, (result.get(word) || 0) + 1);
  return [...result].sort(([a], [b]) => a.localeCompare(b));
};

test('Introduction instructional slides retain source wording before the replacement wrap-up', () => {
  assert.equal(slides.length, source.pages.length);
  assert.equal(slides.length, 16);
  slides.forEach((slide, index) => {
    if (slide.kind === 'wrapup') return;
    assert.equal(slide.sourcePage, index + 1);
    const text = [slide.title, slide.intro || '', ...(slide.bullets || []), ...(slide.paragraphs || []), slide.code || '', slide.initialOutput !== undefined ? `OUTPUT\n${slide.initialOutput}` : ''].join('\n');
    assert.deepEqual(words(text), words(source.pages[index].text), `Original content differs on slide ${index + 1}`);
  });
});

function runPython(code, inputs = [], mode = 'run', advance = 'step', project = {}) {
  return new Promise((resolve, reject) => {
    let output = '', promptCount = 0;
    const steps = [];
    const dataFiles = { ...(project.dataFiles || {}) };
    const context = vm.createContext({ console, setTimeout, clearTimeout, setInterval, clearInterval });
    context.self = context;
    context.importScripts = (...names) => names.forEach(name => {
      const filename = path.resolve(root, 'site/js/lessons', name);
      vm.runInContext(readFileSync(filename, 'utf8'), context, { filename });
    });
    context.postMessage = message => {
      if (message.type === 'output') output += message.text;
      else if (message.type === 'file') dataFiles[message.name] = message.content;
      else if (message.type === 'paused') {
        steps.push(JSON.parse(JSON.stringify({ ...message, output })));
        queueMicrotask(() => context.onmessage({ data: { type: advance } }));
      }
      else if (message.type === 'input') {
        const value = inputs[promptCount++];
        if (value === undefined) { reject(new Error('Unexpected input request')); return; }
        output += message.prompt + value + '\n';
        queueMicrotask(() => context.onmessage({ data: { type: 'input', value } }));
      } else if (message.type === 'complete') resolve({ output, variables: JSON.parse(JSON.stringify(message.variables)), promptCount, steps, line: message.line, dataFiles });
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


const externalSlides = JSON.parse(readFileSync(path.join(root, 'site/lessons/cse2110/external-modules/slides.json'), 'utf8')).filter(slide => slide.sourcePage !== null);
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


const functionSlides = JSON.parse(readFileSync(path.join(root, 'site/lessons/cse2110/focus-on-functions/slides.json'), 'utf8')).filter(slide => slide.sourcePage !== null);
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


const stringSlides = JSON.parse(readFileSync(path.join(root, 'site/lessons/cse2120/manipulating-strings/slides.json'), 'utf8')).filter(slide => slide.sourcePage !== null);
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


const listSlides = JSON.parse(readFileSync(path.join(root, 'site/lessons/cse2120/lists/slides.json'), 'utf8')).filter(slide => slide.sourcePage !== null);
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

const tupleSlides = JSON.parse(readFileSync(path.join(root, 'site/lessons/cse2120/tuples/slides.json'), 'utf8')).filter(slide => slide.sourcePage !== null);
const tupleSource = JSON.parse(readFileSync(path.join(root, 'docs/lessons/tuples-source.json'), 'utf8'));
test('Tuples preserves all five source slides, explanations, code and output', () => {
  assert.equal(tupleSlides.length, 5);
  tupleSlides.forEach((slide, index) => {
    assert.equal(slide.sourcePage, index + 1);
    const text = [slide.title, slide.intro || '', ...(slide.bullets || []), ...(slide.paragraphs || []), slide.code || '', slide.initialOutput !== undefined ? `OUTPUT\n${slide.initialOutput}` : ''].join('\n');
    assert.deepEqual(words(text), words(tupleSource[index].text), `Source content differs on page ${index + 1}`);
  });
});

test('all Tuples examples run and step with real output and AttributeError', async () => {
  for (const slide of tupleSlides.filter(slide => slide.code)) {
    for (const mode of ['run', 'step']) {
      const execution = runPython(slide.code, [], mode);
      if (slide.expectedError) await assert.rejects(execution, new RegExp(slide.expectedError));
      else assert.equal((await execution).output, slide.expectedOutput, `${slide.title}: ${mode}`);
    }
  }
});

test('stepping retains tuple type while its nested list changes', async () => {
  const result = await runPython(tupleSlides[3].code, [], 'step');
  const mutation = result.steps.find(step => step.line === 4);
  const data = mutation.variables.find(item => item.name === 'data');
  assert.equal(data.type, 'tuple');
  assert.equal(data.value, "('Alice', [0, 1, 2, 3])");
});

const dictionarySlides = JSON.parse(readFileSync(path.join(root, 'site/lessons/cse2120/dictionaries/slides.json'), 'utf8')).filter(slide => slide.sourcePage !== null);
const dictionarySource = JSON.parse(readFileSync(path.join(root, 'docs/lessons/dictionaries-source.json'), 'utf8'));
test('Dictionaries retains all 16 source slides, explanations, code and output', () => {
  assert.equal(dictionarySlides.length, 16);
  dictionarySlides.forEach((slide, index) => {
    assert.equal(slide.sourcePage, index + 1);
    const text = [slide.title, slide.intro || '', ...(slide.bullets || []), ...(slide.paragraphs || []), slide.code || '', slide.initialOutput !== undefined ? `OUTPUT\n${slide.initialOutput}` : ''].join('\n');
    assert.deepEqual(words(text), words(dictionarySource[index].text), `Source content differs on page ${index + 1}`);
  });
});

test('all dictionary methods and traversal examples run and step with real expected output', async () => {
  for (const slide of dictionarySlides.filter(slide => slide.code)) {
    for (const mode of ['run', 'step']) {
      const result = await runPython(slide.code, [], mode);
      assert.equal(result.output, slide.expectedOutput, `${slide.title}: ${mode}`);
    }
  }
});

test('dictionary references share mutations while copied values remain independent', async () => {
  const result = await runPython(dictionarySlides[15].code, [], 'step');
  const mutation = result.steps.find(step => step.line === 5);
  const value = name => mutation.variables.find(item => item.name === name).value;
  assert.equal(value('original'), "{'name': 'Alice', 'grade': 12}");
  assert.equal(value('reference'), value('original'));
  assert.equal(value('copied'), "{'name': 'Bob', 'grade': 11}");
});

const dataClassSlides = JSON.parse(readFileSync(path.join(root, 'site/lessons/cse2120/data-classes/slides.json'), 'utf8')).filter(slide => slide.sourcePage !== null);
const dataClassSource = JSON.parse(readFileSync(path.join(root, 'docs/lessons/data-classes-source.json'), 'utf8'));
test('Data Classes retains all nine original slides, explanations, code and output', () => {
  assert.equal(dataClassSlides.length, 9);
  dataClassSlides.forEach((slide, index) => {
    assert.equal(slide.sourcePage, index + 1);
    const text = [slide.title, slide.intro || '', ...(slide.bullets || []), ...(slide.paragraphs || []), slide.code || '', slide.initialOutput !== undefined ? `OUTPUT\n${slide.initialOutput}` : ''].join('\n');
    assert.deepEqual(words(text), words(dataClassSource[index].text), `Source differs on page ${index + 1}`);
  });
});

test('all data class examples run and step, including constructors and field updates', async () => {
  for (const slide of dataClassSlides.filter(slide => slide.code)) {
    for (const mode of ['run', 'step']) {
      const result = await runPython(slide.code, [], mode);
      assert.equal(result.output, slide.expectedOutput, `${slide.title}: ${mode}`);
    }
  }
});

test('data class instances appear as typed variables and remain independent', async () => {
  const code = dataClassSlides[5].code + '\nstudent1.grade = 10\nprint(student1)\nprint(student2)';
  for (const mode of ['run', 'step']) {
    const result = await runPython(code, [], mode);
    assert.equal(result.output, "Student(name='Alice', grade=10)\nStudent(name='Bob', grade=12)\n");
    assert.equal(result.variables.find(item => item.name === 'student1').type, 'Student');
    assert.equal(result.variables.find(item => item.name === 'student2').value, "Student(name='Bob', grade=12)");
  }
});

test('editable data classes support defaults, keywords, equality and constructor errors', async () => {
  const base = 'from dataclasses import dataclass\n@dataclass\nclass Record:\n    name: str\n    score: int = 0\n';
  const result = await runPython(base + 'a = Record(name="A")\nb = Record("A", score=0)\nprint(a == b)\na.score = "not enforced"\nprint(a)');
  assert.equal(result.output, "True\nRecord(name='A', score='not enforced')\n");
  for (const call of ['Record()', 'Record("A", name="B")', 'Record("A", extra=2)', 'Record("A", 1, 2)']) {
    await assert.rejects(runPython(base + call), /TypeError/);
  }
});

test('annotation lowering preserves strings and source lines during stepping', async () => {
  const text = '"""\nclass Example:\n    name: str\n"""';
  const code = 'from dataclasses import dataclass\nsample = ' + text + '\n@dataclass\nclass Example:\n    name: str\nitem = Example("A")\nprint(sample)\nprint(item)';
  const result = await runPython(code, [], 'step');
  assert.equal(result.output, "\nclass Example:\n    name: str\n\nExample(name='A')\n");
  const assignment = result.steps.find(step => step.line === 10);
  assert.equal(assignment.variables.find(item => item.name === 'item').value, "Example(name='A')");
});

const multidimensionalSlides = JSON.parse(readFileSync(path.join(root, 'site/lessons/cse2120/multidimensional-lists/slides.json'), 'utf8')).filter(slide => slide.sourcePage !== null);
const multidimensionalSource = JSON.parse(readFileSync(path.join(root, 'docs/lessons/multidimensional-lists-source.json'), 'utf8'));
test('Multidimensional Lists retains all 13 source slides and coordinate labels', () => {
  assert.equal(multidimensionalSlides.length, 13);
  multidimensionalSlides.forEach((slide, index) => {
    assert.equal(slide.sourcePage, index + 1);
    const text = [slide.title, slide.intro || '', ...(slide.bullets || []), ...(slide.paragraphs || []), slide.code || '', ...(slide.indexGrid || []).flat(), slide.initialOutput !== undefined ? `OUTPUT\n${slide.initialOutput}` : ''].join('\n');
    assert.deepEqual(words(text), words(multidimensionalSource[index].text), `Source differs on page ${index + 1}`);
  });
});

test('every multidimensional example runs and steps with actual nested-list output', async () => {
  for (const slide of multidimensionalSlides.filter(slide => slide.code)) {
    for (const mode of ['run', 'step']) {
      const result = await runPython(slide.code, [], mode);
      assert.equal(result.output, slide.expectedOutput, `${slide.title}: ${mode}`);
    }
  }
});

test('stepping follows distinct row-major and column-major traversal positions', async () => {
  const row = await runPython(multidimensionalSlides[8].code.replace('print(grid[i][j])', 'print(i, j)'), [], 'step');
  const column = await runPython(multidimensionalSlides[9].code.replace('print(grid[i][j])', 'print(i, j)'), [], 'step');
  assert.equal(row.output, '0 0\n0 1\n0 2\n1 0\n1 1\n1 2\n');
  assert.equal(column.output, '0 0\n1 0\n0 1\n1 1\n0 2\n1 2\n');
});

test('syntax highlighting distinguishes decorators, escapes and f-string expressions safely', () => {
  const code = '@dataclass\nclass Student:\n    name: str\nprint(f"Hello {student.name}: {score + 1}\\n{{literal}} <tag>")\nraw = r"\\n"\n# @dataclass is a comment\nlabel = "@dataclass"\nresult = left @ right';
  const html = highlightPython(code);
  assert.match(html, /python-decorator[^>]*>@dataclass/);
  assert.equal((html.match(/python-decorator/g) || []).length, 1);
  assert.match(html, /python-escape[^>]*>\\n/);
  assert.match(html, /python-format-brace[^>]*>\{/);
  assert.match(html, /python-interpolation[^>]*>student\.name/);
  assert.match(html, /python-interpolation[^>]*>score \+ /);
  assert.match(html, /python-escape[^>]*>[^<]*\{\{/);
  assert.match(html, /python-string[^>]*>r&quot;\\n&quot;/);
  assert.equal(html.replace(/<[^>]+>/g, ''), escapeHtml(code));
  assert.equal(highlightLines(code, 4).replace(/<\/span><span class="code-line/g, '</span>\n<span class="code-line').replace(/<[^>]+>/g, ''), escapeHtml(code));
  assert.equal((highlightLines(code, 4).match(/executing-line/g) || []).length, 1);
});

test('f-string highlighting retains nested expressions, multiline strings and incomplete edits', () => {
  for (const code of [
    'print(f"{student[\'name\']} { {\'x\': 1} } {score:{width}.{precision}f}")',
    'message = f"""Hi {name}\\n\nScore: {score!r}"""',
    'print(f"unfinished {name',
    'text = """@decorator\n{not_formatted}\\t"""',
  ]) {
    assert.equal(highlightPython(code).replace(/<[^>]+>/g, ''), escapeHtml(code));
    assert.equal(highlightLines(code).replace(/<\/span><span class="code-line/g, '</span>\n<span class="code-line').replace(/<[^>]+>/g, ''), escapeHtml(code));
  }
});

const parallelSlides = JSON.parse(readFileSync(path.join(root, 'site/lessons/cse2120/parallel-lists/slides.json'), 'utf8')).filter(slide => slide.sourcePage !== null);
const parallelSource = JSON.parse(readFileSync(path.join(root, 'docs/lessons/parallel-lists-source.json'), 'utf8'));
test('Parallel Lists retains all six source slides, explanations, code and output', () => {
  assert.equal(parallelSlides.length, 6);
  parallelSlides.forEach((slide, index) => {
    assert.equal(slide.sourcePage, index + 1);
    const text = [slide.title, slide.intro || '', ...(slide.bullets || []), ...(slide.paragraphs || []), slide.code || '', slide.initialOutput !== undefined ? `OUTPUT\n${slide.initialOutput}` : ''].join('\n');
    assert.deepEqual(words(text), words(parallelSource[index].text), `Source differs on page ${index + 1}`);
  });
});

test('all parallel-list examples run and step with actual matching values', async () => {
  for (const slide of parallelSlides.filter(slide => slide.code)) {
    for (const mode of ['run', 'step']) {
      const result = await runPython(slide.code, [], mode);
      assert.equal(result.output, slide.expectedOutput, `${slide.title}: ${mode}`);
    }
  }
});

test('edited parallel lists retain matching pairs across indices, enumerate and zip', async () => {
  for (const slide of parallelSlides.slice(3)) {
    const code = slide.code.replace('["Alex", "Sam", "Jordan"]', '["Ada", "Grace"]').replace('[82, 91, 76]', '[95, 99]');
    const result = await runPython(code, [], 'step');
    assert.equal(result.output, 'Ada: 95\nGrace: 99\n');
  }
});

const fileSlides = JSON.parse(readFileSync(path.join(root, 'site/lessons/cse2130/reading-writing-appending/slides.json'), 'utf8')).filter(slide => slide.sourcePage !== null);
const fileSource = JSON.parse(readFileSync(path.join(root, 'docs/lessons/reading-writing-appending-source.json'), 'utf8'));
test('file lesson preserves all 15 slides with the requested Part 1 renumbering', () => {
  assert.equal(fileSlides.length, 15);
  fileSlides.forEach((slide, index) => {
    assert.equal(slide.sourcePage, index + 1);
    const text = [slide.title, slide.intro || '', ...(slide.bullets || []), ...(slide.paragraphs || []), slide.code || '', ...(slide.cycle || []).map(node => node.label), slide.initialOutput !== undefined ? `OUTPUT\n${slide.initialOutput}` : ''].join('\n');
    const original = index === 0 ? fileSource[index].text.replace('Part 2:', 'Part 1:') : fileSource[index].text;
    assert.deepEqual(words(text), words(original), `Source differs on page ${index + 1}`);
  });
});

test('file examples read, create, overwrite, append and process real virtual contents in run and step', async () => {
  for (const slide of fileSlides.filter(slide => slide.code)) {
    const dataFiles = Object.fromEntries(slide.dataFiles.filter(file => file.exists !== false).map(file => [file.name, file.content]));
    for (const mode of ['run', 'step']) {
      const result = await runPython(slide.code, [], mode, 'step', {dataFiles});
      assert.equal(result.output, slide.expectedOutput, `${slide.title}: ${mode}`);
      assert.deepEqual(result.dataFiles, slide.expectedFiles, `${slide.title} contents: ${mode}`);
    }
  }
});

test('virtual files retain unterminated last lines, reject missing reads and isolate executions', async () => {
  const read = 'with open("students.txt", "r") as file:\n    print(file.readlines())';
  assert.equal((await runPython(read, [], 'run', 'step', {dataFiles:{'students.txt':'Ada\nGrace'}})).output, "['Ada\\n', 'Grace']\n");
  await assert.rejects(runPython(read, [], 'run', 'step', {dataFiles:{}}), /No such file/);
  const append = 'with open("students.txt", "a") as file:\n    file.write("Ada\\n")';
  for (const mode of ['run','step']) {
    assert.deepEqual((await runPython(append, [], mode, 'step', {dataFiles:{}})).dataFiles, {'students.txt':'Ada\n'});
  }
  assert.equal((await runPython(read, [], 'run', 'step', {dataFiles:{'students.txt':'Original\n'}})).output, "['Original\\n']\n");
});

const ipoSlides = JSON.parse(readFileSync(path.join(root, 'site/lessons/cse1110/input-process-output/slides.json'), 'utf8')).filter(slide => slide.sourcePage !== null);
const ipoSource = JSON.parse(readFileSync(path.join(root, 'docs/lessons/input-process-output-source.json'), 'utf8'));
test('IPO lesson retains 17 source slides and the approved slide 8 code correction', () => {
  assert.equal(ipoSlides.length, 17);
  ipoSlides.forEach((slide, index) => {
    if (slide.kind === 'wrapup') return;
    assert.equal(slide.sourcePage, index + 1);
    const text = [slide.title, slide.intro || '', ...(slide.bullets || []), ...(slide.paragraphs || []), slide.code || '', ...(slide.stageLabels || []), ...(slide.ipoChart?.headers || []), ...(slide.ipoChart?.cells || []), slide.initialOutput !== undefined ? `OUTPUT\n${slide.initialOutput}` : '', slide.terminalNote || ''].join('\n');
    const original = index === 7 ? ipoSource[index].text.replace('name = input("What is your name? ")', 'number = input("Enter a number: ")').replace('print(name)', 'print(number + 1)') : ipoSource[index].text;
    assert.deepEqual(words(text), words(original), `Source differs on slide ${index + 1}`);
  });
});

test('IPO examples run and step with genuine input, formatting, escapes and TypeError', async () => {
  for (const slide of ipoSlides.filter(slide => slide.code)) {
    for (const mode of ['run', 'step']) {
      const execution = runPython(slide.code, slide.testInputs, mode);
      if (slide.expectedError) await assert.rejects(execution, new RegExp(slide.expectedError));
      else assert.equal((await execution).output, slide.expectedOutput, `${slide.title}: ${mode}`);
    }
  }
});

test('IPO casting and newline prompts accept new responses and retain correct types', async () => {
  const cast = await runPython(ipoSlides[8].code, ['12', '3.25'], 'step');
  assert.equal(cast.output, 'Enter a whole number: 12\n12\nEnter a decimal number: 3.25\n6.5\n');
  assert.equal(cast.variables.find(item => item.name === 'whole_number').type, 'int');
  assert.equal(cast.variables.find(item => item.name === 'decimal_number').type, 'float');
  const greeting = await runPython(ipoSlides[15].code, ['Ada'], 'step');
  assert.equal(greeting.output, 'Enter your name:\nAda\nHello, Ada!\n');
  assert.equal(greeting.promptCount, 1);
});

const algorithmSlides = JSON.parse(readFileSync(path.join(root, 'site/lessons/cse1110/algorithms/slides.json'), 'utf8'));
const algorithmSource = JSON.parse(readFileSync(path.join(root, 'docs/lessons/algorithms-source.json'), 'utf8'));
test('Algorithms retains all seven source pages before its added wrap-up', () => {
  assert.equal(algorithmSlides.length, 8);
  algorithmSlides.slice(0,7).forEach((slide,index) => {
    assert.equal(slide.sourcePage, index + 1);
    const text = [slide.title, slide.intro || '', slide.objectiveLead || '', ...(slide.bullets || []), ...(slide.paragraphs || []), ...(slide.bodyBullets || []), ...(slide.afterBullets || []), slide.code || ''].join('\n');
    assert.deepEqual(words(text), words(algorithmSource[index].text), `Source differs on page ${index + 1}`);
  });
});

test('sequence, selection and iteration examples execute in run and step modes', async () => {
  for (const slide of algorithmSlides.filter(slide => slide.code)) {
    for (const mode of ['run','step']) {
      assert.equal((await runPython(slide.code, slide.testInputs || [], mode)).output, slide.expectedOutput, `${slide.title}: ${mode}`);
    }
  }
});

test('edited control structures respond to actual input, branch conditions and repeat counts', async () => {
  for (const mode of ['run','step']) {
    assert.equal((await runPython(algorithmSlides[4].code, ['Ada'], mode)).output, 'What is your name? Ada\nHello Ada\n');
    assert.equal((await runPython(algorithmSlides[5].code.replace('age = 16','age = 15'), [], mode)).output, 'You cannot drive yet.\n');
    assert.equal((await runPython(algorithmSlides[6].code.replace('range(5)','range(2)'), [], mode)).output, 'Hello!\nHello!\n');
  }
});

const flowSlides = JSON.parse(readFileSync(path.join(root, 'site/lessons/cse1110/flowcharts/slides.json'), 'utf8'));
const flowSource = JSON.parse(readFileSync(path.join(root, 'docs/lessons/flowcharts-source.json'), 'utf8'));
test('Flowcharts preserves all 13 visible source slides before the wrap-up', () => {
  assert.equal(flowSlides.length, 14);
  flowSlides.slice(0,13).forEach((slide,index) => {
    assert.equal(slide.sourcePage, index + 1);
    const text = [slide.title, slide.intro || '', slide.objectiveLead || '', ...(slide.bullets || []), ...(slide.paragraphs || [])].join('\n');
    const original = index === 2 ? flowSource[index].text.replace('diagrams.net - Wikipedia','') : flowSource[index].text;
    assert.deepEqual(words(text), words(original), `Source differs on page ${index + 1}`);
  });
});

test('flowchart diagrams use valid separate geometry and semantic roles', async () => {
  const {FLOW_ROLES} = await import('../site/js/flowchart-theme.js');
  const {flowchartMarkup,flowchartSteps} = await import('../site/js/lessons/flowchart.js');
  for (const [index,slide] of flowSlides.entries()) {
    if (!slide.diagram) continue;
    const ids = slide.diagram.nodes.map(node => node.id);
    assert.equal(new Set(ids).size,ids.length);
    for (const node of slide.diagram.nodes) {
      assert.ok(Object.hasOwn(FLOW_ROLES,node.role));
      assert.ok(['terminator','io','process','decision','predefined'].includes(node.type));
    }
    const markup = flowchartMarkup(slide,index);
    assert.ok(markup.includes('class="flowchart lesson-flowchart"'));
    if (slide.flowExample) for (const step of flowchartSteps(slide.flowExample)) assert.ok(ids.includes(step.node));
  }
  assert.equal(flowSlides[6].diagram.nodes.find(node => node.id==='input').role,'parameter');
  assert.equal(flowSlides[6].diagram.nodes.find(node => node.id==='output').role,'output');
  assert.equal(flowSlides[8].diagram.nodes[0].type,'predefined');
});

test('flowchart playback computes selection and iteration paths and values', async () => {
  const {flowchartSteps} = await import('../site/js/lessons/flowchart.js');
  assert.deepEqual(flowchartSteps('sequence').map(step => step.node),['start','input','message','output','end']);
  const selection = flowchartSteps('selection');
  assert.ok(selection.some(step => step.node==='hot'));
  assert.ok(!selection.some(step => step.node==='sweater'));
  assert.match(selection.find(step=>step.node==='check').text,/25 > 21 is True/);
  const iteration = flowchartSteps('iteration');
  assert.equal(iteration.filter(step=>step.node==='total').length,3);
  assert.equal(iteration.filter(step=>step.node==='check').length,4);
  assert.match(iteration.findLast(step=>step.node==='check').text,/3 < 3 is False/);
  assert.match(iteration.find(step=>step.node==='output').text,/total: 3/);
  assert.equal(iteration.at(-1).node,'end');
});

test('flowchart playback pauses, resets and cleans up timers and listeners', async t => {
  const {mountFlowchart} = await import('../site/js/lessons/flowchart.js');
  t.mock.timers.enable({apis:['setInterval']});
  const buttons = ['run','step','stop','reset'].map(name => Object.assign(new EventTarget(), {dataset:{flow:name},disabled:false}));
  const actionClasses = new Set();
  const action = {textContent:'',classList:{add(name){actionClasses.add(name);},remove(name){actionClasses.delete(name);}}};
  const count = {textContent:''};
  const nodes = ['start','input','message','output','end'].map(id => {
    const classes = new Set();
    return {dataset:{node:id},classes,classList:{toggle(name,on){if(on)classes.add(name);else classes.delete(name);},remove(name){classes.delete(name);}}};
  });
  const root = {querySelector(selector){return selector === '.flow-step-action' ? action : count;},querySelectorAll(selector){return selector==='[data-flow]' ? buttons : selector==='[data-node]' ? nodes : nodes.filter(node=>node.classes.has('active'));}};
  const player = mountFlowchart(root,'sequence');
  const click = name => buttons.find(button=>button.dataset.flow===name).dispatchEvent(new Event('click'));
  const active = () => nodes.filter(node=>node.classes.has('active')).map(node=>node.dataset.node);
  click('run');assert.deepEqual(active(),['start']);
  assert.equal(count.textContent,'1 / 5');assert.equal(action.textContent,'Start the algorithm.');assert.ok(actionClasses.has('inline-code'));
  t.mock.timers.tick(1000);assert.deepEqual(active(),['input']);
  click('stop');t.mock.timers.tick(5000);assert.deepEqual(active(),['input']);
  click('step');assert.deepEqual(active(),['message']);
  click('reset');assert.deepEqual(active(),[]);assert.equal(count.textContent,'0 / 5');assert.ok(!actionClasses.has('inline-code'));
  click('run');player.stop();t.mock.timers.tick(5000);assert.deepEqual(active(),['start']);
  player.destroy();click('step');t.mock.timers.tick(5000);assert.deepEqual(active(),['start']);
});

const pseudocodeSlides = JSON.parse(readFileSync(path.join(root, 'site/lessons/cse1110/pseudocode/slides.json'), 'utf8'));
const pseudocodeSource = JSON.parse(readFileSync(path.join(root, 'docs/lessons/pseudocode-source.json'), 'utf8'));
test('Pseudocode preserves explanations and sample with approved new cover objectives', () => {
  assert.equal(pseudocodeSlides.length,11);
  assert.deepEqual(pseudocodeSlides.map(slide=>slide.sourcePage),[1,2,3,3,3,3,4,null,null,null,null]);
  assert.ok(pseudocodeSlides[0].bullets.every(text=>!/flowchart/i.test(text)));
  for (const page of [2,4]) {
    const slide = pseudocodeSlides.find(slide=>slide.sourcePage===page);
    const text = [slide.title,...slide.paragraphs,...(slide.bodyBullets||[]),slide.pseudocode||''].join('\n');
    assert.deepEqual(words(text),words(pseudocodeSource[page-1].text));
  }
  const tables = pseudocodeSlides.filter(slide=>slide.kind==='keyword-table');
  const text = [tables[0].title,...tables.flatMap(slide=>slide.keywords.flatMap(row=>[row.keyword,...row.explanations]))].join('\n');
  const original = pseudocodeSource[2].text.replace('SELECTIONcontrol','SELECTION control').replace('customfunctions','custom functions').replace('isTrue','is True');
  assert.deepEqual(words(text),words(original));
});

test('pseudocode reference contains all 15 keywords and does not run as Python', () => {
  const keywords = pseudocodeSlides.flatMap(slide=>(slide.keywords||[]).map(row=>row.keyword));
  assert.deepEqual(keywords,['START','END','INPUT','OUTPUT','IF','ELIF','ELSE','END IF','FOR','END FOR','WHILE','END WHILE','FUNCTION','END FUNCTION','RETURN']);
  assert.ok(pseudocodeSlides.every(slide=>!slide.code&&!slide.files));
  assert.match(pseudocodeSlides[6].pseudocode,/\n    INPUT name/);
  assert.match(pseudocodeSlides[6].pseudocode,/\nEND$/);
});

 test('pseudocode control-structure examples match the flowchart algorithms', () => {
  const examples = pseudocodeSlides.slice(7,10);
  assert.deepEqual(examples.map(slide=>slide.title), ['Sequence in Pseudocode','Selection in Pseudocode','Iteration in Pseudocode']);
  assert.match(examples[0].pseudocode,/INPUT name\n    SET message TO "Hello" \+ name\n    OUTPUT message/);
  assert.match(examples[1].pseudocode,/SET temp_celsius TO 25\n    SET WARM TO 21/);
  assert.match(examples[1].pseudocode,/IF temp_celsius > WARM[\s\S]*Wow, it sure is hot![\s\S]*ELSE[\s\S]*Grab a sweater![\s\S]*END IF/);
  assert.match(examples[2].pseudocode,/WHILE i < 3\n        ADD i TO total\n        INCREASE i BY 1\n    END WHILE\n    OUTPUT total/);
});

const conditionSlides = JSON.parse(readFileSync(path.join(root, 'site/lessons/cse1120/conditions-and-if-statements/slides.json'), 'utf8'));
const conditionSource = JSON.parse(readFileSync(path.join(root, 'docs/lessons/conditions-and-if-statements-source.json'), 'utf8'));
test('Conditions and If Statements retains all 13 source slides and instructional wording', () => {
  assert.equal(conditionSlides.length, 13);
  conditionSlides.forEach((slide,index) => {
    assert.equal(slide.sourcePage,index+1);
    if (slide.kind === 'wrapup') return;
    const text = [slide.title,slide.intro||'',...(slide.bullets||[]),...(slide.paragraphs||[]),...(slide.headers||[]),...(slide.rows||[]).flat(),slide.code||'',...(slide.examples||[]).map(example=>example.code),slide.expectedOutput ? `OUTPUT ${slide.expectedOutput}` : ''].join('\n');
    assert.deepEqual(words(text),words(conditionSource[index].text),`Source wording differs on page ${index+1}`);
  });
});
test('all condition examples execute and step with the source results', async () => {
  for (const slide of conditionSlides) {
    for (const example of slide.examples || (slide.code ? [slide] : [])) {
      for (const mode of ['run','step']) {
        const result = await runPython(example.code,[],mode);
        assert.equal(result.output,example.expectedOutput,`${slide.title}: ${mode}`);
      }
    }
  }
});
test('edited conditions exercise boundaries, skipped blocks and first-match ordering', async () => {
  for (const mode of ['run','step']) {
    const standalone = await runPython(conditionSlides[5].code.replace('temperature = 25','temperature = 20'),[],mode);
    assert.equal(standalone.output,'Program complete.\n');
    if (mode === 'step') assert.ok(!standalone.steps.some(step=>step.line===4));
    assert.equal((await runPython(conditionSlides[6].code.replace('temperature = 15','temperature = 21'),[],mode)).output,'It is warm outside.\n');
    for (const [score,grade] of [[80,'A'],[79,'B'],[65,'B'],[64,'C']]) {
      assert.equal((await runPython(conditionSlides[7].code.replace('score = 72',`score = ${score}`),[],mode)).output,grade+'\n');
    }
    assert.equal((await runPython(conditionSlides[4].code.replace('logged_in = False','logged_in = True'),[],mode)).output,'True\nFalse\n');
    const examples = conditionSlides[9].examples;
    assert.equal((await runPython(examples[0].code,[],mode)).output,'A\n');
    assert.equal((await runPython(examples[1].code,[],mode)).output,'C\n');
  }
});

test('selection flowchart uses editable Celsius values on both sides of the threshold', async () => {
  const {flowchartSteps} = await import('../site/js/lessons/flowchart.js');
  for (const [temperature,branch] of [[25,'hot'],[21,'sweater'],[20,'sweater'],[-10,'sweater'],[21.5,'hot']]) {
    const steps = flowchartSteps('selection',{temperature});
    assert.equal(steps[3].node,branch);
    assert.match(steps[1].text,new RegExp(`= ${temperature} and WARM = 21`));
  }
  assert.throws(()=>flowchartSteps('selection',{temperature:NaN}),/finite/);
});
test('editing flowchart temperature resets playback, stops timers and validates input', async t => {
  const {mountFlowchart} = await import('../site/js/lessons/flowchart.js');
  t.mock.timers.enable({apis:['setInterval']});
  const buttons = ['run','step','stop','reset'].map(name=>Object.assign(new EventTarget(),{dataset:{flow:name},disabled:false}));
  const action = {textContent:'',classList:{add(){},remove(){}}}, count = {textContent:''};
  const temperature = Object.assign(new EventTarget(),{value:'25',valueAsNumber:25,setAttribute(){}});
  const label = {textContent:'',setAttribute(){}};
  const active = new Set();
  const nodes = ['start','values','check','hot','sweater','end'].map(id=>({dataset:{node:id},classList:{toggle(name,on){if(on)active.add(id);else active.delete(id);},remove(){active.delete(id);}}}));
  const root = {querySelector(selector){return selector === '.flow-step-action' ? action : selector === '.flow-step-count' ? count : selector === '[data-flow-temperature]' ? temperature : label;},querySelectorAll(selector){return selector === '[data-flow]' ? buttons : nodes;}};
  const player = mountFlowchart(root,'selection');
  const click = name=>buttons.find(b=>b.dataset.flow===name).dispatchEvent(new Event('click'));
  const edit = value=>{temperature.value=value;temperature.valueAsNumber=value==='' ? NaN : Number(value);temperature.dispatchEvent(new Event('input'));};
  click('run');t.mock.timers.tick(1000);assert.ok(active.has('values'));
  edit('20');t.mock.timers.tick(5000);assert.equal(count.textContent,'0 / 5');assert.equal(active.size,0);assert.match(label.textContent,/20/);
  for(let i=0;i<4;i++)click('step');assert.ok(active.has('sweater'));assert.match(action.textContent,/Grab a sweater/);
  edit('21.5');for(let i=0;i<4;i++)click('step');assert.ok(active.has('hot'));
  edit('');assert.ok(buttons.find(b=>b.dataset.flow==='run').disabled);click('step');assert.equal(active.size,0);assert.match(action.textContent,/valid temperature/);
  edit('-5');assert.equal(buttons.find(b=>b.dataset.flow==='run').disabled,false);click('reset');assert.equal(temperature.value,'-5');
  player.destroy();edit('30');assert.match(label.textContent,/-5/);
});
