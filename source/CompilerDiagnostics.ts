import { execFile } from "node:child_process";
import {
    type ExtensionContext, type TextDocument, type DiagnosticCollection,
    Diagnostic, Position, Range, Uri, languages, workspace, window,
} from "vscode";

export default function activate(context: ExtensionContext) {
    const diagnostics = languages.createDiagnosticCollection("Elm VSCode")

    context.subscriptions.push(diagnostics)
    context.subscriptions.push(workspace.onDidSaveTextDocument(document => onFileSaveOrOpen(document, diagnostics)))
    context.subscriptions.push(workspace.onDidOpenTextDocument(document => onFileSaveOrOpen(document, diagnostics)))

    if (window.activeTextEditor) onFileSaveOrOpen(window.activeTextEditor.document, diagnostics)
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
                if (error) {
                    if (error?.path === "elm" && error?.code === "ENOENT") {
                        return window.showErrorMessage("elm not found");
                    }
                    const stderrJSON = JSON.parse(stderr)
                    const elmJsonUri = Uri.joinPath(fileWorkspace.uri, "elm.json")
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
    return problem.message.reduce<string>((message, segment) =>
        message + (typeof segment == "string"
            ? segment
            : segment.string),
        problem.title + "\r\n")
}