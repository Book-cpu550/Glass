# Glass v4.2.4

- Add JavaScript, MATLAB-compatible and Python coding notes directly on the paper, with Run/Stop, console output and language-aware AI help.
- Bundle GNU Octave 11.3.0 and CPython 3.15.2 for local execution. Python includes its core standard library; MATLAB-specific toolboxes and third-party Python packages are not bundled.
- Export JavaScript as source or an offline runnable HTML playground, MATLAB as .m, and Python as .py.
- Replace the New note arrow with a single dropdown for all four note types.
- Add notes-and-files search across notebooks and remove the Ctrl K Search Glass command.
- Add formatted document-history previews and equation-aware version comparisons.
- Render equations in the AI question preview, while keeping the original question editable.
- Fix PDF preview and export of second derivatives using the editor's double-prime notation.
- Fix scoped notebook backup isolation and chemistry LaTeX package declarations; refine navigation buttons and reliability.

## Validation and privacy

104 unit tests passed. Real application checks cover PDF preview/export and coding-note behavior. Packages contain application code, public assets and runtime dependencies. Personal notes, attachments, AI history, settings, credentials, backups and development scratch files are excluded.

Windows downloads: install Glass-Setup-4.2.4.exe, or extract the entire Glass-v4.2.4-win32-x64.zip and run Glass.exe. Verify downloads against SHA256SUMS.txt. The installer is unsigned. Existing notes remain in the user's local app-data directory.
