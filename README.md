# Learn CS

A classroom library of interactive CTS Computer Science demonstrations, organized into two classes:

| Class | Modules |
| --- | --- |
| Computer Science Foundations | CSE 1110, CSE 1120, CSE 1240, CSE 2110, CSE 2120 |
| Computer Science Certifications | CSE 2130, CSE 3110, CSE 3120, CSE 3130, CSE 3310 |

All modules have a topic overview and their own page. CSE 3310 currently includes the depth-first-search maze, with a synchronized flowchart and call stack. Modules without animations show a clear empty state until demonstrations are added.

## Run locally

With Node.js 22 or newer:

```sh
node scripts/serve.mjs
```

Open http://127.0.0.1:4173. No dependency installation or build is needed. The deployable website is entirely inside `site/`.

## Controls

| Control | Action |
| --- | --- |
| Space | Play/pause (initially 1 step/second) |
| Left / Right | Pause and move one step |
| F / S / N | Play at 10 / 0.25 / 1 steps per second |
| L | Toggle looping |
| R | Restart; preserve playback state |
| Timeline | Pause and jump to any recorded step |
| Present fullscreen | Enter browser fullscreen; Esc exits |

Buttons and a speed selector support touch and mouse input. Changing the selector preserves play/pause state. Keyboard shortcuts leave focused form controls, buttons, and links to their normal browser behavior. Navigation cleans up playback and keyboard listeners.

## Publish to GitHub Pages

Target repository: https://github.com/SmugPumpkins/learn-cs

1. Push this project to the repository's `main` branch.
2. In **Settings → Pages → Build and deployment**, choose **GitHub Actions** as the source.
3. The **Publish algorithm library** workflow tests the code, then publishes `site/`. If needed, start it manually from **Actions → Publish algorithm library → Run workflow**.

Expected URL after successful deployment: https://SmugPumpkins.github.io/learn-cs/

Relative asset URLs and hash-based navigation support project subdirectories and refreshes without server routing. Only `site/` is uploaded. Deployment follows [GitHub's official Pages workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Add modules and demonstrations

`site/js/catalog.js` contains two registries: `courses` defines classes and their ordered `moduleIds`; `modules` defines CTS module details and demonstrations. Add a module to `modules` and reference its ID from a class. Add another class by extending `courses`; the home sections, class pages, counts and breadcrumbs update automatically. A module may be referenced by more than one class. Stable module URLs preserve existing links when class membership changes.

Class pages use `#/courses/<class-id>`, module pages use `#/modules/<module-id>`, and demonstration links use `#/demo/<module-id>/<demo-id>`. Each demonstration supplies an ID, description, tags, and a `load` function importing its JavaScript module. Empty demonstration arrays are supported without placeholder links.

Each demonstration module exports `mount(root)`. It renders into the supplied element and returns a cleanup function to remove listeners and cancel animation work when navigating away. The generic home and module pages are generated from the registry. Keep algorithm logic independent of the DOM, as in `dfs-engine.js`, so it can be tested directly.

SVG keeps diagrams sharp at any display size. The main library has no build step. Lessons bundle reveal.js and Skulpt locally. Aldrich, Turret Road, Tilt Neon, and Poppins load from Google Fonts, with system fallbacks. Code and terminal text use Consolas.

## Styling and flowchart conventions

Follow the [design system](docs/design-system.md) for all current and future demonstrations. It documents the retro neon theme, font roles, required flowchart colours, and active-instruction styling. Shared theme files are `site/neon.css` and `site/flowcharts.css`; every flowchart node must declare its semantic role independently of its shape.

## Verify

```sh
node --test
```

Tests cover catalog references, unique URLs, module discoverability, demonstration imports, the solution path, backtracking, base cases, independent snapshots, flowchart instruction coverage, playback timing, looping, and scrubbing. The original reference diagram remains in `recursion/solve.png`.

## Teaching slides

CSE 1110 includes a 16-slide [Introduction to Python lesson](site/lessons/cse1110/introduction-to-python/index.html). See the [lesson authoring guide](docs/lessons/README.md) for content, interactive terminals and typography conventions.

## Assignment links and lesson wrap-ups

Update semester-specific assignment repository links in [`site/assignments.csv`](site/assignments.csv). Keep lesson keys stable and replace only the URL column. Blank URLs show a coming-soon message. Every lesson ends with a point-form wrap-up and a CSV-powered next step. See [the teaching guide](docs/lessons/README.md#required-wrap-ups-and-assignment-links) for details.
