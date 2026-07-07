# DailyDocs

The fastest, privacy-first document toolkit. Compress, merge, split, and convert PDFs and
images in seconds — no account, no file storage, no tracking.

## Status: Phase 1 of N

This is the first build-out of a much larger product spec. What's here is fully working, not a
demo — but it's a deliberately small slice so the foundation could be validated before scaling
out to the rest of the tool catalog.

**Implemented:**
- App shell: design system, dark mode, responsive layout, home page with hero + tool grid
- Reusable tool infrastructure: drag-and-drop upload, upload/processing progress, download
  result screen, per-tool local history (stored in `localStorage`, never sent to a server)
- 13 fully working tools, plus a Portal Presets flow (below) covering 9 portals:
  - **Compress PDF** — real image recompression (not just metadata stripping — see note below),
    with India-specific target-size presets (100 KB / 200 KB / 500 KB / 1 MB / best quality)
  - **Merge PDF** — combine multiple PDFs, reorderable before merging
  - **Split PDF** — extract every page, or custom page ranges (delivered as a zip when there's
    more than one output file)
  - **Image to PDF** — combine one or more images (PNG/JPEG/WebP) into a single PDF
  - **QR Generator** — generate a QR code (PNG) from any text or URL, with an in-page preview
    before download
  - **Word to PDF** — convert a `.docx` file to a paginated PDF (see note below)
  - **PDF to Word** — extract a PDF's text *and* embedded images into an editable `.docx`
    (see note below)
  - **PDF to Images** — rasterize each PDF page to a PNG (real rendering via `pdfjs-dist` +
    `@napi-rs/canvas`, not a stub — delivered as a zip when there's more than one page)
  - **Rotate PDF** — rotate every page 90° clockwise, 90° counter-clockwise, or 180°
  - **Convert Image** — convert between PNG, JPEG, WebP, and AVIF
  - **Text to PDF** — flow plain text onto a paginated PDF (shares its layout engine with
    Word to PDF — see `lib/pdf/text-layout.ts`)
  - **Word Counter** — words, characters, sentences, paragraphs, and reading time, computed live
    client-side as you type (see note below — the one tool here with no API route, deliberately)
  - **Batch Rename** — upload any number of files (up to 50), reorder them, and rename them all
    at once with a sequential pattern (e.g. `Certificate-1.pdf`, `Certificate-2.pdf`, ... or
    `Semester-01.pdf`, `Semester-02.pdf`, ... with zero-padding) — a live preview shows the first
    few resulting filenames before you commit; content is untouched, only the name changes
  - Each tool with a file to process/produce has a real Next.js API route doing real file
    processing; unit tests (Vitest) cover all processing logic and file validation, plus component
    tests for the shared upload/progress components

> Batch Rename wasn't in the original product spec's tool list — it was requested afterward as a
> genuinely useful addition (bulk-uploading scans/certificates and renaming them to a clean
> sequence). Added the same way as everything else: real API route, real tests, live on the home
> page — not bolted on differently just because it came later.

**Portal Presets** (`/portal-presets`): instead of hunting down "what size does my photo need to
be for Passport Seva," pick the portal and upload photo/signature/documents once. One request runs
the whole pipeline — resize + compress to the exact byte window, convert scans to the right
format, strip blank pages, apply a real (if modest) scan-quality enhancement — and returns a zip
plus a per-file requirements checklist (`requirements-check.txt` inside the zip, and shown
immediately in the UI). Linked from a banner on the home page; doesn't touch the existing tool
grid.

9 presets, each with real numbers researched from current official/authoritative sources (cited
per preset, in `lib/portal-presets/presets-config.ts`, and shown on each preset's page):
**Passport Seva, UPSC, SSC, IBPS, RRB, JEE Main, NEET, CUET**, plus **Custom / Other Portal** for
anything without one canonical spec (State PSCs, university admissions, scholarships all vary too
much by institution to hardcode — Custom lets you type in whatever the portal states instead of
guessing or fabricating numbers for it). Every preset page shows a persistent disclaimer:
**requirements can change — always confirm against the current official notification before
submitting.**

Three new processing primitives power this, on top of what already existed:
- `lib/image/compress-to-target.ts` — binary-searches JPEG quality to land inside an exact
  `[min, max]` byte window (most photo/signature specs are a range, not just a ceiling).
- `lib/pdf/remove-blank-pages.ts` — rasterizes each page (reusing the PDF to Images pipeline) and
  drops pages with near-zero ink coverage; never drops every page even if all register as blank.
- `lib/image/enhance-scan.ts` — real contrast-stretch + light sharpen (`sharp().normalize()` +
  `.sharpen()`), not oversold as AI enhancement; only applies to raw image uploads, not images
  already embedded in an uploaded PDF (documented limitation, same reasoning as Compress PDF's
  scope note).

**Not yet built** (present in the full product spec, deferred to later iterations):
- The remaining ~22 tools listed in the spec (delete/reorder pages, compress/resize image, the
  WiFi/vCard/email QR variants, JSON/Base64/case-conversion text tools) — these are already
  registered in `lib/tools-config.ts` with `available: false` and show as "Soon" on the home page,
  so adding each one is just: write the processing function, the API route (if needed), and the
  page
- A separate FastAPI backend (this phase uses Next.js API routes only)
- Docker, GitHub Actions CI/CD, deployment guides
- PWA/offline support, i18n, search/favorites/pinned tools
- Privacy-friendly analytics, virus-scanning hooks, rate limiting
- OCR, AI features, digital signatures, developer API (future premium features)

### A note on "Compress PDF"

`pdf-lib` alone only rebuilds a PDF's internal structure (compressed object streams, stripped
metadata) — a few KB at best, which isn't a meaningful reduction for typical scanned/photographed
PDFs where nearly all the size comes from embedded images. `lib/pdf/compress.ts` goes further: it
walks each page's Image XObjects, decodes them (JPEG or simple raw/FlateDecode 8-bit Gray/RGB
samples), recompresses them via `sharp` at a lower JPEG quality and capped resolution, and swaps
the XObject reference — explicitly deleting the orphaned original image object, since `pdf-lib`
does not garbage-collect unreferenced objects on save.

When a target size (100 KB/200 KB/500 KB/1 MB) is requested, it walks a quality/resolution ladder
from mild to aggressive, re-running from the original input at each step (JPEG quality loss
doesn't compound well across passes), and returns as soon as one attempt lands under the target —
or the smallest it could achieve, flagged via `targetMet: false`, if none do.

**Scope**: this handles the dominant real-world case — pages saved as JPEG (which is what phone
scanning apps like Adobe Scan/CamScanner/Office Lens produce) and simple uncompressed Gray/RGB
raster data. It deliberately leaves untouched anything riskier to reprocess automatically:
1-bit/bilevel scans (CCITT/JBIG2 fax-style compression, where JPEG re-encoding usually makes
files *larger* and introduces artifacts on text), indexed-color palettes, CMYK raw samples,
JPEG2000, and any image with a transparency mask — those pass through unchanged rather than risk
visibly corrupting them.

### A note on "Word to PDF"

`lib/office/word-to-pdf.ts` uses `mammoth` to extract the `.docx`'s plain text (paragraph by
paragraph), then flows that text onto A4 pages itself via `pdf-lib` (measuring and wrapping lines
with `font.widthOfTextAtSize`, paginating when a page fills up). This is a real, working
conversion for the common case — resumes, assignments, forms, applications — but it is a text-flow
reconstruction, not a pixel-perfect layout conversion: bold/italic, headings, tables, images, and
custom fonts from the original document are not preserved, since `mammoth.extractRawText` discards
them. True layout-faithful conversion needs LibreOffice or a headless browser, both of which are
heavy binary dependencies deliberately avoided here to keep the tool a plain Node dependency that
runs anywhere Next.js does. Only `.docx` (OOXML) is supported — legacy binary `.doc` files are not,
since `mammoth` doesn't read that format.

### A note on "PDF to Word"

The reverse conversion, `lib/pdf/to-word.ts`: extracts each page's text via `pdfjs-dist`
(`page.getTextContent()`) **and** its embedded raster images via `lib/pdf/extract-images.ts`
(walking each page's Image XObjects with `pdf-lib`, the same low-level approach `compress.ts`
uses), then writes both into a real `.docx` via the `docx` library — text first, then that page's
images, page break, repeat. Same honest trade-off as Word to PDF, mirrored: content is preserved,
not original layout — images land after their page's text rather than at their exact original
position, and reading order for multi-column/table-heavy PDFs can come out jumbled, since PDF text
has no inherent paragraph/reading-order structure. Image extraction shares `compress.ts`'s scope
limits: JPEG and simple 8-bit Gray/RGB raw/FlateDecode samples are extracted; 1-bit scans, indexed
palettes, CMYK raw samples, JPEG2000, and transparency-masked images are skipped rather than risked.

### A note on "PDF to Images"

`lib/pdf/to-images.ts` does real page rasterization — it renders each page to actual pixels via
`pdfjs-dist` (Mozilla's PDF.js, running its Node/"legacy" build) onto an `@napi-rs/canvas` surface,
then encodes each as PNG. This was a deliberate choice over the simpler-looking alternative,
`mupdf` (a WASM PDF renderer with no native-build risk): `mupdf`'s license is AGPL-3.0, whose
network-use clause would likely require releasing DailyDocs's full source if used server-side in a
product. `pdfjs-dist` (Apache-2.0) + `@napi-rs/canvas` (MIT) avoids that entirely, at the cost of
needing a native binary (prebuilt binaries worked fine in this environment, but could require a
build step on an unusual deployment target). Capped at 60 pages per document to bound worst-case
memory/CPU use in this phase.

> **Why `@napi-rs/canvas` and not the classic `canvas` (node-canvas) package?** They were tried in
> that order. `canvas` renders vector content (text, shapes) correctly, but pdfjs-dist v6's image
> drawing internals (`drawImageAtIntegerCoords`) do a type check that `canvas`'s `Image`/`Canvas`
> objects don't satisfy — real embedded raster images either threw `TypeError: Image or Canvas
> expected` or were silently skipped, rendering blank where a photo/scan should be, while the rest
> of the page looked fine. `pdfjs-dist`'s own internal Node canvas factory (`NodeCanvasFactory`, in
> its shipped type declarations) is built against `@napi-rs/canvas` specifically — switching to it
> fixed embedded images with no other code changes. Covered by a regression test in
> `tests/lib/pdf-to-images.test.ts` that renders a real embedded JPEG and asserts the output pixels
> actually match it, not blank/white.

### A note on "Word Counter"

Every other tool follows the same shape: upload → API route does the work → download result. Word
Counter deliberately doesn't. Counting words/characters/sentences in text the user is actively
typing is near-instant, pure computation with no privacy or heavy-compute reason to leave the
browser — round-tripping every keystroke to a server would just add latency for no benefit. So
`lib/text/word-stats.ts` is a plain, isomorphic function; `features/word-counter/use-word-counter.ts`
calls it client-side via `useMemo` on every keystroke, and there's no `app/api/tools/word-counter/`
route at all. It still uses the shared `ToolLayout` shell for a consistent page structure, just not
`FileDropzone`/`ProgressIndicator`/`DownloadResult`, since there's no file to upload or download.

### A note on "Batch Rename"

Every other file-upload tool restricts input to a specific type (PDFs, specific image formats,
`.docx`) via each `ToolConfig`'s `accept`/`acceptMime` lists. Batch Rename accepts *any* file —
renaming doesn't care what's inside the file. That exposed a real gap in `lib/file-validation.ts`:
`validateFile` treated an empty `accept`/`acceptMime` pair as "nothing matches, reject everything"
rather than "no restriction," which would have made this tool reject every file uploaded to it.
Fixed by treating both-empty as explicitly unrestricted — every existing tool still specifies
real accept lists, so this only changes behavior for a tool that had none before now.

`lib/files/batch-rename.ts` separates the (pure, isomorphic) naming logic from the
buffer-handling wrapper: `buildFileName(originalName, index, options)` takes just a filename
string and is safe to import client-side for the live preview shown before you commit, while
`buildRenamedFiles` (server-side only) pairs that naming logic with actual file bytes. Ordering
for the sequence comes from the file list's current order in the UI, which reuses the same
up/down reorder controls already built for Merge PDF. Capped at 50 files (`MAX_FILES_BATCH_RENAME`
in `lib/constants.ts`) — comfortably above the 30-file example that motivated this tool.

### A note on "Portal Presets"

**On accuracy**: every photo/signature spec was cross-checked against at least two current
sources per portal (cited on each preset's page and in `presets-config.ts`) as of the
`lastVerified` date (2026-07). Where sources disagreed slightly (RRB's photo size range varies
±20KB depending on the source), the more commonly cited figure was used and the discrepancy noted
in a code comment. Government/exam portals republish specs with each notification cycle — a number
that's right today can drift. That's why every preset page carries a persistent "confirm against
the current official notification" disclaimer rather than presenting these as permanently
guaranteed-correct.

**A real bug this caught during live testing** (not just unit tests): the first blank-page-removal
threshold (0.4% non-white pixel coverage) was too aggressive — it flagged a real page containing
just one short line of text ("Back side of card") as blank, because a single line of small text
covers well under 0.4% of a page's total pixels. Caught by generating an actual 3-page test PDF
(cover page, genuinely blank page, back-side page with real text) and running it through the live
API rather than trusting synthetic unit tests alone. Fixed by dropping the threshold to 0.03% —
low enough to still reliably catch pages where literally nothing was drawn, but no longer
mistaking "sparse" for "blank." Re-verified against the same test PDF plus the full test suite.

**Scope**: State PSC / university admission / scholarship portals don't get fixed presets because
there genuinely isn't one spec to hardcode — each state/institution sets its own numbers. The
Custom preset runs the identical pipeline (`lib/portal-presets/process-package.ts`) against
user-entered targets instead of fabricating numbers for portals that don't have one canonical
answer. Enhancement only applies to raw image uploads, not images already embedded in an uploaded
PDF — see the "PDF to Word" note above for why that's a separate, more invasive operation
(`compress.ts`'s object-walking approach) that's out of scope here.

## Tech stack

- **Framework**: Next.js 16 (App Router), TypeScript
- **UI**: Tailwind CSS v4, shadcn/ui, Framer Motion (available, used sparingly), lucide-react
- **Forms/validation**: React Hook Form + Zod (Split PDF, QR Generator, Rotate PDF, Convert Image,
  Text to PDF, Batch Rename pages)
- **File processing**: `pdf-lib` (PDF create/merge/split/rotate/image extraction), `sharp`
  (images), `jszip` (multi-file downloads), `qrcode` (QR generation), `mammoth` (.docx → text),
  `pdfjs-dist` + native `@napi-rs/canvas` (PDF page rasterization), `docx` (.docx generation) — all
  running server-side in Next.js Route Handlers (`runtime = "nodejs"`), entirely in memory, except
  Word Counter which runs its (isomorphic) logic client-side only
- **Testing**: Vitest + React Testing Library

> The spec allowed Next.js 15 or later; `create-next-app` installed the current stable 16.x,
> which is a drop-in superset of the App Router APIs the spec describes.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run test` | Run unit/component tests once |
| `npm run test:watch` | Run tests in watch mode |

## How uploads work (privacy)

Every tool's API route reads the uploaded file(s) into memory (`Buffer`), processes them, and
streams the result straight back in the HTTP response. Nothing is written to disk and there is no
database — so "auto-delete" is trivially true: there is nothing to delete. This also means every
API route must run on the Node.js runtime, not the Edge runtime, since `pdf-lib`/`sharp` need
Node APIs.

## Project structure

```
app/
  page.tsx                  # home page
  tools/<slug>/page.tsx     # one page per tool
  api/tools/<slug>/route.ts # one route handler per tool
components/
  ui/                       # shadcn/ui primitives
  layout/                   # header, footer, theme toggle
  tools/                    # shared FileDropzone, ProgressIndicator, DownloadResult, ToolLayout, RecentHistory
  home/                     # hero, tool grid, trust badges
features/<slug>/            # per-tool client hook wrapping the shared upload/progress state machine
hooks/                       # use-file-upload, use-tool-history, use-tool-processor, use-mounted
lib/
  tools-config.ts            # single source of truth for every tool (including unbuilt ones)
  pdf/ image/                # server-side processing logic
  zip.ts api-response.ts file-validation.ts filename.ts upload-client.ts
tests/                        # Vitest unit + component tests
```

Adding tool #31: add a `pdf/` or `image/` processing function, an API route that validates input
and calls it, a feature hook wrapping `useToolProcessor`, a page using `ToolLayout` +
`FileDropzone`, and flip `available: true` in `lib/tools-config.ts`.
