import { type ExtensionContext } from "vscode"
import { Elm } from "../build/main.js"

export function activate(context: ExtensionContext) {
    const flags = {}
    const { ports: { input, output } } = Elm.Main.init({ flags });
    input.send("hello")
    output.subscribe(function (msg: unknown) {
        switch (msg) {
            default: console.log(msg)
        }
    })
}
