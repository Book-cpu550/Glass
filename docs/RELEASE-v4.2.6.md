# Glass v4.2.6

Glass can now graph implicit equations in two and three dimensions without solving for one variable first.

- Choose **2D · Implicit equation** for circles, sideways parabolas, hyperbolas and other curves, such as `x^2+y^2=9` or `y^2=x`.
- Choose **3D · Implicit equation** for surfaces, such as `y^2=x^2+z^2` or `x^2+y^2+z^2=9`.
- Independent X, Y and Z ranges include negative values. The cone equation displays both positive and negative Z and both halves along Y.
- Cartesian and explicit surface modes recognize implicit input and switch automatically where needed. Explicit square roots retain their written branch.
- Rotate, pan and zoom inserted 3D surfaces; save the view and reopen it later. Curves and surfaces remain available in exported graph images and documents.
- Graph drafts retain the new modes, ranges and per-mode equation inputs. Fine sampling offers extra detail.

Graphs are numerical approximations within the selected bounds. Small components, isolated points and roots that only touch zero between sample points can be missed. Check discontinuities and increase sampling or adjust the bounds when needed.

Validation: 116 unit tests, including equation residual checks, positive/negative branches, singularities and invalid ranges; isolated application checks for mode detection, real mesh rendering, mouse rotation, graph insertion, saved views, restart persistence and image export. Release builds repeat the packaged graph checks.

This release contains application source and bundled runtimes. Personal notes, accounts, credentials and local application data are excluded.
