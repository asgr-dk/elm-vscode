import { Position, Range, workspace } from "vscode"
import { execFile } from "node:child_process";
import { promisify } from "node:util"
import { homedir } from "node:os"
import { join } from "node:path"

export const execFileAsync = promisify(execFile)

export function entireDocumentRange() {
    return new Range(new Position(0, 0), new Position(Number.MAX_VALUE, Number.MAX_VALUE))
}

export function nullDevicePath() {
    return process.platform === "win32" ? "NUL" : "/dev/null"
}

export async function parseJSON(text: string): Promise<unknown> {
    try {
        return Promise.resolve(JSON.parse(text))
    } catch (error) {
        return Promise.reject(error)
    }
}

export function getElmHome() {
    return process.env.ELM_HOME || process.platform === "win32"
        ? join(homedir(), 'AppData', 'Roaming', 'elm')
        : join(homedir(), '.elm')
}