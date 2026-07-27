# AI image expand

`image.outpaint@0.1.0` expands an image onto a larger target canvas through a
Retake image Connection. Image Studio owns the visual composition; Retake owns
execution, persistence, result projection, and History.

## Interaction

Select one Image Block and choose **Expand image**. The panel provides:

- `1:1`, `4:3`, `3:4`, `16:9`, and `9:16` target ratios;
- 100–200% expansion with a 125% executable default;
- pointer drag, arrow-key movement, and nine source anchors;
- exact target dimensions before execution;
- an optional instruction, Connection selection, and one to four candidates.

The source always keeps its natural pixel size. Positioning changes only its
integer `sourceX` and `sourceY` inside the target; it never scales, crops, or
rotates the source.

## Execution inputs

Before `host.execution.runConnected`, the Plugin imports two hidden Assets:

1. `outpaint_guide`: a target-size transparent PNG with the source placed at
   the frozen rectangle;
2. `inpaint_mask`: a target-size opaque PNG using
   `grayscale_white_expand_v1`—black for the protected source rectangle and
   white for the area to generate.

The source Block, guide Asset, mask Asset, prompt, target rectangle, source
rectangle, mask encoding, and candidate count become immutable execution
inputs. Guide and mask Assets are not projected as visible Board Blocks.

V0 limits each target side to 4096 pixels and total target area to 16,777,216
pixels.

## Deterministic result boundary

Providers may return a candidate with a different size or imperfect source
preservation. Retake normalizes every candidate to the exact target dimensions,
then copies the original source's raw RGBA pixels into the frozen source
rectangle before importing the final PNG.

This makes source preservation a deterministic product guarantee rather than a
prompt-only request. Each accepted candidate becomes a standard Image Asset,
Result Block, output edge, succeeded Execution, and History entry through the
same Retake model as other connected capabilities.

## Ownership and portability

The Plugin uses Host API V2 only. It does not receive provider tokens,
filesystem paths, or private Whiteboard services. The same package can use the
Codex App Server Connection backed by the user's local Codex account/plan or a
future provider-neutral image Connection without changing its geometry or
input contract.
