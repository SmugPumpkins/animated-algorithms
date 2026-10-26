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

`dataFiles` defines editable virtual text files (`name`, `content`, optional `exists: false`). The Python worker executes `open` in r/w/a mode in an isolated in-memory filesystem. File creation, truncation and each write update the visible file panel while stepping; terminal output remains empty until execution. Run uses the panel's current contents. Completed examples require Reset before another execution; Reset restores the source file contents. Reset restores the original code, file contents and existence. Every slide/run has an independent worker; virtual files never access the computer's filesystem. Example files use Alex/Sam/Jordan; the final processing example starts with whitespace and inconsistent capitalization to make its changes visible.

The virtual filesystem uses Skulpt's nonreadopen/fileopen/filewrite hooks, preserving final lines without newlines. It supports the lesson's introductory text modes; binary files, directory operations and full CPython filesystem behavior are outside this implementation. Tests verify source fidelity with the Part 1 exception, real output and resulting file contents in both execution modes, missing reads and creation on append.

`kind: "cycle"` presents the read-process-write cycle as native SVG using shared flowchart roles and colors. The wide final code example puts its virtual file beside the editor. Path callouts remain complete paragraphs in a compact explanation layout.

## Input, Process, Output (CSE 1110, lesson 2)

The 17-slide deck retains its wording and order, with extracted PDF text in `input-process-output-source.json`. The teacher explicitly approved correcting slide 8's mismatched name-input code to `number = input("Enter a number: ")` followed by `print(number + 1)`, so its actual TypeError matches the explanation. The source terminal image's wording is retained in the source fixture; execution displays the interpreter's genuine error message.

All other code examples are transcribed from the source and support real terminal input, Run and Step. Tests cover every example in both modes, numeric casting, newline prompts, escape sequences and the corrected error. `ipoChart` supplies headers and one row of purpose descriptions for a native accessible planning table. Optional `stageLabels` retains the Input/Process/Output labels alongside the processing example. Source prompt/user annotations appear as a compact terminal note; the terminal always starts empty.

## Required wrap-ups and assignment links

Every slideshow must end with one `kind: "wrapup"` slide: title `Wrap Up`, 3–5 concise overview bullets, and optional orange `inlineCode` terms. If a supplied deck already has a wrap-up, use or adapt that slide instead of adding a duplicate. This teacher-authorized summary convention overrides source fidelity for wrap-up slides only; preserve the remaining instructional slides. Added summaries use `sourcePage: null`. Introduction to Python and External Modules replace their old closing slides; Input, Process, Output keeps its existing wrap-up position with a shorter point-form overview.

### Updating assignment repositories each semester

Edit **`site/assignments.csv`**. Its only columns are `lesson` and `assessment_url`. All current lessons already have a row. `lesson` is the stable `<module-id>/<lesson-id>` from the lesson folder, such as `cse1110/introduction-to-python`; leave that key unchanged across years. Paste the new semester's complete HTTPS GitHub repository URL into `assessment_url`, for example:

```csv
lesson,assessment_url
cse1110/introduction-to-python,https://github.com/YourAccount/intro-assignment-2027-winter
```

Use the actual assignment repository students should fork, not the reusable starting template, a student's fork, or a `/fork` URL. This example is documentation only; all shipped URLs are blank at the teacher's request. Keep older assignment repositories available for previous cohorts. Changing this CSV changes the destination for future clicks, without moving, creating or changing any existing forks.

Save/commit the CSV and let GitHub Pages deploy. No lesson HTML/JSON or JavaScript changes are needed. The next page load fetches the CSV without using a cached mapping. A nonblank URL displays **Start your assignment →**, followed by a reminder to fork and submit the fork link. A blank URL shows **Assignment link coming soon** with no broken or disabled link. Missing/unavailable mappings do not prevent teaching the lesson. Add a new row when registering a future lesson; tests enforce row coverage and wrap-ups.

Keep full assignment outlines, assessment criteria and submission instructions in the assignment repository for a single maintained source of truth. The lesson ends with the overview and the next-step link rather than a duplicate outline. CSV parsing supports normal spreadsheet quoting and CRLF. `node --test` validates CSV structure, repository URLs and lesson coverage before publishing.

## Algorithms (CSE 1110, lesson 3)

The seven-page Structured Programming Part 1 deck retains all instructional wording and code. A new eighth slide provides the standard point-form wrap-up, with a blank `cse1110/algorithms` assignment row. Extracted text is stored in `algorithms-source.json`. Sequence accepts real terminal input; selection can be edited to explore both branches; iteration executes a real loop. `objectiveLead`, `bodyBullets` and `afterBullets` preserve source objectives and explanation lists as native slide text. Tests cover source fidelity, Run/Step, alternate branches and changed loop counts.

## Visualizing Algorithms with Flowcharts (CSE 1110, lesson 4)

The 13-page Structured Programming Part 2 deck retains visible wording and order, followed by the required fourteenth wrap-up. `flowcharts-source.json` stores extracted PDF text; page 3's extracted `diagrams.net - Wikipedia` is hidden image metadata, not visible slide wording. Its original embedded diagrams.net logo is extracted unchanged and its tool URL remains clickable. A blank `cse1110/flowcharts` assignment row is included.

Flowcharts are native SVG with geometry (`type`) separate from shared semantic `role` colors. Start/end and input/output examples show both roles distinctly. The final sequence, selection and iteration diagrams retain all source labels and use Run/Step/Stop/Reset to highlight execution. Playback runs at one instruction per second. `flowchartSteps` computes example states independently from rendering: the selection uses the source's 25 > 21 condition; the loop computes total 3 when i reaches 3. The greeting uses example input Alex and the source's exact `"Hello" + name` expression. No Python code screenshot is present in this source deck. Leaving a slide stops its timer; page cleanup removes all listeners and timers.

`kind: "flowchart"` accepts a `diagram` with viewBox dimensions, nodes (IDs, geometry, roles, coordinates, sizes and label lines), and routed edges. Set `flowLayout: "wide"` for examples and `flowExample` for playback. `kind: "resource"` shows the original tool link and image. Text uses Poppins; diagram instructions use Consolas. Tests cover source wording, geometry/roles, branch connections, loop results and playback cleanup.

## Structuring Algorithms with Pseudocode (CSE 1110, lesson 5)

The four-page source becomes eleven slides: cover, definition, four readable keyword-table groups, indentation example, three teacher-requested sequence/selection/iteration examples matching the flowchart lesson, and wrap-up. The teacher approved replacing the copied flowchart objectives on the cover with pseudocode objectives. All remaining visible explanations and sample text are preserved. `pseudocode-source.json` stores extracted source text; tests normalize only missing extraction spaces at `SELECTIONcontrol`, `customfunctions` and `isTrue`.

`kind: "keyword-table"` presents native accessible keyword/description rows, grouped into Basic Commands, Selection, Iteration and Functions. Keep complete multiword terms in one orange inline-code span. `kind: "pseudocode"` displays the indented sample in Consolas with highlighted pseudocode keywords. Pseudocode is deliberately not sent to the Python interpreter; no Run controls imply that it is executable Python. A blank `cse1110/pseudocode` assignment row connects the wrap-up to the semester mapping.

Flowchart playback shows the current action in orange inline code at the left of its status region, with the completed-step count anchored at the bottom right. The symbol overview reserves space for branch labels. Only the standalone Arrow slide uses `diagram.edgeWeight: "strong"` to increase its arrow weight.


## Conditions and If Statements (CSE 1120, lesson 1)

The revised Selection Structures Part 1 deck retains all 13 source slides and instructional wording. The existing final overview becomes the standard point-form Wrap Up with a blank `cse1120/conditions-and-if-statements` assignment mapping. Extracted text is recorded in `conditions-and-if-statements-source.json`.

Conditions, comparisons, negation and if/elif/else examples use the shared live editor and real Run/Step execution. The two ordering comparison slides retain independent examples; the second preserves the source's correct/incorrect indicators using accessible `verdict` badges. Both terminals start empty. The native `reference-table` layout accepts `headers` and `rows`, using the first column as row headings and orange inline code for operator/example columns. The scoped `ordering` layout keeps both code examples visible above their terminals. Tests cover source fidelity, every example in Run and Step, boundary values, skipped blocks, negation and first-match behavior.


The selection flowchart has a Celsius number input (default 25; fixed WARM threshold 21). Editing it stops playback, clears the active step, updates the process label and recomputes the trace. Exactly 21 follows the False/sweater branch; decimal and negative values are supported. Empty/invalid input disables playback and provides an accessible explanation. Reset keeps the chosen temperature; leaving the slide stops playback and page cleanup removes the input listener.


## Nesting Selection Structures and Logical Operators (CSE 1120, lessons 2 and 3)

The teacher explicitly authorized revising and splitting the older Advanced Selection Structures deck. Lesson 2 has seven slides on nested checks and indentation. Lesson 3 has nine slides on Boolean operators, truth tables, grouping and chained ranges. `advanced-selection-source.json` records the original 15-page text. Wording and examples are deliberately simplified, so these lessons do not use verbatim-source assertions. Each ends with its own wrap-up and blank assignment row.

Use one simple idea per sentence. Explain alternatives in separate sentences. Keep examples short and focused. Nesting adds an inner-False case alongside the source's outer-False case. The grouping examples use simple Boolean ticket/pass/staff values; changing parentheses visibly changes the result. The teacher requested the open range `0 < x < 10`, with `x = 5` as its initial example. Tests cover all examples in Run and Step, skipped nested checks, indentation, every Boolean combination, grouping and excluded range endpoints.

`truthTables` supplies an operator, headers and Boolean rows. A `truth-tables` slide displays two native accessible tables. The `logical-example` layout places one table below the explanation beside runnable code. Inline terms retain the shared orange style.


Stepping includes a final completion step. After the last Python statement, its highlight and final values remain visible with “Last statement complete · Step to finish”. The next Step clears the line highlight and shows Finished without executing more code. Run and Step then stay disabled until Reset. Run mode finishes directly in that state. Reset clears output and restores the original example. Finished examples cannot silently restart through buttons or Ctrl/Cmd+Enter.

Truth-table headers style only the operator in `A and B` / `A or B` as orange inline code. The chained-comparison slide focuses on syntax and evaluates `0 < x < 10`, `10 > x > 0` and `0 <= x < 10` with editable input values. Tests check strict, reversed and partially inclusive boundaries in Run and Step.

Lesson slide JSON requests carry the shared renderer version and revalidate their cache. Bump the lesson script version when publishing content/layout updates so previously visited lessons load the matching slide content.


## For Loops and Advanced For Loops (CSE 1120, lessons 4 and 5)

The teacher authorized rewriting the rougher source slides and splitting the for-loop material. For Loops has 13 slides on iteration, range(start, stop, step), strings, lists and per-item processing. Advanced For Loops has 10 slides on nesting, enumerate, zip, break and continue. Each has its own wrap-up and blank assignment row. The original extracted text is retained in `for-loops-source.json` and `break-continue-source.json`; slide `sourceDeck` and `sourcePage` fields identify the source of revised content. New cover, wrap-up and nested-break examples use null source pages.

Explanations use short sentences with one idea each. Code uses descriptive variables, small collections and compact output. Enumerating, zipping and nested for loops appear only in the advanced lesson. The break/continue material is specific to for loops; the source's while-loop example is deliberately excluded. The advanced lesson adds a start=1 enumerate example, explains zip's shortest-iterable behavior, and demonstrates that break inside an inner loop leaves the outer loop running. Code uses the shared always-editable Run/Step/Stop/Reset playground, empty initial output and final completion step.

Tests execute every example in Run and Step. Additional cases cover range bounds/directions/empty ranges, a zero-step error, direct iteration, unchanged source lists, enumerate offsets, zip truncation, inner counter restarts, break scope, early search termination and skipped continue iterations.


## While Loops and Advanced While Loops (CSE 1120, lessons 6 and 7)

The teacher authorized revising and splitting the while-loop deck, adding Boolean flags, nesting and while-specific break/continue examples. While Loops has eight slides on pre-iteration condition checks, counters, repeated responses and flags. Advanced While Loops has ten slides on ongoing loops, nesting, validation and loop control. Each has a wrap-up and blank assignment mapping. `while-loops-source.json` records the original nine-page source; while-specific control material also references `break-continue-source.json`.

The introductory flag example sets running to False. A separate example shows that the rest of the current iteration still completes. The infinite-loop example uses a real input prompt on each pass, so it can be demonstrated with Run or Step and interrupted with Stop without flooding output. It is marked `expectedNonTerminating`; tests observe another input request after repeated iterations rather than expecting completion. The worker still retains its existing execution limits.

Validation examples re-prompt for invalid choices and keep accepted inputs in separate loops. Numeric validation catches ValueError so nonnumeric text does not end the demonstration. The short try/except explanation is introduced alongside that example. Nested loops reset the inner counter each outer iteration. Continue increments its counter before skipping so it can still terminate. Tests cover actual input in both modes, false initial conditions, flag timing, infinite-loop input requests, invalid numeric text, separate validation, nesting and break/continue scope.
