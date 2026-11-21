# Glass v4.2.3 — feature and validation notes

See [release notes](RELEASE-v4.2.3.md) and the [interactive notes guide](INTERACTIVE-NOTES.md) for this version.

- **Draw → Math graphing → 2D vector field / 3D vector field:** type `F(x,y) = i + (1/2)j` or `F(x,y,z) = -y i + x j + z k`. A formatted equation preview shows bold vector notation and stacked fractions. Use explicit multiplication between variables, e.g. `x*y`. Components can use the ordinary offline graph functions. Each mode retains its own inputs. Choose standard/fine arrow density, independent axis ranges, and optionally equal-length direction arrows; hover for original components and magnitude. Drag a 3D view to rotate. Use graph in drawing, then Insert drawing; Edit drawing reopens its model.
- **Physics Symbols:** 64 notation/formula entries, grouped by mechanics, thermodynamics, waves/optics, electromagnetism, and modern physics.
- **Physics Reference:** 48 locally stored formulas, laws, principles, definitions, and theorems, with conditions, examples, pitfalls, and further-reading links. Search, favorite, insert, copy, edit/save a local copy, or prepare a reviewed AI-assisted entry.
- **Draw → Physics graphing:** dedicated tab for projectile or falling-object simulations. Choose 2D or 3D motion, with or without quadratic air resistance. Compare drag and vacuum trajectories together. In 3D, X/Y are horizontal and Z is height; set launch elevation/direction and independent X wind/Y crosswind, then drag to rotate. Plot trajectory, speed/time, height/time, or drag/air-relative speed in SI units. Inserted plots retain their editable settings and camera. The solver stops at flat ground, assumes constant parameters, and excludes lift, buoyancy, and gusts. Extreme stiff inputs are rejected with an explanation.
- Axis ranges are grouped into aligned X, Y, and Z panels with paired from/to fields; the layout stacks on narrow screens.
- **Draw → Chemical structures:** build from a known name, resolved formula/isomer, SMILES, or entered reaction. Predicted shape panels report local VSEPR geometry, lone pairs, and approximate angles. The existing rotatable generated conformer can be inserted into a note. Water, ammonia, methane, carbon dioxide, ethene, ethyne, BF3, and SF6 are among the checked examples. Ambiguous formulas still require a structure choice; products are not inferred from incomplete reactions. Resonance-sensitive, radical, ionic, and unsupported centers are qualified rather than assigned an unjustified shape. Ball-and-stick colors identify elements and are distinct from actual substance appearance.

These tools work offline with bundled structures and formulas. An unknown compound name still needs a specified SMILES structure or the optional requested PubChem lookup.

Validation: 75 unit tests; dedicated physics-tab UI checks for 2D/3D drag and vacuum plots, comparison curves, insertion/restart, and aligned axis controls; UI checks for vector rendering/capture/editing, physics simulations and units, draft recovery across restart, physics symbol/reference operations, chemical shape panels, and 3D insertion; existing graph-workspace and chemistry workflows also passed.

## Reliability and graph usability refinements

- Graph Undo/Redo retains full mode drafts instead of clearing other modes. Edits keep the actual 3D camera, including mouse gestures. Reset view uses the appropriate 2D/3D API.
- DOI and URL metadata refreshes retain the original citation ID when editing a saved source.
- Physics ignores irrelevant drag, crosswind, and launch inputs. Mass remains visible for energy calculations. Invalid advanced fields expand and receive focus.
- Math sampling/examples and physics air/wind/gravity settings are collapsible. Physics includes projectile, falling-object, 3D crosswind, and vacuum presets plus a reset-settings button; Reset graph view is visible in both tabs.
- Each simulation shows a numerical comparison table: elapsed time, flight time to ground, horizontal displacement, maximum height reached, impact/end speed, and mechanical/kinetic/potential energy. A mechanical-energy/time view is available. Results describe the simulated interval and do not claim impact when the time limit ends before ground contact.
- Inserted 3D surfaces, vector fields, and physics trajectories have an **Interact with 3D graph** button. Rotate, Pan, scroll to zoom, Reset view, and Done work directly in notes, including temporary exploration in Read view. **Save view** commits the camera and a new still image for notes/PDF output, preserving ink strokes. Saving requires edit access. Rendering starts on demand, only one inline graph stays active, and removed nodes cancel pending work.

Additional validation: 79 unit tests; UI regressions for all four reported bugs, actual mouse rotation/panning/zoom, inline 3D graph types, saved-camera/image persistence, ink preservation, read-only permissions, and node removal during rendering.

## Interactive notes and navigation

All twelve requested improvements are implemented. See INTERACTIVE-NOTES.md for the user guide: cursor insertion and command search, foldable sections/outline, focus/selection formatting, equation sliders and linked source equations, Cartesian graph inspection, physics playback with normalized direction arrows, biology explanations/quiz, inline molecule measurements, local flashcards with review scheduling, and collaboration presence/delivery feedback. No hosted service deployment is needed for the feedback changes; the existing persisted encrypted echo acknowledges updates.

Validation adds four algorithm/storage tests (83 total), productivity and science end-to-end workflows, and presence/delivery/offline assertions in the real relay integration test. Existing graph, citation, inline 3D, PDF, and drawing-recovery regressions remain part of verification. Interactive work is local; optional collaboration is online.
