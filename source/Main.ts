import { type ExtensionContext, window } from "vscode"

import activateCompilerDiagnostics from "./CompilerDiagnostics.ts"
import activateCodeCompletion from "./CodeCompletion.ts"
import activateFormatOnSave from "./FormatOnSave.ts"

export async function activate(context: ExtensionContext) {
    if (["win32", "darwin", "linux"].some(arch => arch === process.platform)) {
        await activateCompilerDiagnostics(context)
        await activateCodeCompletion(context)
        await activateFormatOnSave(context)
    }
    else window.showErrorMessage("Unsupported platform")
}
