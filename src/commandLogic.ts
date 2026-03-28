export interface EditorDocumentLike {
  readonly languageId: string;
  readonly uri: string;
  readonly scheme: string;
}

export interface ActiveEditorLike {
  readonly document: EditorDocumentLike;
}

export interface MarkdownOpenApis {
  readonly activeEditor: ActiveEditorLike | undefined;
  openWith(uri: string, viewType: string): Promise<void>;
  showError(message: string): Promise<void>;
}

export function isMarkdownDocument(languageId: string, scheme: string): boolean {
  return languageId === 'markdown' && (scheme === 'file' || scheme === 'untitled');
}

export function getActiveMarkdownUri(
  activeEditor: ActiveEditorLike | undefined,
): string | undefined {
  if (!activeEditor) {
    return undefined;
  }

  const { document } = activeEditor;
  if (!isMarkdownDocument(document.languageId, document.scheme)) {
    return undefined;
  }

  return document.uri;
}

export async function openMarkdownEditor(
  apis: MarkdownOpenApis,
  viewType: string,
): Promise<void> {
  const uri = getActiveMarkdownUri(apis.activeEditor);
  if (!uri) {
    await apis.showError('Open a markdown file first to use Markdown Live Preview Editor.');
    return;
  }

  await apis.openWith(uri, viewType);
}
