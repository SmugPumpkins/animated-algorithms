# Project conventions

For all website and demonstration work, follow [docs/design-system.md](docs/design-system.md).

- All flowcharts must use the shared semantic roles and colours in `site/flowcharts.css` and `site/js/flowchart-theme.js`. Keep geometry and semantic role separate; active highlighting must preserve the role colour.
- Use the shared typography variables. Tourney is for headings, Aldrich for paragraphs, Turret Road for interface labels and controls, Tilt Neon for brand accents, and Consolas for code and terminal text.
- Reading text (including teaching notes, descriptions, and course topics) must be at least 16pt, approximately 21.33 CSS pixels, via `--font-reading-size`. Simulation text and compact interface labels are exempt. Preserve this minimum on mobile.
- Keep new demonstrations registered in `site/js/catalog.js`, with independent algorithm logic and listener/timer cleanup.
- Desktop fullscreen demonstrations should fit one viewport. Keep controls stationary; give expanding stacks, queues, tables, and logs their own scrollable panels. Follow `site/demonstrations.css` and the layout section in the design system.
- Run `node --test` before publishing. Check changed layouts and controls in the browser at desktop and mobile sizes.

- Slideshows use Poppins for text and Consolas for code. Normalize highlighted Consolas terms to orange inline code using the lesson rule in the design system. Keep slide controls minimal: Select slide, Fullscreen, and Run/Step/Stop/Reset for always-editable code. Readable font controls belong outside slideshows.
