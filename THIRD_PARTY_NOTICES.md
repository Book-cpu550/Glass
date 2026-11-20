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
| nspell | MIT |
| dictionary-en (English Hunspell dictionary) | MIT AND BSD |
| PDF.js / pdfjs-dist | Apache-2.0 |
| Cheerio | MIT |
| Yjs / y-protocols / y-tiptap | MIT |
| ws | MIT |
| electron-builder / NSIS (build tooling) | MIT; bundled NSIS license notices retained |

Upstream license files remain in the dependency packages and packaged app archive. The Windows distribution includes Electron's LICENSE and LICENSES.chromium.html; the Glass-specific license is GLASS-LICENSE.txt. Vendored package archives retain their package license files. Run `npm ls --omit=dev` to inspect the full runtime dependency tree. Reference-library entries are original study summaries with further-reading links, not copied textbook chapters.

The bundled 118-element dataset is derived from the [NIH PubChem Periodic Table](https://pubchem.ncbi.nlm.nih.gov/periodic-table/) and its public PUG REST periodic-table JSON. Values and source caveats are retained; estimated properties are not measurements. Chemistry charts are original study summaries linking to OpenStax Chemistry 2e, NIST CODATA, and the BIPM SI Brochure.

Cloud sharing deployment tooling uses Cloudflare Wrangler/workerd (Apache-2.0/MIT component notices retained in their packages) and @napi-rs/keyring (MIT). The deployment tooling is excluded from the desktop package.
