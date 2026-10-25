# Locally hosted presentation dependencies

Runtime assets are pinned and checked into the repository. They do not require a build or a third-party CDN at lesson time.

| Package | Version | Source | Licence |
| --- | --- | --- | --- |
| reveal.js | 6.0.2 | https://registry.npmjs.org/reveal.js/-/reveal.js-6.0.2.tgz | MIT; `reveal/LICENSE` |
| Skulpt | 1.2.0 | https://registry.npmjs.org/skulpt/-/skulpt-1.2.0.tgz | MIT; `skulpt/LICENSE` |

Only reveal.js core, CSS and the notes plugin, and the Skulpt interpreter and standard-library bundle are included. Source maps are omitted. Preserve package licences when updating. Skulpt runs Python 3 examples in a disposable Web Worker; it is a browser implementation of Python, not a full desktop CPython installation.
