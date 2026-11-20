## Online accounts and sharing

Click **Account** to create/sign in to a username/password account. Open shared documents from the account list on another computer. Share now uses the configured internet service automatically, so the owner can be offline; free quotas apply. Only documents you share or join are uploaded. Local notes stay available after sign-out. See [cloud sharing and account details](CLOUD_SHARING.md).

# Current navigation and sharing

- **Folders:** click **New folder** in the sidebar. Use paths such as Courses/Calculus for nested folders. Right-click a note → Tags and organization to edit tags, its notebook, folder, and pin. Drag notes onto folders or another notebook; drop onto a note to place it before that note in its folder.
- **Blank documents:** New note creates a blank page immediately. The old note templates and toolbar template dropdowns have been removed.
- **Symbols:** use the separate Math Symbols, Biology Symbols, and Chemistry Symbols buttons. Greek letters opens a picker rather than inserting an example. Ctrl+Shift+K opens Math Symbols.
- **Chemistry charts:** open Chemistry Reference → Periodic table & charts. Browse all 118 elements, search for an element, or choose one of six study charts. Insert facts/charts as editable tables. Element values include source-specific conditions and estimates; review their notes.
- **Reference navigation:** use Previous/Next arrows (or Alt+Left/Right) to browse the filtered list. Long cards scroll within the library; the application frame stays fixed.
- **URL citations:** Citations → paste a public HTTPS URL → Generate from URL. Review extracted metadata and complete any missing fields, then Save citation. Forms are saved locally with the note, including unfinished input. Metadata quality depends on the publisher; login-only pages and PDF URLs are not parsed by this lookup. DOI lookup is also available.
- **Share:** Share → Share current document → privately send the edit or view-only invitation. Your friend opens Share, pastes the invitation under Join a shared document, and clicks Join document. Use the same reachable LAN or a configured WSS relay. No accounts are required. See [collaboration setup and limitations](COLLABORATION.md).

# Glass v4.2.2 quick guide

- **Writing review:** enable Offline writing review above the document, then click an underlined issue. Accept a correction, Dismiss it, or add a spelling to your personal dictionary. Grammar → Quick check also reviews locally. Deep review is optional AI. Equations/code are excluded.
- **Citations:** Citations opens the MLA form. Fill source details, preview, and Save citation. Select a saved source to edit/remove it or insert an in-text/full citation. Create Works Cited page makes an alphabetized, editable page with hanging indents; its PDF uses MLA-style spacing and margins. DOI lookup is optional and online.
- **Organization:** Organize sets a folder path, tags, and a pin. Sidebar filters narrow notes by folder, tag, or content. Type `[[another document name]]` for links; Organize lists incoming/outgoing links across notebooks. Duplicate titles can be selected from the list.
- **Backups:** Notebook settings → Backups & recovery. Choose a local folder, back up all notebooks, export one/all notebooks as `.glassbackup`, or restore. Matching files are restored; other notes remain. Every restore first makes a safety backup. Automatic backups happen after editing at most every 30 minutes; 14 automatic backups are retained. Manual backups are kept until you remove them.
- **References:** References adds a numbered caption at the cursor, or inserts a link to an existing caption. Numbering follows caption order. Click a cross-reference to jump to its caption. A deleted caption displays Missing reference rather than a misleading number.
- **Symbols:** Math Symbols, Biology Symbols, and Chemistry Symbols search their complete notation palettes. Math Symbols → Greek letters opens lowercase, uppercase, and variant choices; Ctrl Shift K opens it. Ctrl M inserts inline math, Ctrl Shift M display math, Tab visits boxes, and Escape returns to prose. Arrow keys can enter adjacent equations.
- **Figures:** Figure layout changes the width, alignment, and caption of any inserted figure. Double-click a figure to reopen its model. Shared drafting Undo/Redo routes to pen/biology history or graph/chemistry inputs. Replot/rebuild after undoing input changes to refresh the preview.
- **AI:** choose Current note, Selected prose only, or Question only. Review the shared-material preview and conversation-history toggle before asking. Review changes opens individual Accept/Decline cards. Math/code cannot be replaced by prose edits.
- **Import:** Import accepts PDF, `.md`, `.tex`, and `.txt`. PDF text is extracted locally for review; original page images can preserve layout/scans. PDF reading order and equations may need editing. This is not automatic offline OCR. Up to 100 pages can be read; original images are available for up to 20 pages within a 5 MB budget.
- **Printing:** Print layout offers paper size, margins, landscape, page numbers, preview, and export. Page break inserts an explicit break. The main Export PDF button keeps the one-step default workflow.
- **Installation/updates:** the v4.2.2 installer is unsigned. Settings → Check for updates performs an explicit GitHub check. Available installers are downloaded and checked against GitHub’s SHA-256 digest before you can launch them. Backups precede installation. A signing certificate is needed for a future trusted publisher signature.

The original detailed guide follows. The storage model now uses an index and on-demand bodies; older descriptions of loading every note at startup no longer apply.

---

# Glass

A local desktop notebook for continuous prose, editable equations, drawings, graphs, and a searchable math reference library.

## Note layouts and tables

Note search includes prose, equations, text in tables, biology labels/connections, and chemistry compound names/formulas. PNG bytes are not indexed.

**New note** or Ctrl+N immediately opens a blank document. Note-layout templates have been removed.

Use **Table** in the toolbar to choose a size with the grid or enter rows and columns. Click a cell to type text or equations. The same menu adds/removes rows and columns, merges/splits selected cells, toggles headers, changes cell color, and deletes the table. Drag column borders to resize. Tab moves through cells and adds a row at the end; Shift+Tab moves backward. Tables remain editable locally and appear in PDF exports.

## Biology

**Biology Reference** contains 60 offline entries across cells, molecular biology, genetics, evolution, ecology, physiology, biochemistry, microbiology/immunity, and development/systems biology. Search, filters, favorites, custom entries, and reviewable AI imports work as in the other reference libraries. **Biology Symbols** adds 16 notation templates, including DNA/RNA strands, genetic crosses, population genetics, growth models, and enzyme kinetics.

**Biology tools** offers DNA/RNA sequence analysis, reverse complements, transcription from a coding strand, frame-specific translation, and GC content. Select standard or vertebrate mitochondrial genetic code. Input is one sequence or one FASTA record; ambiguous codons become X, stops become *, and GC excludes ambiguous bases. Translation does not infer an initiation site. Punnett squares support one to three independent loci and insert as editable tables. Scientific names insert with italics. Select biological prose before choosing **Explain selected text** to prepare an AI question; sending still requires clicking Ask AI. Photo transcription opens the existing review-before-insertion workflow for text, equations, and visible diagram labels.

**Draw → Biology** opens a canvas with a separate, scrollable properties panel. Click an element to highlight it, double-click to rename, and drag to move without changing where you grabbed it. Search the part picker, resize/rotate the selected part, set its label size/visibility, duplicate it, or use Arrange elements. Zoom, Pan canvas (or Space+drag), Fit canvas, and optional grid snapping make dense diagrams easier to edit. Arrow keys nudge the selected element; Shift moves farther. Delete removes the selection. Connect two elements creates a relationship by clicking its endpoints; duplicate relationships and ancestry cycles are rejected. Valid feedback-loop pathways use a circular layout when arranged. Large labels reflow beside rotated parts when needed to keep the full label in the exported figure. Escape cancels an unfinished connection, arrow, or calibration without closing the window. Animal, plant, pedigree, Punnett, tree, pathway, and image tools keep separate drafts and undo histories when switching types and across restart. **Insert into note** saves the diagram directly; **Use biology diagram in drawing** adds it to the freehand canvas first. Exported figures omit selection boxes, grids, and canvas zoom/pan.

Biology creates editable animal/plant cells, pedigrees, Punnett squares, phylogenies, pathways, and microscope annotations. For animal and plant cells, use the **Cell part** picker and **Add cell part** to add any of 19 relevant organelles/structures per cell type. Shapes include rough/smooth ER, Golgi apparatus, ribosomes, vesicles, peroxisomes, cytoskeleton structures, and cell-specific parts. Drag diagram elements, edit labels, add connections/arrows, then use the diagram in the drawing and insert it. **Undo biology change / Redo biology change**, Ctrl+Z, and Ctrl+Shift+Z apply to every biology diagram tool. Typing is grouped into actions and a drag is one action. Up to 60 undo actions are kept in the local drawing draft, including across close/reopen and app restart; making a new edit clears redo. Images are shared between undo states instead of duplicated. Inserted figures retain their editable model; a new edit session begins a new undo history. **Edit drawing** restores its editable model. Microscope images are imported from local files. To add a scale bar, enter a known physical distance and unit, then mark its two endpoints in the image. Scale is never inferred from magnification alone. Diagrams are schematic, not inferred biological structures. Inputs and unfinished diagrams are saved locally; AI requests use the explicit online workflows.

## Multiple notebooks

Use the **Notebook** selector in the sidebar to switch notebooks. **New notebook** creates one and **Rename** changes its name. Existing notes start in **Personal notebook**. New and imported documents belong to the selected notebook. To move a document, open **Notebook settings**, choose its destination, and click **Move document**. Switching saves the current note first. A new empty notebook starts with an untitled document.

Notebook names, membership, and the last selected notebook are stored locally in `notebooks.json` and note files under the Glass data folder. Note files, history, and drawings retain their IDs and local storage; moving a document keeps its history. The reference libraries and their custom entries/favorites are shared across notebooks. An unreadable notebook index is backed up and recovered using note memberships.

## Write and format

Use the centered document page like a word processor. Times New Roman, 12 pt is the default. The toolbar includes headings, font family/size, bold, italic, underline, subscript, alignment, lists, and undo/redo. Select text before formatting it, or toggle formatting while typing. Ctrl+= toggles subscript.

Ctrl+M starts an inline equation; Ctrl+Shift+M starts a display equation. Math Symbols covers fractions, integrals (including closed curves and surface flux), evaluation brackets with bounds, roots, subscripts, sums, limits, derivatives, matrices, overbars, vectors, and hats. Tab moves through empty boxes, Shift+Tab moves backward, and Tab after the last box returns to prose. Click bounds or accent contents to edit them. Typing words such as integral in ordinary prose leaves them as words.

The arrow next to Matrix accepts rows × columns, such as 5x4 or 3x3, from 1 to 20 each.

Math Symbols also contains 39 advanced symbols, grouped by logic/sets, algebra/maps, analysis/geometry, order/asymptotics, and proof notation/special alphabets. Examples include quantifiers, infinite cardinals, tensor products, normal subgroups, embeddings, weak convergence, Hodge stars, and exterior products.

**Chemistry Symbols**, beside **Math Symbols**, contains 27 chemistry-specific templates grouped into chemical species, reactions, bonds/electrons, and chemical quantities/cells. These include molecular formulas, polyatomic groups, charged and aqueous ions, coordination ions, isotopes, physical states, radicals, reaction/equilibrium arrows, conditions above and below an arrow, heat/light reactions, gas/precipitate symbols, bond orders, partial charges, Lewis electron pairs, concentration/activity notation, standard reaction energies, and electrochemical cell notation. It does not repeat the math-template menu. Choose a template at the document cursor or inside an existing equation, fill its boxes, and use Tab to continue. The symbol buttons stay together when the toolbar wraps on a smaller window. These are notation templates; they do not balance reactions or validate a chemical structure.

## Export PDF

Use the main **Export PDF** button or Ctrl+Shift+S. Choose a location in the Save dialog. The document name supplies the PDF filename, and the app remembers the last export folder. Export runs locally, creates A4 pages, and includes text formatting, equations, drawings, and page numbers. Wide equations are scaled to fit the page. Unfinished equation boxes are represented as empty squares. An unsupported equation stops export with an explanation instead of creating a broken PDF.

The local note stays editable. PDF export uses a snapshot and does not modify its wording or equations. Export cancellation leaves the note saved locally. A separate background file writer prevents a blocked destination from freezing the editor, and the completed PDF replaces the destination only after generation succeeds.

Import supports Markdown, LaTeX, and text files. Markdown remains an internal interchange and recovery format; the only document export format is PDF.

## Drawings and offline graphs

Click Draw. Use pen, color, stroke width, eraser, undo/redo, and Clear ink. Insert drawing adds it to the note; Edit drawing reopens it. Unfinished drafts are saved locally while drawing and when closing the window, and resume in the same note. Discard draft removes the unfinished copy. Save retries update one inserted drawing instead of creating duplicates. Insert as new drawing recovers an edit draft whose original target disappeared.

Drafts also retain separate inputs for each Cartesian/polar/surface graph mode, each chemistry input mode, and each biology diagram type, including undo histories. A damaged optional biology undo history is isolated and backed up while keeping the valid diagram. Drafts retain unfinished graph equations/ranges and chemistry inputs, view settings, and isomer choices, including inputs that have not yet produced a graph or structure. A damaged draft is backed up before starting fresh. Inserted images keep their original proportions. Changing graph inputs clears the old preview until the new equations are plotted successfully.

Offline graphing supports explicit Cartesian y=f(x), polar r=f(theta), and 3D surfaces z=f(x,y). Enter up to eight equations, one per line. Supported syntax includes powers (^), multiplication (*), pi, theta, sin, cos, tan, sqrt, abs, exp, ln, and log. Angles are radians. Set a range and click Plot equations. Pan/zoom 2D graphs or rotate 3D surfaces. Use graph in drawing, optionally annotate it, and insert it into the note. Graph equations and ranges are kept locally for future editing. Examples can be appended without replacing current equations. Standard or fine sampling is available, and 3D surfaces have independent X and Y ranges. Reset graph view restores the axes/camera after panning or rotating. An equation error identifies and selects its line. Additional functions include min(a,b), max(a,b), pow(a,b), atan2(a,b), cbrt, sign, log2, log10, sec, csc, and cot. Steep continuous lines are kept; discontinuities are estimated by midpoint checks. Graphs are sampled approximations; implicit equations and symbolic solving are not supported.

## Chemistry structures and 3D

Open **Draw → Chemistry**. Enter a common compound name, molecular formula, SMILES, chemical equation, or reaction SMILES and click **Build structures**. The bundled reference works offline; for example, ethanol, benzene, caffeine, or `2H2 + O2 -> 2H2O`. Ambiguous formulas such as C2H6O require selecting a structure, then building again. Reactions retain the entered coefficients and report atom/charge balance; they do not predict products.

Choose **3D molecule** and select a species to generate a rotatable conformer locally. Toggle hydrogens, rotate and zoom, then **Use structure in drawing → Insert drawing**. Both 2D diagrams and 3D snapshots can be annotated, inserted, reopened, and included in PDF export. Structure input, generated coordinates and images stay in the local note. Generated conformers represent one possible geometry, not an experimental crystal or a simulated reaction.

Optional **PubChem lookup** is off by default. Enabling it and building sends unknown compound names/formulas to PubChem; retrieved candidates are cached locally. No note text is sent. Formulas with many isomers should be specified by name or SMILES. Molecular parsing, diagrams and conformers use bundled [OpenChemLib](https://github.com/cheminfo/openchemlib-js); online lookup uses the [PubChem PUG REST API](https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest).

## Reference library

**Math Formulas** contains 258 offline entries from Algebra 1 through multivariable calculus, plus geometry, differential equations, and linear algebra. Search and filter by course/type; review statements, hypotheses, examples, explanations, and pitfalls. Favorite entries, insert editable formulas, and create custom entries.

The adjacent **Chemistry Theorems** button opens 129 offline laws, principles, rules, formulas, definitions, and theorems. Topics span introductory chemistry, atoms, bonding, stoichiometry, gases/solutions, equilibrium, acids/bases, thermodynamics, kinetics, electrochemistry, organic, analytical and inorganic chemistry, quantum chemistry, statistical mechanics, biochemistry, and materials/surfaces. Entries include assumptions, examples, pitfalls, and further-reading links. Scientific laws and approximate models are labeled by type rather than all being called mathematical theorems. Search/filter, favorites, insertion, custom editing, and AI-assisted import work separately for each subject. Copies of built-in references preserve their source links.

Add with AI accepts a name or public HTTPS text/HTML source page and creates reviewable drafts. PDF and image links are not supported by this import tool. Review each mathematical statement before saving it locally.

## AI and photo recognition

AI helper uses the installed Codex sign-in in a separate conversation. Questions send the current note's prose/equations and recent helper messages to OpenAI. Drawing images are represented by a marker and graph equations. Photo to text sends the selected image only when Transcribe photo is clicked. Review and edit the transcription before insertion.

Grammar defaults to a lightweight offline check. Optional Deep review uses Codex and sends compact prose batches. Suggestions are reviewed before applying and preserve equations/code.

## Local storage and recovery

Notes, versions, drawing drafts, conversations, settings, custom library entries, and favorites live under `%APPDATA%\Glass`. Notebook settings → Open data folder opens this location. There is no automatic external note export. Legacy transmission preferences and receipts are ignored and removed from active settings/notes.

The first Glass launch copies existing local Mathdesk notes and library data into the new Glass data folder. The original data folder remains as a backup. Later launches use the Glass folder and do not overwrite it from the old copy.

History provides up to 50 earlier versions, plus archive recovery. Automatic snapshots require substantial changes from the last checkpoint: approximately 250 text edit units, or comparable equation, table/formatting, or diagram changes. Small edits accumulate across saves and restarts, but do not create snapshots merely because time passes. Every edit still autosaves to the current note. A failed save is labeled **Not saved · Ctrl+S to retry**; unsaved edits remain in memory and closing is blocked until saving succeeds. Switching between read/edit views does not mark a note as edited. Restoring a version explicitly preserves the current note first. Existing history is retained. Invalid rich documents, including malformed child nodes or table width metadata, are backed up before recovery from text/equations. Drawing/table HTML imports ignore damaged metadata while preserving readable content and valid images. Unreadable files are retained with a warning. Delete note asks for confirmation and moves the local note to the Windows Recycle Bin. Local notes have a 30 MB serialized size limit, including embedded images and editable diagram data.

## Development

Run `npm ci`, `npm run build`, and `npm start`. The build generates a local MathLive bundle with editable accent bodies, then bundles the document editor. Package with `npm run package -- --icon=icon.ico --asar`.

The post-package step restores the bundled, unmodified Electron launcher rather than shipping a resource-edited executable. Window branding uses the local PNG icon; Windows shortcuts should use the packaged `Glass.ico`. This avoids changing the runtime binary on each content update and leaves Windows Application Control checks in place.

For an existing installation using the same Electron runtime, close Glass and run `npm run install:local`. This installer verifies the staged archive, retries temporary file locks, preserves the previous archive as `app.asar.previous`, refuses to replace a running app, and verifies the installed hash before reporting success. It refuses archive-only updates when the runtime differs; those require a full package installation. It never writes to the notebook data folder.

`npm test` covers local persistence, validation, graph sampling, library storage, and notation compatibility. `node test/pdf-smoke.cjs` checks PDF generation, formatting, cancellation, error handling, and removal of legacy capabilities. Other smoke tests cover document editing, equation bounds, accents, matrices, subscripts, evaluation brackets, drawings, draft recovery, graph races, grammar, and the library.
