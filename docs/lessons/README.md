# Teaching lessons

The CSE 1110 Introduction to Python lesson preserves the original 16-page PDF language and order. `introduction-to-python-source.json` stores extracted source text for fidelity checks. Source output values remain in lesson data for verification, but terminals start empty and only display output after Run.

Lessons use local reveal.js and Skulpt assets; see `site/vendor/README.md` for versions and licenses. No build step or server execution is required. Register lessons in the module's `lessons` array in `site/js/catalog.js`, with a stable ID, title, description, slide count and relative URL. Place each lesson in its own `site/lessons/<module>/<lesson>/` directory with `index.html` and `slides.json`.

Slides declare title, sourcePage, kind, paragraphs (or cover intro/bullets), and optional code. `inlineCode` lists exact source terms that should receive inline code styling. Poppins is the default slide font; Consolas is for program code, terminals and inline code. Normalize highlighted Consolas source terms to orange inline code, regardless of original source colours; follow the shared design-system rule. Slideshows omit the Readable font control, which remains available elsewhere on the site.

Run executes Python in a disposable browser worker. Code is always editable with live syntax highlighting; Reset restores the original example and clears output. `input()` pauses in a real terminal input field and resumes on Enter. Multiple inputs and Python errors work. Step executes one Python statement per press, highlights the step just executed, and updates variables while retaining the live interpreter. Blank lines and comments are skipped. Run continues a paused session; Step after completion starts a fresh session. Code is temporarily read-only while execution is running or paused; Stop enables editing again. Variables appear as type: name value (for example, int: score 120 or str: name Nathan), with unquoted string values. Stop, slide navigation and leaving the page cancel execution. Examples reset when the page reloads. The original first lesson contains no input() calls; its examples can be edited to demonstrate input without changing the source lesson.

Skulpt implements browser Python, rather than a complete desktop CPython environment. Standard beginner print, input, variables and datatypes work; third-party packages and local file access are not provided. Execution and output limits keep examples responsive.

Use arrow controls, the slide picker or fullscreen for teaching. The picker always displays Select slide after navigation. Overview and Reading view are omitted. The S shortcut opens reveal.js speaker view when browser popups are allowed.

Run `node --test` to check source fidelity and all original examples, real multiple-input execution and error handling. Check desktop and mobile layouts when changing slide content or styles.


## External Modules (CSE 2110, lesson 2)

This lesson adapts the teacher's 10-page Procedural Programming Part 2 PDF into 13 web slides. Permission to revise wording applies to this lesson only; the Introduction to Python lesson still preserves its original wording. Changes include clearer parameter/return explanations, a direct-run versus import comparison, separate type-hint and docstring slides, and a short practice prompt. `external-modules-source.json` keeps the extracted source text; each web slide records its sourcePage.

Reusable slide layouts:

- `kind: "text"` displays an explanation without an empty code panel.
- `layout: "wide"` gives code the full width, with an optional explanation above.
- `layout: "annotated"` pairs a wide runnable example with three annotation columns (`annotations`, each with `title` and `text`).
- `files` contains `{name, code}` objects; `entryFile` identifies the program executed by Run or Step. Use `splitFiles: true` for side-by-side editors; otherwise file tabs select the visible editor. Both files remain editable, and Reset restores all files.

Companion Python files are held in memory and imported by the real interpreter. Step follows execution into supplied files, highlights the relevant editor and switches tabs when needed. The paused status identifies the current source file. Files do not persist after reload. Inline code and syntax colours use the shared theme, including multiline docstrings.

Module pages display module topics in one column, followed by lessons, then interactive demonstrations.


## Focus on Functions (CSE 2110, lesson 1)

The teacher's 15-slide Procedural Programming Part 1 deck retains its wording and slide order. `focus-on-functions-source.json` stores the extracted PDF text for source checks. Code screenshots become editable examples; blank lines in the dense comparisons are compacted for layout. The type-hint warning examples and final documentation example include the previously introduced `get_area` definition so each example is independently executable. Original editor inlay hints are shown as normal valid Python arguments, not mistaken for Python syntax. Intentional misuse examples produce real TypeErrors when run.

The full battle games on slides 9 and 10 are copied from the source links embedded in the PDF, rather than transcribed from tiny screenshots:

- [One bloated mega function](https://github.com/SmugPumpkins/One-Function-One-Task-Examples/blob/main/one-bloated-mega-function.py), source blob `360e30e64bb989268ea7f0cb6fc5780e6a6e4e05`.
- [One function, one task](https://github.com/SmugPumpkins/One-Function-One-Task-Examples/blob/main/one-function-one-task.py), source blob `9c04bdf9143ff9773aa62770b9610d405a82b861`.

Both are runnable, use real player choices, retain random outcomes, and provide a visible GitHub source link. Tests seed randomness only inside the test harness to compare their behaviour.

`kind: "comparison"` accepts an `examples` array. Each example has its own code, optional paragraph and accessible label, and independent Run/Step/Stop/Reset, terminal input and variables. An optional slide caption follows both panels. Leaving the slide stops every example, including paused sessions. `compactCode` gives a dense example tighter code spacing without shrinking teaching prose. `layout: "documentation"` combines a runnable example with a readable native documentation preview (signature, description, parameters and return text).


## Manipulating Strings (CSE 2120, lesson 1)

This nine-slide lesson starts the Data Structures collection. At the teacher's request, its cover and introductory framing focus on strings rather than plain text files, and file-specific examples in the prose are generalized to text. The string-method examples and explanations otherwise retain the source deck's language and order. `manipulating-strings-source.json` stores the extracted PDF text.

Run and Step execute case conversion, trimming, whitespace/custom-separator splitting, replacement, joining and numeric conversion. The trimming example preserves three leading and trailing spaces in its original string. `highlightWhitespace: true` adds grey backgrounds behind spaces in actual terminal output without changing their text values. An optional `terminalNote` supplies a readable explanation inside that example's terminal. The numeric conversion example has no print call, matching its source; variable chips show the resulting types and values.

Add subsequent lessons to CSE 2120's `lessons` array in teaching order with stable IDs and consecutive lesson numbers.


## Lists (CSE 2120, lesson 2)

The teacher's 21-slide Data Structures Part 1 deck follows Manipulating Strings in the module catalog. Its wording, slide order and code are retained; `lists-source.json` stores the extracted source for fidelity checks. Terminals compute actual Python output, so list representations use the interpreter's normal quoting. The deliberately invalid index produces a real IndexError, rather than a prewritten output fixture.

All examples support Run and Step, including mutations, negative indices, loops, copying and aliasing. At the reference mutation on the final slide, the original and reference variables both update while the copied list remains independent; tests verify that paused state.

`layout: "code-emphasis"` gives longer code and printed list values a wider column. `denseText` adjusts dense explanations while keeping reading text above the 16pt minimum. These layouts preserve the content and keep the complete initial example visible. `compactCode` retains the shared tighter editor spacing where appropriate.

## Tuples (CSE 2120, lesson 3)

The five-slide Data Structures Part 2 deck retains its wording and order, with extracted text in `tuples-source.json`. All four code examples support Run and Step. The nested list can change while its containing tuple remains immutable; the final example raises a real AttributeError when attempting to append directly to the tuple. Output starts empty until execution.

## Dictionaries (CSE 2120, lesson 4)

All 16 source slides retain their wording and order; `dictionaries-source.json` records the extracted PDF text. Editable examples run and step through key-value access, changes, removal methods, defaults, traversal and copying. The final example shows reference mutations affecting both names while the copied dictionary remains independent. Terminals start empty and compute actual output.

`layout: "long-explanation"` gives lengthy prose an equal-width column, 22px text (above the 16pt minimum), and compact code/output. The final dictionary comparison uses this layout to keep its full explanation visible.

## Data Classes (CSE 2120, lesson 5)

All nine slides retain their wording and sequence; `data-classes-source.json` records extracted PDF text. The import, class declarations, constructors, field reads and field updates execute with Run and Step. Instance values appear in the variable panel as `Student: student Student(name='Alice', grade=11)`. Blank lines are compacted where needed to keep the complete example visible.

The vendored Skulpt interpreter lacks annotation-only class statements and the standard `dataclasses` module. `dataclasses-compat.js` lowers direct class field annotations to `__annotations__` assignments without changing line counts, and supplies an introductory compatibility module. It supports mutable data classes, positional/keyword construction, simple defaults, repr and equality, including constructor argument errors. Type annotations remain descriptive rather than enforcing types. It does not implement the full CPython API (decorator options such as frozen/slots, field factories, inheritance, or helper functions). Keep advanced examples out of this compatibility path until support is explicitly added and tested. Source strings/comments remain unchanged; the displayed editor always retains original Python syntax. Companion files use the same lowering. Tests cover source fidelity, execution in both modes, independent instances, defaults/errors and source line mapping.

## Multidimensional Lists (CSE 2120, lesson 6)

All 13 source slides retain their wording, order and code, with extracted text in `multidimensional-lists-source.json`. Run and Step execute 2D/3D construction, indexing, row-major/column-major traversal and three nested loops. Tests check actual results and traversal positions when stepping. Terminals start empty, including examples without a source output screenshot; execution reveals their real output.

Optional `indexGrid` is an array of rows of coordinate strings. The shared lesson renderer presents it as an accessible native table below the explanation, preserving the source's 3-by-3 index diagram without a screenshot. Coordinates are simulation labels in Consolas, separate from orange inline code phrases. Compact code spacing and the existing code-emphasis layout accommodate deeper nesting.

The shared syntax highlighter distinguishes decorators (yellow), string escapes (orange), f-string braces (pink), and interpolated expressions (pale purple). It keeps the same textarea/overlay editor and current-line highlighting. Raw strings keep literal backslashes; escaped f-string braces remain literal. Tests verify lossless HTML escaping, multiline strings, nested expressions and incomplete edits.

Editor, output and variable-panel scrollbars use dark tracks and cyan thumbs, with native scrolling behavior and platform fallbacks. Both standard scrollbar properties and WebKit pseudo-elements are styled.

## Parallel Lists (CSE 2120, lesson 7)

All six slides retain source wording and sequence, with extracted text in `parallel-lists-source.json`. Five editable examples support Run and Step, including matching indices, range-based traversal, enumerate and zip. Tests check source fidelity, real output in both modes and matching name/grade pairs across all three traversal approaches. The shared syntax highlighting and neon scrollbars apply automatically.

## Reading, Writing, and Appending (CSE 2130, lesson 1)

The teacher moved string manipulation into Data Structures. This 15-slide plain-text-file deck is therefore **Lesson 1 / Part 1** in Files & File Structures 1, even though its PDF cover says Part 2. Keep subsequent file lessons numbered from this revised sequence. All other source wording and code are retained in order; `reading-writing-appending-source.json` records extracted text.

`dataFiles` defines editable virtual text files (`name`, `content`, optional `exists: false`). The Python worker executes `open` in r/w/a mode in an isolated in-memory filesystem. File creation, truncation and each write update the visible file panel while stepping; terminal output remains empty until execution. Run uses the panel's current contents, so running append twice appends twice. Reset restores the original code, file contents and existence. Every slide/run has an independent worker; virtual files never access the computer's filesystem. Example files use Alex/Sam/Jordan; the final processing example starts with whitespace and inconsistent capitalization to make its changes visible.

The virtual filesystem uses Skulpt's nonreadopen/fileopen/filewrite hooks, preserving final lines without newlines. It supports the lesson's introductory text modes; binary files, directory operations and full CPython filesystem behavior are outside this implementation. Tests verify source fidelity with the Part 1 exception, real output and resulting file contents in both execution modes, missing reads and creation on append.

`kind: "cycle"` presents the read-process-write cycle as native SVG using shared flowchart roles and colors. The wide final code example puts its virtual file beside the editor. Path callouts remain complete paragraphs in a compact explanation layout.

## Input, Process, Output (CSE 1110, lesson 2)

The 17-slide deck retains its wording and order, with extracted PDF text in `input-process-output-source.json`. The teacher explicitly approved correcting slide 8's mismatched name-input code to `number = input("Enter a number: ")` followed by `print(number + 1)`, so its actual TypeError matches the explanation. The source terminal image's wording is retained in the source fixture; execution displays the interpreter's genuine error message.

All other code examples are transcribed from the source and support real terminal input, Run and Step. Tests cover every example in both modes, numeric casting, newline prompts, escape sequences and the corrected error. `ipoChart` supplies headers and one row of purpose descriptions for a native accessible planning table. Optional `stageLabels` retains the Input/Process/Output labels alongside the processing example. Source prompt/user annotations appear as a compact terminal note; the terminal always starts empty.
