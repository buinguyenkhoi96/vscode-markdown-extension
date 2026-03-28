export interface WebviewTemplateInput {
  cspSource: string;
  nonce: string;
  stylesheetUri: string;
  markedUri: string;
  domPurifyUri: string;
  mermaidUri: string;
}

export interface EditMessage {
  type: 'edit';
  text: string;
}

export function isEditMessage(value: unknown): value is EditMessage {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<EditMessage>;
  return candidate.type === 'edit' && typeof candidate.text === 'string';
}

export function isSupportedMarkdownDocument(languageId: string, scheme: string): boolean {
  return languageId === 'markdown' && (scheme === 'file' || scheme === 'untitled');
}

export function createEditorWebviewHtml(input: WebviewTemplateInput): string {
  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; img-src ${input.cspSource} data: https:; style-src ${input.cspSource}; font-src ${input.cspSource}; script-src 'nonce-${input.nonce}' ${input.cspSource};"
  />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="${input.stylesheetUri}" />
  <title>Markdown Live Preview Editor</title>
</head>
<body>
  <main class="editor-layout">
    <textarea id="editor" class="editor" spellcheck="false" aria-label="Markdown editor"></textarea>
    <section id="preview" class="preview markdown-body" aria-label="Markdown preview"></section>
  </main>

  <script nonce="${input.nonce}" type="module">
    import { marked } from "${input.markedUri}";
    import DOMPurify from "${input.domPurifyUri}";
    import mermaid from "${input.mermaidUri}";

    const vscode = acquireVsCodeApi();
    const editor = document.getElementById("editor");
    const preview = document.getElementById("preview");

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "default"
    });

    const sanitizeHtml = (html) =>
      DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });

    const escapeHtml = (text) =>
      text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    const renderMermaid = async () => {
      const mermaidCodeBlocks = preview.querySelectorAll("code.language-mermaid");
      if (mermaidCodeBlocks.length === 0) {
        return;
      }

      for (const codeBlock of mermaidCodeBlocks) {
        const parentPre = codeBlock.closest("pre");
        if (!parentPre) {
          continue;
        }

        const chartHost = document.createElement("div");
        chartHost.className = "mermaid";
        chartHost.textContent = codeBlock.textContent || "";
        parentPre.replaceWith(chartHost);

        try {
          await mermaid.run({ nodes: [chartHost] });
        } catch (error) {
          const safeError = escapeHtml(String(error));
          chartHost.outerHTML = '<pre class="mermaid-error">' + safeError + "</pre>";
        }
      }
    };

    const renderMarkdown = async (markdownText) => {
      try {
        const rendered = marked.parse(markdownText, {
          async: false,
          gfm: true,
          breaks: true
        });

        preview.innerHTML = sanitizeHtml(String(rendered));
      } catch (error) {
        preview.innerHTML =
          '<pre class="render-error">' + escapeHtml(String(error)) + "</pre>";
        return;
      }

      await renderMermaid();
    };

    let pendingEditTimeout;
    const sendDocumentUpdate = () => {
      window.clearTimeout(pendingEditTimeout);
      pendingEditTimeout = window.setTimeout(() => {
        vscode.postMessage({
          type: "edit",
          text: editor.value
        });
      }, 120);
    };

    editor.addEventListener("input", async () => {
      await renderMarkdown(editor.value);
      sendDocumentUpdate();
      vscode.setState({ text: editor.value });
    });

    window.addEventListener("message", async (event) => {
      const message = event.data;
      if (!message || message.type !== "update" || typeof message.text !== "string") {
        return;
      }

      if (editor.value !== message.text) {
        const isEditorFocused = document.activeElement === editor;
        const selectionStart = editor.selectionStart;
        const selectionEnd = editor.selectionEnd;

        editor.value = message.text;

        if (isEditorFocused) {
          const clamp = (value) => Math.min(value, editor.value.length);
          editor.selectionStart = clamp(selectionStart);
          editor.selectionEnd = clamp(selectionEnd);
        }
      }

      await renderMarkdown(editor.value);
      vscode.setState({ text: editor.value });
    });
  </script>
</body>
</html>
`;
}
