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


## GNU Octave 11.3.0 portable Windows runtime

Glass bundles the unmodified official GNU Octave Windows distribution as a separate executable runtime under resources/octave-11.3.0. Octave is free software under GNU GPL version 3 or later; upstream license texts, component notices, README and package metadata are preserved in the runtime directory. GLASS-RUNTIME.json records the verified archive hash, GNU signing-key fingerprint, original download location, and critical binary hashes. Glass invokes the runtime as a separate process and does not modify its binaries.

Project: https://octave.org/ . Official binary and corresponding source distributions: https://ftp.gnu.org/gnu/octave/windows/ . Octave core source: https://ftp.gnu.org/gnu/octave/octave-11.3.0.tar.xz . The bundled interpreter is GNU Octave; it is not MathWorks MATLAB. MATLAB is a trademark of The MathWorks, Inc.


## CPython 3.15.2 Windows embeddable runtime

Glass bundles the official Python Software Foundation Windows x64 embeddable distribution under resources/python-3.15.2. Its LICENSE.txt and original files are retained. The source archive was verified against the SHA-256 checksum published on the official Python 3.15.2 release page; the Python executable has a valid Python Software Foundation Authenticode signature. GLASS-RUNTIME.json records the archive checksum and critical file hashes.

Release and source downloads: https://www.python.org/downloads/release/python-3152/ . License: https://docs.python.org/3.15/license.html . Binary source: https://www.python.org/ftp/python/3.15.2/python-3.15.2-embed-amd64.zip .
