import { homedir } from "node:os"
import { join } from "node:path"
import { readdir, readFile } from "node:fs/promises"
import {
    type CompletionContext, type CancellationToken,
    type ExtensionContext, type TextDocument, Uri,
    Position, CompletionItem, languages, workspace,
    window,
    CompletionItemKind,
    MarkdownString
} from "vscode";

import { parseJsonAsync, toOrdinal } from "./Help.ts"

export default async function activate(context: ExtensionContext) {
    context.subscriptions.push(languages.registerCompletionItemProvider('elm', {
        provideCompletionItems: await toCompletionItemsProvider()
    }, ".", "("))
}

async function toCompletionItemsProvider(): Promise<(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext) => Promise<CompletionItem[]>> {
    return async (document, position, token, context) => {
        if (context.triggerCharacter === ".") return []
        const workspaceFolder = workspace.getWorkspaceFolder(document.uri)
        if (workspaceFolder === undefined) return []
        const [elmJSON, elmJsonError] = await readFile(Uri.joinPath(workspaceFolder.uri, "elm.json").fsPath, { encoding: "utf8" })
            .then<[unknown, null]>(async text => [await parseJsonAsync(text), null])
            .catch<[null, Error]>(error => [null, error])
        if (elmJsonError) {
            window.showErrorMessage(`Failed to get elm.json: ${elmJsonError.message}`)
            return []
        }
        const elmVersion = (elmJSON as any)["elm-version"]
        const elmCoreVersion = (elmJSON as any)["dependencies"]["direct"]["elm/core"]
        const elmHome = process.env.ELM_HOME || process.platform === "win32"
            ? join(homedir(), 'AppData', 'Roaming', 'elm')
            : join(homedir(), '.elm')
        const [coreDocs, coreDocsError] = await readFile(`${elmHome}/${elmVersion}/packages/elm/core/${elmCoreVersion}/docs.json`, { encoding: "utf8" })
            .then<[unknown, null]>(async text => [await parseJsonAsync(text), null])
            .catch<[null, Error]>(error => [null, error])
        if (coreDocsError) {
            window.showErrorMessage(`Failed to get docs.json: ${coreDocsError.message}`)
            return []
        }
        const basics = (coreDocs as any).find((entry: any) => entry.name === "Basics")
        const list = (coreDocs as any).find((entry: any) => entry.name === "List")
        const maybe = (coreDocs as any).find((entry: any) => entry.name === "Maybe")
        const result = (coreDocs as any).find((entry: any) => entry.name === "Result")
        const string = (coreDocs as any).find((entry: any) => entry.name === "String")
        const char = (coreDocs as any).find((entry: any) => entry.name === "Char")
        const platform = (coreDocs as any).find((entry: any) => entry.name === "Platform")
        const platformCmd = (coreDocs as any).find((entry: any) => entry.name === "Platform.Cmd")
        const platformSub = (coreDocs as any).find((entry: any) => entry.name === "Platform.Sub")
        if ([basics, list, maybe, result, string, char, platform, platformCmd, platformSub].some(module => module === undefined)) {
            window.showErrorMessage(`Failed to find Basic module docs`)
            return []
        }
        const defaultImportModules = ["Basics", "List", "Maybe", "Result", "String", "Char", "Tuple", "Debug", "Platform", "Platform.Cmd", "Platform.Sub"]
        const moduleNameCompletions = (coreDocs as any)
            .filter((entry: any) => defaultImportModules.includes(entry.name))
            .map((entry: any) => {

                const completion = new CompletionItem(entry.name, CompletionItemKind.Module)
                completion.documentation = new MarkdownString(entry.comment)
                completion.sortText = "1_" + entry.name
                if (entry.name === "Platform.Cmd") {
                    completion.label = "Cmd"
                    completion.detail = `Renamed from ${entry.name}`
                }
                if (entry.name === "Platform.Sub") {
                    completion.label = "Sub"
                    completion.detail = `Renamed from ${entry.name}`
                }
                return completion
            })
        const basicBinopCompletions = basics.binops.map(mapBinopToCompletionItem)
        const basicValueCompletions = basics.values.map(({ name, comment, type }: any) => {
            const kind = type.includes("->") ? CompletionItemKind.Function : CompletionItemKind.Constant
            const completion = new CompletionItem(name, kind)
            completion.detail = type
            completion.documentation = new MarkdownString(comment)
            completion.sortText = "3_" + name
            return completion
        })
        const basicUnionCompletions = basics.unions.flatMap(flatpMapUnionsAndCasesIntoCompletionItems)
        const basicAliasCompletions = basics.aliases.map(mapAliasToCompletion)
        const listUnionCompletion = new CompletionItem("List a", CompletionItemKind.Enum)
        listUnionCompletion.documentation = new MarkdownString("The builtin List type.")
        listUnionCompletion.sortText = "2_" + "List"
        const listConsBinopCompletions = list.binops.filter((binop: any) => binop.name === "::").map(mapBinopToCompletionItem)
        const maybeUnionCompletions = maybe.unions.filter((union: any) => union.name === "Maybe").flatMap(flatpMapUnionsAndCasesIntoCompletionItems)
        const resultUnionCompletions = result.unions.filter((union: any) => union.name === "Result").flatMap(flatpMapUnionsAndCasesIntoCompletionItems)
        const stringUnionCompletions = string.unions.filter((union: any) => union.name === "String").flatMap(flatpMapUnionsAndCasesIntoCompletionItems)
        const charUnionCompletions = char.unions.filter((union: any) => union.name === "Char").flatMap(flatpMapUnionsAndCasesIntoCompletionItems)
        const platformUnionCompletions = platform.unions.filter((union: any) => union.name === "Program").flatMap(flatpMapUnionsAndCasesIntoCompletionItems)
        const platformCmdUnionCompletions = platformCmd.unions.filter((union: any) => union.name === "Cmd").flatMap(flatpMapUnionsAndCasesIntoCompletionItems)
        const platformSubUnionCompletions = platformSub.unions.filter((union: any) => union.name === "Sub").flatMap(flatpMapUnionsAndCasesIntoCompletionItems)
        return [
            ...moduleNameCompletions,
            ...basicBinopCompletions,
            ...basicValueCompletions,
            ...basicUnionCompletions,
            ...basicAliasCompletions,
            listUnionCompletion,
            ...listConsBinopCompletions,
            ...maybeUnionCompletions,
            ...resultUnionCompletions,
            ...stringUnionCompletions,
            ...charUnionCompletions,
            ...platformUnionCompletions,
            ...platformCmdUnionCompletions,
            ...platformSubUnionCompletions
        ]
    }
}

function mapBinopToCompletionItem({ name, comment, type, associativity, precedence }: any) {
    const completion = new CompletionItem(name, CompletionItemKind.Operator)
    completion.detail = type
    completion.documentation = new MarkdownString(comment + `\n*Evaluated ${toOrdinal(precedence)}, ${associativity} to ${associativity === "left" ? "right" : "left"}*`)
    completion.sortText = "4_" + name
    return completion
}

function mapAliasToCompletion({ name, comment, type, args }: any) {
    const completion = new CompletionItem(`${name} ${args.join(" ")}`, CompletionItemKind.Interface)
    completion.detail = type
    completion.documentation = new MarkdownString(comment)
    completion.sortText = "2_" + name
    return completion
}

function flatpMapUnionsAndCasesIntoCompletionItems({ name, comment, args, cases }: any) {
    const typeCompletion = new CompletionItem(`${name} ${args.join(" ")}`, CompletionItemKind.Enum)
    typeCompletion.detail = cases.map((case_: any) => case_[0] + " " + case_[1].join(" ")).join(" | ")
    typeCompletion.documentation = new MarkdownString(comment)
    typeCompletion.sortText = "2_" + name
    const caseCompletions = cases.map((case_: any) => {
        const caseCompletion = new CompletionItem(`${case_[0]} ${case_[1].join(" ")}`, CompletionItemKind.EnumMember)
        caseCompletion.detail = `${name} ${args.join(" ")}`
        caseCompletion.sortText = "3_" + case_[0]
        return caseCompletion
    })
    return [typeCompletion, ...caseCompletions]
}