import { expect } from 'chai';
import {
  getActiveMarkdownUri,
  isMarkdownDocument,
  openMarkdownEditor,
  type ActiveEditorLike,
  type MarkdownOpenApis,
} from '../src/commandLogic';

describe('commandLogic', () => {
  describe('isMarkdownDocument', () => {
    it('returns true for markdown file scheme', () => {
      expect(isMarkdownDocument('markdown', 'file')).to.equal(true);
    });

    it('returns true for markdown untitled scheme', () => {
      expect(isMarkdownDocument('markdown', 'untitled')).to.equal(true);
    });

    it('returns false for unsupported language', () => {
      expect(isMarkdownDocument('plaintext', 'file')).to.equal(false);
    });

    it('returns false for unsupported scheme', () => {
      expect(isMarkdownDocument('markdown', 'git')).to.equal(false);
    });
  });

  describe('getActiveMarkdownUri', () => {
    it('returns undefined when there is no active editor', () => {
      expect(getActiveMarkdownUri(undefined)).to.equal(undefined);
    });

    it('returns undefined for non-markdown active editor', () => {
      const editor: ActiveEditorLike = {
        document: {
          languageId: 'typescript',
          scheme: 'file',
          uri: 'file:///workspace/src/index.ts',
        },
      };

      expect(getActiveMarkdownUri(editor)).to.equal(undefined);
    });

    it('returns uri for markdown active editor', () => {
      const editor: ActiveEditorLike = {
        document: {
          languageId: 'markdown',
          scheme: 'file',
          uri: 'file:///workspace/README.md',
        },
      };

      expect(getActiveMarkdownUri(editor)).to.equal('file:///workspace/README.md');
    });
  });

  describe('openMarkdownEditor', () => {
    it('shows an error when no markdown editor is active', async () => {
      const capturedErrors: string[] = [];
      const opens: Array<{ uri: string; viewType: string }> = [];
      const apis: MarkdownOpenApis = {
        activeEditor: undefined,
        openWith: async (uri, viewType) => {
          opens.push({ uri, viewType });
        },
        showError: async (message) => {
          capturedErrors.push(message);
        },
      };

      await openMarkdownEditor(apis, 'markdownPreviewEditing.editor');

      expect(opens).to.deep.equal([]);
      expect(capturedErrors).to.deep.equal([
        'Open a markdown file first to use Markdown Live Preview Editor.',
      ]);
    });

    it('opens markdown custom editor with the active uri', async () => {
      const capturedErrors: string[] = [];
      const opens: Array<{ uri: string; viewType: string }> = [];
      const apis: MarkdownOpenApis = {
        activeEditor: {
          document: {
            languageId: 'markdown',
            scheme: 'file',
            uri: 'file:///workspace/docs/guide.md',
          },
        },
        openWith: async (uri, viewType) => {
          opens.push({ uri, viewType });
        },
        showError: async (message) => {
          capturedErrors.push(message);
        },
      };

      await openMarkdownEditor(apis, 'markdownPreviewEditing.editor');

      expect(capturedErrors).to.deep.equal([]);
      expect(opens).to.deep.equal([
        {
          uri: 'file:///workspace/docs/guide.md',
          viewType: 'markdownPreviewEditing.editor',
        },
      ]);
    });
  });
});
