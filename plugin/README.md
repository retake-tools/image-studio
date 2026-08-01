# Retake Image Studio Package

This directory is the portable source for
`design.retake.image-studio@0.11.0`.

The single Retake Package contains the trusted Image Studio Web PluginModule,
its image Capabilities, the Guided Image Skill and Workflow, and the bounded
Guided Image Operator AgentPreset.

The Guided Image Workflow binds Core `image.generate` with one source Image, a
written edit instruction, and optional ordered references. It runs only after
explicit execution and requires human approval of the accepted result.
