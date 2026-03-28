import * as crypto from 'node:crypto';
import * as path from 'node:path';
import * as vscode from 'vscode';
import {
  createEditorWebviewHtml,
  isEditMessage,
  isSupportedMarkdownDocument,
} from './webviewTemplate';

export class MarkdownLiveEditorProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = 'markdownPreviewEditing.editor';

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new MarkdownLiveEditorProvider(context);

    return vscode.window.registerCustomEditorProvider(
      MarkdownLiveEditorProvider.viewType,
      provider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      },
    );
  }

  public constructor(private readonly context: vscode.ExtensionContext) {}

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken,
  ): Promise<void> {
    if (!isSupportedMarkdownDocument(document.languageId, document.uri.scheme)) {
      throw new Error('Markdown Live Preview Editor only supports markdown files.');
    }

    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        this.context.extensionUri,
        vscode.Uri.joinPath(document.uri, '..'),
      ],
    };

    webviewPanel.webview.html = this.createWebviewHtml(webviewPanel.webview);

    const updateWebview = (): Thenable<boolean> =>
      webviewPanel.webview.postMessage({
        type: 'update',
        text: document.getText(),
      });

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.uri.toString() !== document.uri.toString()) {
        return;
      }

      void updateWebview();
    });

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    webviewPanel.webview.onDidReceiveMessage((message: unknown) => {
      if (!isEditMessage(message)) {
        return;
      }

      const currentText = document.getText();
      if (message.text === currentText) {
        return;
      }

      const fullDocumentRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(currentText.length),
      );

      const edit = new vscode.WorkspaceEdit();
      edit.replace(document.uri, fullDocumentRange, message.text);
      void vscode.workspace.applyEdit(edit);
    });

    await updateWebview();
  }

  private createWebviewHtml(webview: vscode.Webview): string {
    const nonce = this.generateNonce();
    const mediaRoot = vscode.Uri.joinPath(this.context.extensionUri, 'media');

    const stylesheetUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'editor.css')).toString();
    const markedUri = webview
      .asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'node_modules', 'marked', 'lib', 'marked.esm.js'))
      .toString();
    const domPurifyUri = webview
      .asWebviewUri(
        vscode.Uri.joinPath(this.context.extensionUri, 'node_modules', 'dompurify', 'dist', 'purify.es.mjs'),
      )
      .toString();
    const mermaidUri = webview
      .asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'node_modules', 'mermaid', 'dist', 'mermaid.esm.min.mjs'))
      .toString();

    return createEditorWebviewHtml({
      cspSource: webview.cspSource,
      nonce,
      stylesheetUri,
      markedUri,
      domPurifyUri,
      mermaidUri,
    });
  }

  private generateNonce(): string {
    return crypto.randomBytes(16).toString('base64url');
  }
}
