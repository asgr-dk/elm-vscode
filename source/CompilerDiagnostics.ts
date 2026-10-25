import { type ExecException } from "node:child_process";
import {
    type ExtensionContext, type TextDocument, type DiagnosticCollection,
    Diagnostic, Position, Range, Uri, languages, workspace, window, commands,
} from "vscode";

import { entireDocumentRange, execFileAsync, nullDevicePath, parseJSON } from "./Help.ts"

export default async function activate(context: ExtensionContext) {
    const diagnostics = languages.createDiagnosticCollection("Elm VSCode")
    context.subscriptions.push(diagnostics)
    context.subscriptions.push(workspace.onDidSaveTextDocument(async document => await onFileSaveOrOpen(document, diagnostics)))
    context.subscriptions.push(workspace.onDidOpenTextDocument(async document => await onFileSaveOrOpen(document, diagnostics)))
    if (window.activeTextEditor) await onFileSaveOrOpen(window.activeTextEditor.document, diagnostics)
}

async function onFileSaveOrOpen(document: TextDocument, diagnostics: DiagnosticCollection) {
    const isElmJson = document.fileName.endsWith("elm.json")
    const isElmModule = document.fileName.endsWith(".elm")
    if (!isElmJson && !isElmModule) return;
    const compilerPath = workspace.getConfiguration().get<string>("compilerPath", "elm");
    const compilerArgs = ["make", "--report=json", `--output=${nullDevicePath()}`];
    if (isElmModule) compilerArgs.push(document.fileName)
    const workspaceFolder = workspace.getWorkspaceFolder(document.uri)
    if (workspaceFolder === undefined) return window.showErrorMessage("Workspace for current file not found")
    const promise = execFileAsync(compilerPath, compilerArgs, { cwd: workspaceFolder.uri.fsPath })
    const processError = await promise
        .then<null>(_ => null)
        .catch<ExecException>(error => error)
    const elmJsonUri = Uri.joinPath(workspaceFolder.uri, "elm.json")
    if (processError === null) return diagnostics.clear();
    if (processError.code === "ENOENT") return window.showErrorMessage("compilerPath not found", "Go to Settings").then(async action => {
        if (action === "Go to Settings") await commands.executeCommand('workbench.action.openSettings', '@ext:asgr-dk.elm-vscode');
    })
    const [compilerError, parseError] = await parseJSON(processError.stderr as string)
        .then<[any, null]>((json: any) => [json, null])
        .catch<[null, Error]>(parseError => [null, parseError])
    if (parseError) return window.showErrorMessage(`Failed to parse error from Elm: ${parseError.message}`)
    if (compilerError.type === "error" && compilerError.path === "elm.json")
        return diagnostics.set(elmJsonUri, [new Diagnostic(entireDocumentRange(), compilerErrorToString(compilerError))])
    if (compilerError.type === "error" && compilerError.path === null && isElmJson) {
        return diagnostics.delete(elmJsonUri)
    }
    if (compilerError.type === "compile-errors") {
        diagnostics.delete(elmJsonUri)
        return compilerError.errors.forEach((entry: any) =>
            diagnostics.set(Uri.file(entry.path), entry.problems.map((problem: any) =>
                new Diagnostic(compilerErrorRegionToRange(problem.region), compilerErrorToString(problem))
            ))
        )
    }
    return window.showErrorMessage(`Unrecognized error: ${JSON.stringify(compilerError)}`)
}

function compilerErrorRegionToRange(region: any): Range {
    return new Range(
        new Position(region.start.line - 1, region.start.column - 1),
        new Position(region.end.line - 1, region.end.column - 1)
    )
}

function compilerErrorToString(compilerError: { title: string, message: Array<{ bold: boolean, underline: boolean, color: string, string: string } | string> }): string {
    return compilerError.message.reduce<string>((message, segment) =>
        message + (typeof segment == "string"
            ? segment
            : segment.string),
        compilerError.title + "\r\n")
}