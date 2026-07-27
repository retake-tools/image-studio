# Retake Image Studio

Image Studio is the official Retake plugin for deep, workflow-native image
editing on the infinite canvas.

The first migration target is the existing `image.local_adjust` capability.
It keeps Retake Whiteboard responsible for canvas state, assets, executions,
history, package lifecycle, and fallback UI while this repository owns the
image-specific action, panel, preview, parameters, and browser processor.

The initial P9 migration is in progress. Installation and authoring
instructions will be added once the first vertical package slice is complete.

