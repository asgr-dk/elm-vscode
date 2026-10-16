import { execFile } from "node:child_process";
import {
    window, languages, TextEdit, Range, Position,
    type ExtensionContext, type TextDocument,
    type FormattingOptions, type CancellationToken
} from "vscode"

export function activate(context: ExtensionContext) {
    context.subscriptions.push(languages.registerDocumentFormattingEditProvider("elm", { provideDocumentFormattingEdits }))
}

async function provideDocumentFormattingEdits(document: TextDocument, _: FormattingOptions, token: CancellationToken) {
    const abortFormatting = new AbortController();
    token.onCancellationRequested(abortFormatting.abort)
    return await new Promise<Array<TextEdit>>(function (resolve) {
        const process = execFile("elm-format", ["--stdin", "--yes"], { signal: abortFormatting.signal }, function (error, stdout, stderr) {
            if (error) {
                switch (error.code) {
                    case 1: window.showErrorMessage(stderr.replace("<STDIN>", "at ")); break;
                    case "ENOENT": window.showErrorMessage("elm-format not found"); break;
                    default: window.showErrorMessage(error.message); break;
                }
                return resolve([]);
            }
            return resolve([TextEdit.replace(new Range(new Position(0, 0), new Position(Number.MAX_VALUE, Number.MAX_VALUE)), stdout)])
        })
        process.stdin?.write(document.getText())
        process.stdin?.end()
    })
}

