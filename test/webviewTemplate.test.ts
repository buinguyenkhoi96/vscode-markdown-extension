import { expect } from 'chai';
import {
  createEditorWebviewHtml,
  isEditMessage,
  isSupportedMarkdownDocument,
} from '../src/webviewTemplate';

describe('webviewTemplate', () => {
  describe('isEditMessage', () => {
    it('accepts valid edit message', () => {
      expect(isEditMessage({ type: 'edit', text: '# Hello' })).to.equal(true);
    });

    it('rejects invalid messages', () => {
      expect(isEditMessage({ type: 'edit' })).to.equal(false);
      expect(isEditMessage({ type: 'other', text: '# Hello' })).to.equal(false);
      expect(isEditMessage(null)).to.equal(false);
    });
  });

  describe('isSupportedMarkdownDocument', () => {
    it('accepts markdown file and untitled docs', () => {
      expect(isSupportedMarkdownDocument('markdown', 'file')).to.equal(true);
      expect(isSupportedMarkdownDocument('markdown', 'untitled')).to.equal(true);
    });

    it('rejects non-markdown or unsupported schemes', () => {
      expect(isSupportedMarkdownDocument('plaintext', 'file')).to.equal(false);
      expect(isSupportedMarkdownDocument('markdown', 'vscode-userdata')).to.equal(false);
    });
  });

  describe('createEditorWebviewHtml', () => {
    it('injects all required URIs and security values', () => {
      const html = createEditorWebviewHtml({
        cspSource: 'vscode-webview://abc',
        nonce: 'nonce-123',
        stylesheetUri: 'vscode-resource://style.css',
        markedUri: 'vscode-resource://marked.mjs',
        domPurifyUri: 'vscode-resource://purify.mjs',
        mermaidUri: 'vscode-resource://mermaid.mjs',
      });

      expect(html).to.contain("script-src 'nonce-nonce-123'");
      expect(html).to.contain('vscode-resource://style.css');
      expect(html).to.contain('vscode-resource://marked.mjs');
      expect(html).to.contain('vscode-resource://purify.mjs');
      expect(html).to.contain('vscode-resource://mermaid.mjs');
      expect(html).to.contain('code.language-mermaid');
      expect(html).to.contain('mermaid.run');
    });
  });
});
