import { type ExecException } from "child_process";
import {
    type CancellationToken, type FormattingOptions,
    type ExtensionContext, type TextDocument,
    TextEdit, window, languages, workspace, commands
} from "vscode";

import { execFileAsync, entireDocumentRange } from "./Help.ts";

export default async function activate(context: ExtensionContext) {
    context.subscriptions.push(languages.registerDocumentFormattingEditProvider("elm", { provideDocumentFormattingEdits }))
}

async function provideDocumentFormattingEdits(document: TextDocument, _: FormattingOptions, token: CancellationToken) {
    const formatterPath = workspace.getConfiguration().get<string>("formatterPath", "elm-format");
    const abortFormatting = new AbortController();
    token.onCancellationRequested(abortFormatting.abort)
    const promise = execFileAsync(formatterPath, ["--stdin", "--yes"], { signal: abortFormatting.signal })
    promise.child.stdin?.write(document.getText())
    promise.child.stdin?.end()
    const [error, edits] = await promise
        .then<[null, TextEdit[]]>(({ stdout }) => [null, [new TextEdit(entireDocumentRange(), stdout)]])
        .catch<[ExecException, TextEdit[]]>(error => [error, []])
    if (error) {
        switch (error.code) {
            case 1: window.showErrorMessage((error.stderr as string).replace("<STDIN>", document.fileName.split("/").pop() || "<STDIN>")); break;
            case "ENOENT": window.showErrorMessage("formatterPath not found.", "Go to Settings").then(async action => {
                if (action === "Go to Settings") await commands.executeCommand('workbench.action.openSettings', '@ext:asgr-dk.elm-vscode');
            }); break;
            default: window.showErrorMessage(`Unrecognized error: ${JSON.stringify(error)}`); break;
        }
    }
    return edits;
}