# Glass v4.2.5

- Rotate supported MATLAB-compatible 3D plots directly in the output area. Drag to rotate, scroll to zoom, pan, reset the view, or switch back to the original image. Surface, mesh, 3D line and scatter plots retain their geometry and axis labels; the original image remains available for exact styling.
- Make the console larger by default, with vertical resizing and an Expand console button.
- Make JavaScript, Python and MATLAB coding notes treat new typing and pasted text as code automatically. Remove Add code, preserve code formatting after clearing the paper, carry indentation, and dedent blank lines safely.
- Add code syntax colors, line numbers, a cursor position, Go to line, clearer runtime details and clickable error locations. Stale error links ask for a fresh run after code changes.
- Use signed-in account usernames automatically in shared documents, including after joining, reconnecting, switching accounts or signing out. Signed-in display names follow their account username. Account usernames are unique without regard to capitalization.
- Strengthen document history with named versions, side-by-side formatted previews, change highlights, passage copying/recovery and safety versions before full restoration.
- Simplify navigation by grouping reference libraries, advanced filters and specialized tools while keeping everyday document controls accessible.
- Improve live writing review with spelling, grammar, punctuation, optional clarity and tone suggestions, explanations, category filters, and accept/dismiss controls. Filtered bulk corrections apply only the visible category.

## Validation and compatibility

111 unit tests passed. Real application checks cover the supplied MATLAB surface example, mouse rotation, labels/grid, console sizing, code typing/pasting, all three runtimes, exact source exports, AI code fixes, sharing names, undo and history recovery. Packaged-build checks also passed.

MATLAB-compatible notes run using bundled GNU Octave, rather than the proprietary MathWorks MATLAB engine. Interactive output supports bounded single-axis geometry (up to 50,000 points); complex figures and multiple subplots retain their original still images. Python includes its core standard library; third-party packages and MATLAB-specific toolboxes are not bundled.

## Downloads and privacy

Install Glass-Setup-4.2.5.exe, or extract the entire Glass-v4.2.5-win32-x64.zip and run Glass.exe. Verify downloads against SHA256SUMS.txt. The installer is unsigned. Existing notes stay in the local app-data directory.

Downloads contain application code, public assets and runtime dependencies. Personal notes, attachments, AI conversations, settings, account sessions, credentials, backups and development scratch files are excluded.
