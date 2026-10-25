import { type ExtensionContext } from "vscode"

import activateCompilerDiagnostics from "./CompilerDiagnostics.ts"
import activateFormatOnSave from "./FormatOnSave.ts"

export async function activate(context: ExtensionContext) {
    await activateCompilerDiagnostics(context)
    await activateFormatOnSave(context)
}
