import { type ExtensionContext } from "vscode"

import activateCompilerDiagnostics from "./CompilerDiagnostics.ts"
import activateFormatOnSave from "./FormatOnSave.ts"

export function activate(context: ExtensionContext) {
    activateCompilerDiagnostics(context)
    activateFormatOnSave(context)
}
