# Annotation editing

`image.annotation_edit@0.3.0` turns visual marks and written intent into one
provider-neutral, connected image-edit request.

## User flow

1. Select an Image Block and choose **Annotate image**.
2. Add numbered markers, directional arrows, freehand pen lines,
   semi-transparent region brushes, rectangles, or ellipses.
   Zoom as needed, switch to Select, drag the enlarged canvas to pan, and
   double-click the canvas to return to the default 100% view. Double-click
   reset is intentionally limited to Select so drawing tools do not create an
   accidental mark before the second click.
3. Write an instruction for each mark, or add one global instruction that
   applies to all marks.
4. Review the manual edit scope, choose whether the product, logo, and text are
   protected, and confirm the task summary. These choices are frozen into the
   execution manifest and compiled prompt.
5. Choose a compatible Retake image Connection and request one to four
   candidates.
6. Choose **Done** to run the edit. Retake creates the Operation, Execution, result Blocks,
   durable Assets, edges, and Board History.

**Cancel**, the close button, and `Escape` save the current bound draft and
leave without creating an Execution. Once **Done** has started the connected
execution, close and cancel controls remain disabled because Host API V2 does
not expose execution abort through the Plugin panel contract. A start failure
keeps the panel, marks, instructions, protected-content choices, and draft open
for retry.

The source image remains unchanged. The provider receives the clean source, an
exact-size PNG composite containing the visible marks, a normalized geometry
manifest, and a compiled prompt that requires a clean result without editor
marks.

## Draft and history behavior

Current-image authoring state is stored through
`host.drafts.saveBound` under the PluginModule and Capability identity. Draft
saves do not create Board History entries. The draft is discarded when its
recorded source Asset no longer matches the Image Block.

Undo and redo inside the open panel are local authoring history. Running the
Capability is the durable boundary: Retake creates one normal Board History
event for the connected execution.

A historical `image.annotation_edit` Operation can expose **Reopen annotation
edit**. That session starts from the immutable execution manifest and input
Assets, and does not overwrite the current source Block draft.

## Host boundary

Image Studio owns:

- annotation tools, hit testing, zoom, pan, local undo and redo;
- normalized geometry and per-mark or global intent;
- manual edit scope, protected-content choices, clean-output mode, and task
  summary;
- bounded draft parsing and prompt compilation;
- exact-source-size composite rendering;
- Connection and candidate-count controls.

Retake owns:

- the bound source Block and Asset scope;
- same-session composite Asset import;
- Connection credentials and provider transport;
- Operation, Execution, result projection, persistence, and Board History;
- historical Operation context and locale/environment subscription.

The Plugin uses `host.execution.runConnected`; it does not receive provider
tokens, local paths, private stores, or arbitrary canvas mutation.

## Limits

One session supports at most 256 marks and 8,192 points per pen or brush path.
Source images are limited to 8,192 pixels per side and 32 megapixels for
browser Canvas safety. Instructions are limited to 32,000 characters.
