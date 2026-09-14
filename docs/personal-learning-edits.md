# Personal learning edits

The notes page and Learn in App readers share 12 marker colors, direct Highlight, Unhighlight and Delete controls. Thumbnail cards do not contain these controls. On the notes page, use the page toolbar to edit card content. In readers, use the header toolbar.

The palette is closed by default. Click Highlight to open it, then choose a color to paint selected text or hold the left mouse button and drag over words. The palette closes after choosing. Releasing the left mouse button ends the stroke and restores the normal pointer. Choose Highlight or Unhighlight again for another stroke; Escape also cancels either tool. To delete text, stop the marker, select text, then press Delete. Select highlighted text and press Unhighlight to remove its color, including part of a longer highlight. Choosing another color recolors selected text. Unhighlight also activates an eraser when no text is selected: hold the left mouse button and drag over highlighted text. Hovering without pressing does not edit text. Press Escape to leave either mode before selecting text to delete. There is no Saved edits panel.

Edits belong to the signed-in account and do not change the shared source lessons. Content keys combine technology, language and lesson title. Quote anchors include position and surrounding text so the same passage can be restored across supported learning views. Changed or ambiguous passages are not matched to unrelated text. Code and existing React text nodes remain structurally intact.

## Account storage

`/api/learning-marks` authenticates every request and derives the owner on the server. A private Supabase Storage bucket named `learning-marks` is provisioned automatically using the app's existing service credentials. No additional SQL migration is required. Each mark is a JSON object under an encoded owner folder, with a UUID filename. The bucket has no public URLs and no client access policies. Do not make it public or add broad client policies.

Separate objects avoid overwriting unrelated edits from concurrent tabs. Marker strokes are saved in bounded batches; partial failures retain unsaved previews and offer Retry saving. Selection deletion changes the visible text only after the server confirms a save. A failed deletion preserves the original text. The UI clears personal edits when the account changes and ignores responses from an earlier session. Focus and cross-tab notifications reload saved edits.

There is no expiration of saved edits. Unhighlight updates or removes the corresponding account highlights. Deleted text stays hidden in that account. Storage lifecycle policies must not expire these objects. Provisioning requires the existing `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; the browser never receives the service key.

## Abbreviations

`lib/abbreviations.ts` is the shared glossary. Prose renders full forms as pastel pills without parentheses, with semantic `abbr` titles. Reader contents/navigation panels keep short names. Code, URLs and input values are preserved. Unknown or ambiguous terms should be reviewed before adding a definition; brand names without expansions must not be given invented full forms.

Focused tests cover text anchors, native selection, drag painting and erasing, account isolation, private object paths, save failure, persistence, partial unhighlighting, and abbreviation rendering.
