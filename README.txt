MAXIMILIAN FONA / PORTFOLIO VOL. 02

OPEN THE WEBSITE
Open index.html directly in a browser, or upload this whole folder to a static
website host. No installation, account, framework, or build step is required.
The standalone Maximilian-Fona-Portfolio.html embeds all styles, scripts, and
the original resume PDF. It is ready to use by itself, including offline.

WHAT IS NEW
- Oversized typography, an ink and mint palette, and a complementary light theme.
- A draggable wireframe sculpture with three forms: knot, orbit, and wave.
- Original interface illustrations and detailed project dialogs.
- Category and technology search, grid/list views, and saved projects.
- A request playground with endpoint selection, token checks, and 200/401 flows.
- A playable wallet concept in the Mock Venmo project, with fictional payments.
- A command menu: press Command/Ctrl K or / to navigate, find a project, download
  the resume, open saved projects, switch themes, or choose a random project.
- Expandable experience, linked skill chips, scroll progress and section tracking.
- Actual canvas and layout-shift observations under "Under the hood".
- The original local project notebook, with edit, delete, undo, and JSON export.

EDITING THE SITE
index.template.html  Main page content and structure
projects.js          Resume-aligned project data used by the cards and dialogs
lab.html             Request playground markup
notebook.html        Local notebook markup
styles.css           Layout, themes, responsive behavior, and visual artwork
preferences.js       Applies saved appearance and motion before the first paint
script.js            Navigation, projects, search, saved items, and dialogs
sculpture.js         Canvas geometry, interaction, and animation lifecycle
lab.js               Simulated request journey
wallet.js            Simulated payments, validation, and in-memory activity
notebook.js          Local notebook using the original storage format
build.mjs            Optional build script using only built-in Node.js modules
Maximilian-Fona-Resume.pdf  Original supplied resume, unchanged

After editing templates or project data, run "node build.mjs" in this folder.
It updates index.html and the standalone Maximilian-Fona-Portfolio.html. There
are no packages to install. Editing index.html directly also works, but a later
build will replace it with the templates.

ACCURACY AND DEMOS
Resume details remain the source of truth. Certifications are listed as in
progress. The project artwork is original concept artwork, not screenshots of
the original products. The request playground and wallet run entirely in the
browser; all responses, recipients, and wallet funds are fictional. They are
not live backend services or real payment integrations. The wallet resets on
reopening. No project repository URLs were invented; GitHub links to the real
profile. There is no analytics, tracking, or external asset request.

STORAGE AND ACCESSIBILITY
Saved projects and notebook entries stay in the current browser and origin.
Storage varies for file URLs. Export notebook entries before changing devices,
origins, browsers, or clearing data. The notebook keeps its previous storage
key and data format; it does not publish changes. Corrupt or unavailable storage
falls back to temporary memory without overwriting unreadable saved data.

Essential portfolio content and resume downloads are available without scripts.
Motion honors the operating system setting, with an additional pause control.
The canvas caps resolution and frame rate, and stops when hidden or offscreen.
Keyboard focus, Escape, mobile navigation, and native dialogs are supported.
