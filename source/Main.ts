import * as vscode from "vscode"

export function activate(context: vscode.ExtensionContext) {
    console.log("hello vscode")
    context.subscriptions.push(vscode.commands.registerCommand("extension.helloWorld", () => vscode.window.showInformationMessage("hello vscode")));
}