import { Position, Range, workspace } from "vscode"
import { execFile } from "node:child_process";
import { promisify } from "node:util"

export const execFileAsync = promisify(execFile)

export function entireDocumentRange() {
    return new Range(new Position(0, 0), new Position(Number.MAX_VALUE, Number.MAX_VALUE))
}

export function nullDevicePath() {
    return process.platform === "win32" ? "NUL" : "/dev/null"
}

export async function parseJsonAsync(text: string): Promise<unknown> {
    try {
        return Promise.resolve(JSON.parse(text))
    } catch (error) {
        return Promise.reject(error)
    }
}

export function toOrdinal(n: number) {
    switch (n) {
        case 1: return n + "st"
        case 2: return n + "nd"
        case 3: return n + "rd"
        default: return n + "th"
    }
}