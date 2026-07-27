# Selection Mask authoring

`image.local_selection_mask@0.1.0` creates a pixel mask from one bound Image
Block without changing the source image.

The editor is separate from Retake Annotation:

- Annotation is a semantic instruction surface. Its composite, marker intent,
  and normalized geometry help a model understand what to change.
- Selection Mask is a deliberate pixel-selection surface. Its PNG is the
  authoritative output and may be reused by image, video, or slide workflows.

The first version provides add and erase brushes, source-pixel brush sizing,
undo, redo, clear, and invert. It always renders at the exact source dimensions
and uses `grayscale_white_selected_v1`:

- white pixels are selected;
- black pixels are unselected;
- the file is an opaque PNG with no provider-specific alpha convention.

Provider Adapters may derive their native mask representation from this output.
Provider-specific polarity, alpha, multipart fields, or request options must not
be written back into the generic Image Asset.

Mask authoring uses Canvas 2D and the existing `host.execution.run` boundary.
It does not need a local bridge, filesystem access, or a new Host API. A future
local AI Edit capability will bind both a source image and a Selection Mask.
That consumer—not Mask authoring—will decide whether Retake needs a single
high-level provider execution command or P4.4 Bridge support for a local Codex
login.
