# Animated Algorithms

A classroom library of interactive CTS Computer Science demonstrations. Start with **CSE 3310 - Recursive Algorithms 1**, then explore depth-first search through a maze with a synchronized flowchart and call stack.

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

Target repository: https://github.com/SmugPumpkins/animated-algorithms

1. Push this project to the repository's `main` branch.
2. In **Settings → Pages → Build and deployment**, choose **GitHub Actions** as the source.
3. The **Publish algorithm library** workflow tests the code, then publishes `site/`. If needed, start it manually from **Actions → Publish algorithm library → Run workflow**.

Expected URL after successful deployment: https://SmugPumpkins.github.io/animated-algorithms/

Relative asset URLs and hash-based navigation support project subdirectories and refreshes without server routing. Only `site/` is uploaded. Deployment follows [GitHub's official Pages workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Add modules and demonstrations

`site/js/catalog.js` is the module registry. Add a module with its CTS code, title, topics, and demonstrations, or add another demonstration to an existing module. Each demonstration supplies an ID, description, tags, and a `load` function importing its JavaScript module.

Each demonstration module exports `mount(root)`. It renders into the supplied element and returns a cleanup function to remove listeners and cancel animation work when navigating away. The generic home and module pages are generated from the registry. Keep algorithm logic independent of the DOM, as in `dfs-engine.js`, so it can be tested directly.

SVG keeps diagrams sharp at any display size. There are no runtime packages or external fonts. Colours and layout are in `site/styles.css` for the next design iteration.

## Verify

```sh
node --test
```

Tests cover the solution path, backtracking, base cases, independent snapshots, flowchart instruction coverage, playback timing, looping, and scrubbing. The original reference diagram remains in `recursion/solve.png`.
