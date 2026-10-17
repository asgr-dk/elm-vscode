import { execFile } from "node:child_process";
import {
    window, languages, TextEdit, Uri,
    workspace, Range, Position, Diagnostic,
    type ExtensionContext, type TextDocument,
    type FormattingOptions, type CancellationToken,
    type DiagnosticCollection
} from "vscode"

export function activate(context: ExtensionContext) {
    const diagnostics = languages.createDiagnosticCollection("Elm VSCode")
    context.subscriptions.push(diagnostics)
    context.subscriptions.push(languages.registerDocumentFormattingEditProvider("elm", { provideDocumentFormattingEdits }))
    context.subscriptions.push(workspace.onDidSaveTextDocument(document => onFileSaveOrOpen(document, diagnostics)))
    context.subscriptions.push(workspace.onDidOpenTextDocument(document => onFileSaveOrOpen(document, diagnostics)))
    if (window.activeTextEditor) onFileSaveOrOpen(window.activeTextEditor.document, diagnostics)
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

async function onFileSaveOrOpen(document: TextDocument, diagnostics: DiagnosticCollection) {
    if (document.fileName.endsWith(".elm") || document.fileName.endsWith("elm.json")) {
        const fileWorkspace = workspace.getWorkspaceFolder(document.uri);
        if (fileWorkspace === undefined) return window.showErrorMessage("Failed to find file in current workspace");
        const elmMakeOutputParam = process.platform === "win32" ? "--output=NUL" : "--output=/dev/null";
        const elmMakeParams = ["make", "--report=json", elmMakeOutputParam];
        if (document.fileName.endsWith(".elm")) elmMakeParams.push(document.fileName)
        execFile("elm", elmMakeParams,
            { cwd: fileWorkspace.uri.fsPath },
            function (error, _, stderr) {
                const elmJsonUri = Uri.joinPath(fileWorkspace.uri, "elm.json")
                if (error) {
                    const stderrJSON = JSON.parse(stderr)
                    switch (stderrJSON.type) {
                        case "error": {
                            if (stderrJSON.path === "elm.json") {
                                diagnostics.set(elmJsonUri, [
                                    new Diagnostic(
                                        new Range(
                                            new Position(0, 0),
                                            new Position(Number.MAX_VALUE, Number.MAX_VALUE)),
                                        problemToString(stderrJSON)
                                    )
                                ])
                            }
                            break;
                        }
                        case "compile-errors": {
                            diagnostics.delete(elmJsonUri)
                            stderrJSON.errors.forEach((error: any) => {
                                diagnostics.set(
                                    Uri.file(error.path),
                                    error.problems.map((problem: any) =>
                                        new Diagnostic(
                                            new Range(
                                                new Position(problem.region.start.line - 1, problem.region.start.column - 1),
                                                new Position(problem.region.end.line - 1, problem.region.end.column - 1)
                                            ),
                                            problemToString(problem)
                                        )
                                    ))
                            })
                            break;
                        }
                        default:
                            window.showErrorMessage(`Unrecognized error: ${JSON.stringify(stderrJSON)}`);
                            break;
                    }
                } else {
                    diagnostics.delete(document.uri)
                }
            })
    }
}

function problemToString(problem: { title: string, message: Array<{ bold: boolean, underline: boolean, color: string, string: string } | string> }): string {
    return problem.message.reduce<string>((message, segment) => message + (typeof segment == "string" ? segment : segment.string), problem.title + "\r\n")
}