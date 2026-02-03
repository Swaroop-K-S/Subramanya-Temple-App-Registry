# Level 6: Napkin to Production (Multimodal)

**Status**: ACTIVE
**Input Channels**: Image (Drag & Drop), Clipboard
**Processing Engine**: Vision-Transformer (ViT)

## Capabilities
- **Sketch-to-UI**: Converts hand-drawn layouts into Tailwind CSS grids.
- **Screenshot Replication**: Clones UI details from uploaded reference images (`uploaded_media_x.png`).
- **Visual Diffing**: Compares rendered UI against design mocks for pixel-perfect validation.

## Workflow
1.  User drags image to IDE.
2.  System scans for Layout, Typography, and Colors.
3.  System generates `App.jsx` + `index.css` code.
