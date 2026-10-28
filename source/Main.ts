import { type ExtensionContext, window } from "vscode"
import { Elm } from "../build/main.js"

export function activate(context: ExtensionContext) {
    const { ports } = Elm.Main.init({ flags: {} });
    ports.output.subscribe((msg: unknown) => {
        switch (msg) {
            default: return window.showErrorMessage(`Unrecognized output ${msg}`)
        }
    })
}