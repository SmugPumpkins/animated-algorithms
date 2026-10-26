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
