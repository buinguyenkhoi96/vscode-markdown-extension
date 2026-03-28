# Markdown Live Preview Editor (VS Code Extension)

Editable Markdown preview for `.md` files with built-in Mermaid diagram rendering.

## Features

- Opens Markdown files in a **custom editor** by default.
- Provides a **split view**:
  - left side: editable Markdown text area
  - right side: live rendered preview
- Synchronizes edits both ways:
  - typing in the custom editor updates the underlying `.md` document
  - external document updates refresh the custom editor and preview
- Supports Mermaid code blocks:
  ````md
  ```mermaid
  graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Done]
    B -->|No| D[Retry]
  ```
  ````

## Command

- `Markdown Preview Editing Mermaid: Open Markdown Live Preview Editor`
  - Command ID: `markdownPreviewEditing.openEditor`

## Development

### Install dependencies

```bash
npm install
```

### Build

```bash
npm run compile
```

### Lint

```bash
npm run lint
```

### Test

```bash
npm test
```

## Project structure

- `src/extension.ts` - extension activation + command wiring
- `src/markdownLiveEditorProvider.ts` - custom text editor provider
- `src/webviewTemplate.ts` - webview HTML template + message guards
- `src/commandLogic.ts` - command logic (unit-testable)
- `media/editor.css` - webview styling
- `test/*.test.ts` - unit tests
