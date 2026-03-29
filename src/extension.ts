import * as vscode from 'vscode';
import { openMarkdownEditor, type ActiveEditorLike } from './commandLogic';
import { MarkdownLiveEditorProvider } from './markdownLiveEditorProvider';

export async function openMarkdownLiveEditorWithApis(
  windowApi: Pick<typeof vscode.window, 'activeTextEditor' | 'showErrorMessage'>,
  commandsApi: Pick<typeof vscode.commands, 'executeCommand'>,
): Promise<void> {
  const activeEditor: ActiveEditorLike | undefined = windowApi.activeTextEditor
    ? {
        document: {
          languageId: windowApi.activeTextEditor.document.languageId,
          uri: windowApi.activeTextEditor.document.uri.toString(),
          scheme: windowApi.activeTextEditor.document.uri.scheme,
        },
      }
    : undefined;

  await openMarkdownEditor(
    {
      activeEditor,
      openWith: async (uri, viewType) => {
        await commandsApi.executeCommand(
          'vscode.openWith',
          vscode.Uri.parse(uri),
          viewType,
        );
      },
      showError: async (message) => {
        await windowApi.showErrorMessage(message);
      },
    },
    MarkdownLiveEditorProvider.viewType,
  );
}

export async function openMarkdownLiveEditor(): Promise<void> {
  await openMarkdownLiveEditorWithApis(vscode.window, vscode.commands);
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(MarkdownLiveEditorProvider.register(context));

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'markdownPreviewEditing.openEditor',
      openMarkdownLiveEditor,
    ),
  );
}

export function deactivate(): void {}
