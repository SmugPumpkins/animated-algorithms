# Teaching lessons

The CSE 1110 Introduction to Python lesson preserves the original 16-page PDF language and order. `introduction-to-python-source.json` stores extracted source text for fidelity checks. Source output values remain in lesson data for verification, but terminals start empty and only display output after Run.

Lessons use local reveal.js and Skulpt assets; see `site/vendor/README.md` for versions and licenses. No build step or server execution is required. Register lessons in the module's `lessons` array in `site/js/catalog.js`, with a stable ID, title, description, slide count and relative URL. Place each lesson in its own `site/lessons/<module>/<lesson>/` directory with `index.html` and `slides.json`.

Slides declare title, sourcePage, kind, paragraphs (or cover intro/bullets), and optional code. `inlineCode` lists exact source terms that should receive inline code styling. Poppins is the default slide font; Consolas is for program code, terminals and inline code. Normalize highlighted Consolas source terms to orange inline code, regardless of original source colours; follow the shared design-system rule. Slideshows omit the Readable font control, which remains available elsewhere on the site.

Run executes Python in a disposable browser worker. Code is always editable with live syntax highlighting; Reset restores the original example and clears output. `input()` pauses in a real terminal input field and resumes on Enter. Multiple inputs and Python errors work. Variables appear after execution. Stop, slide navigation and leaving the page cancel execution. Examples reset when the page reloads. The original first lesson contains no input() calls; its examples can be edited to demonstrate input without changing the source lesson.

Skulpt implements browser Python, rather than a complete desktop CPython environment. Standard beginner print, input, variables and datatypes work; third-party packages and local file access are not provided. Execution and output limits keep examples responsive.

Use arrow controls, the slide picker or fullscreen for teaching. The picker always displays Select slide after navigation. Overview and Reading view are omitted. The S shortcut opens reveal.js speaker view when browser popups are allowed.

Run `node --test` to check source fidelity and all original examples, real multiple-input execution and error handling. Check desktop and mobile layouts when changing slide content or styles.
