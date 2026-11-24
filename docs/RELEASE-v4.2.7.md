# Glass v4.2.7

One automatic graphing tool with note-style equation editing, parametric surfaces, restored colors and no equation-count cap.

- Type directly in the same editable MathLive equation fields used by notes. Powers, fractions and roots appear where you type. Enter adds another equation; individual equations can be removed. An optional **Edit LaTeX source** panel supports pasting or editing source.
- Glass detects 2D curves, implicit 2D equations, polar graphs, explicit and implicit 3D surfaces, parametric surfaces, and 2D/3D vector fields automatically. There is no graph-type selector to manage.
- Parametric surfaces accept `r(u,v)=<u,v-u,-v>`, the equivalent `r(u,v)=u i+(v-u)j-v k`, or `x=u, y=v-u, z=-v`. LaTeX angle brackets, bold vector notation and aligned coordinate equations also work. Independent **U** and **V** ranges control the parameter domain.
- The former eight-equation and 24-input-row limits are removed. Many equations can be plotted together; larger legends scroll rather than taking over the graph.
- Explicit, implicit and parametric surfaces use blue-to-red shading. Rotate, pan, zoom, reset and save inserted parametric surfaces. Saved views, parameter ranges, equation source and drafts survive restarting Glass; graph images and PDF export retain the colors.
- Examples share one menu and load directly into the formatted equation editor.

For an existing blue graph, choose **Interact with 3D graph**, then **Save view** to refresh its stored image with the restored colors.

LaTeX arithmetic includes fractions, powers, roots, grouping, common functions, constants and absolute values. Unsupported commands or incomplete input produce errors rather than silently changing the equation. Symbolic placeholders such as x(u,v) must be replaced by actual coordinate expressions before graphing.

Validation: 129 unit tests passed. Application checks cover actual keyboard typing in the formatted editor, superscripts, fractions, equation rows, vector parametric notation, 41 simultaneous equations, all eight detected math graph types, red/blue pixels in PNG export, rotation, saved views, restart persistence and PDF export. Release builds repeat these checks against the packaged app.

Graphs are sampled approximations. Fine sampling and large equation collections require more memory and processing time. Check behavior near discontinuities.

Release builds contain application source and verified bundled runtimes. Personal notes, accounts, credentials and local application data are excluded.
