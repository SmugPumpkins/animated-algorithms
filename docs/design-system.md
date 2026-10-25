# Visual design system

All current and future modules and algorithm demonstrations follow this guide.

## Direction

Retro neon: deep midnight surfaces, crisp geometric headings, cyan and pink accents, restrained neon glows, and subtle static grids. Keep long text clear and diagrams readable. Do not add flashing, flickering, pulsing, animated scanlines, or decorative motion that distracts from the algorithm. Honour reduced-motion preferences.

## Typography

| Font | Use |
| --- | --- |
| Tourney, weights 500–700 | Page headings, section headings, module and demonstration titles |
| Aldrich | Paragraphs, explanations, teaching notes and general body text |
| Turret Road | Controls, navigation, small section labels, badges, legends and panel headings |
| Tilt Neon | Brand wordmark and short decorative captions or introductory accents |
| Consolas | Code, terminal text, call stacks, flowchart instructions, coordinates, keyboard hints and numeric playback status |

Font families are defined once as `--font-heading`, `--font-body`, `--font-ui`, `--font-accent`, and `--font-code` in `site/neon.css`. Reuse those variables rather than adding font names in each demonstration. The four web fonts load through Google Fonts with `display=swap`; system fallbacks keep the interface usable when offline or when font requests are blocked. Consolas uses Liberation Mono and Courier New as fallbacks on devices where it is unavailable.

Use a minimum of **16pt (approximately 21.33 CSS pixels)** for reading text, including body paragraphs, course descriptions, topic lists, and teaching notes. Reuse `--font-reading-size`, including on mobile, with about 1.7 line height. This minimum is in points, not pixels. Text inside simulations (flowchart labels, playback explanations, call stacks, coordinates), controls, and compact interface annotations have separate sizing. Do not shrink reading text to make a layout fit. Reserve a stable explanation region for simulation messages in fullscreen mode.

The website logo uses `site/favicon.svg` directly so the header and browser icon stay consistent.

## Course content

Keep module cards concise and factual: course code, title, principal program-of-studies topics, and the number of available demonstrations. Avoid slogans and decorative taglines in module cards. Curriculum coverage and the demonstrations currently available are separate; listing a topic does not mean its demo has already been built. Cite the official Alberta Computing Science program of studies when summarizing course outcomes: https://education.alberta.ca/media/159479/cse_pos.pdf

The home-page learning flowchart applies across computer science courses: understand a problem, plan, build and test, debug as needed, and explain the solution. Use the shared semantic palette for this chart as well.

## Required flowchart colours

Colour communicates the **instruction's role**, independent of its shape, execution state, or Boolean result. This is a project-wide convention for every new flowchart.

| Semantic role (`data-role`) | Meaning | Colour | Shared CSS token |
| --- | --- | --- | --- |
| `parameter` | Input / parameters | Yellow `#FFE66D` | `--flow-parameter` |
| `start` | Start | Green `#65FFAD` | `--flow-start` |
| `end` | End | Red `#FF5D7D` | `--flow-end` |
| `decision` | Decision | Orange `#FFAD55` | `--flow-decision` |
| `process` | Process | Blue `#739CFF` | `--flow-process` |
| `return` | Return | Purple `#BD88FF` | `--flow-return` |
| `predefined` | Predefined process / subroutine call | Cyan `#4DE8F4` | `--flow-predefined` |
| `output` | Output | Orchid purple `#EF9DFF` | `--flow-output` |

`site/flowcharts.css` owns the palette and node styling. Give each SVG node both a geometry `type` and an explicit semantic `role` in its data. Geometry and meaning are separate: input and return nodes may both be parallelograms but must have different colours. Both Return True and Return False are **purple**. A return is not an end node; use red for an explicit End instruction. Use cyan for calling another routine and blue for ordinary processing.

Render a node with `class="flow-node"`, its algorithm-specific `data-node`, and `data-role="…"`. Use the eight roles exported by `site/js/flowchart-theme.js`; do not invent per-demonstration palettes. For example:

```html
<g class="flow-node" data-node="MARK" data-role="process">
  <rect x="0" y="0" width="160" height="40" rx="6" />
  <text x="80" y="24">Mark visited</text>
</g>
```

### Active instruction

Toggle the `active` class. Retain the node's semantic hue and use a thicker, dashed border, brighter fill, white text and a strong layered static glow to indicate the current instruction. The shared glow combines a tight 3px core with 10px and 22px halos. Never replace every active node's colour with a single highlight colour. Borders and text remain legible without the glow. Do not rely on colour alone: keep standard flowchart shapes, readable labels, and the current-instruction explanation.

Use `flowLegend(roles)` from `site/js/flowchart-theme.js` for a consistent colour key. Include the roles present in that diagram. There is no need to add Start, End, or Output nodes to algorithms that do not use them.

### Other visualisations

Maze states and other algorithm-specific visuals may have their own legends (visited, dead end, solution, and checking). Those state colours do not redefine the flowchart's semantic palette.

## Demonstration layout

Desktop fullscreen demonstrations should fit the viewport without page scrolling whenever practical. Use the shared presentation rules in `site/demonstrations.css`: a compact heading above a workspace with fixed playback controls, and a flexible visual area between them. Preserve SVG aspect ratios while fitting diagrams into their available cells. Do not hard-code a canvas taller than its available screen space.

For depth-first search, use three desktop columns: maze, flowchart, and call stack. The call stack is an independently scrollable vertical list with newest calls first. Keep its outer height stable, use `min-height: 0` on flexible containers, and reserve scrollbar space so adding calls does not resize the panel or move the navigation. Long status messages scroll inside their reserved region instead of increasing the workspace height.

Future demonstrations should use the same pattern for growing data (queues, logs, variable tables, and stacks). Give any necessary scrolling to those panels rather than the entire fullscreen page. On narrow screens or very short windows, allow a vertical page layout rather than clipping content or making text unreadably small. Validate desktop fullscreen at 1920×1080 and 1366×768, including the largest data state, and check mobile readability.

## Files

- `site/styles.css`: base page layouts, responsive breakpoints, and demonstration structure.
- `site/neon.css`: shared retro neon theme and typography.
- `site/flowcharts.css`: all flowchart role colours, active state, and legends.
- `site/js/flowchart-theme.js`: accepted role names and reusable legend renderer.
- `site/demonstrations.css`: stable visual panels and viewport-fitted fullscreen layout.

Keep design changes in these shared files so future demonstrations inherit the same conventions.
