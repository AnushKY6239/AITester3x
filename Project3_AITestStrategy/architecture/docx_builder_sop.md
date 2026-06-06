# Docx Builder SOP (architecture/docx_builder_sop.md)

This SOP details how to compile the generated test strategy JSON payload into a Microsoft Word `.docx` file matching the template styling and layout.

## Layout & Styling Invariants

To match the premium look of the target document:
1. **Font**: Use a clean, modern font like `Arial` or `Calibri`.
2. **Title**: 24pt, bold, primary color (e.g. Deep Blue/Slate: `#1e293b`), centered or left-aligned with a spacer.
3. **Heading 1 (H1)**: 16pt, bold, slate color, with spacing before/after.
4. **Heading 2 (H2)**: 13pt, bold, dark grey, with spacing.
5. **Body Text**: 11pt, regular, charcoal color (`#334155`), line spacing 1.15.
6. **Lists**: Bullet lists with proper indents.

## Section Organization
The builder must generate sections in this exact order:
- **Title Block**: Document Header and Title
- **Objective**: Section text
- **Scope**: Bullet lists under "In scope:" and "Out of scope:" H2 headers
- **Focus Areas**: Bullets or structured list for each focus area (Functional, UI, Performance, Security, Compatibility, Usability)
- **Approach**: Bullet lists describing methodologies and tools
- **Deliverables**: Bullet lists of output artifacts
- **Team & Schedule**: Sizing and schedule description
- **Entry & Exit Criteria**: Requirements for starting and finishing QA
- **Risks**: List of risk items

## Technology
- We will use the standard `docx` package in Node.js.
- For UI download, we can generate the document buffer on the backend API or frontend and trigger a browser download action with `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
