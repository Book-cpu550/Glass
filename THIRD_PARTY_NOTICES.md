# Third-party notices

The 100% AI-coded disclosure applies to Glass-specific application code. Glass depends on independently authored open-source components, including:

| Component | License |
| --- | --- |
| Electron / Chromium | Electron MIT; Chromium and bundled component notices in the distribution |
| Tiptap / ProseMirror | MIT |
| MathLive | MIT; bundled fonts retain their font licenses |
| KaTeX | MIT; bundled fonts retain their font licenses |
| Plotly.js | MIT |
| OpenChemLib | BSD-3-Clause |
| DOMPurify | MPL-2.0 OR Apache-2.0 |
| Marked | MIT |

Upstream license files remain in the dependency packages and packaged app archive. The Windows distribution includes Electron's LICENSE and LICENSES.chromium.html; the Glass-specific license is GLASS-LICENSE.txt. Vendored package archives retain their package license files. Run `npm ls --omit=dev` to inspect the full runtime dependency tree. Reference-library entries are original study summaries with further-reading links, not copied textbook chapters.
