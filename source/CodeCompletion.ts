import { readdir, readFile } from "node:fs/promises"
import {
    type CompletionContext, type CancellationToken,
    type ExtensionContext, type TextDocument,
    Position, CompletionItem, languages
} from "vscode";

import { getElmHome } from "./Help.ts";

export default async function activate(context: ExtensionContext) {
    context.subscriptions.push(languages.registerCompletionItemProvider('elm', {
        provideCompletionItems: await toCompletionItemsProvider()
    }))
}

async function toCompletionItemsProvider(): Promise<(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext) => Promise<CompletionItem[]>> {
    const defaultImportCompletions = await getDefaultImportCompletions();
    return async (document, position, token, context) => {

        console.log({ document, position, token, context })

        return [
            ...defaultImportCompletions
        ]
    }
}

/* default imports are defined [here](https://package.elm-lang.org/packages/elm/core/latest) as the following
```elm
import Basics exposing (..)
import List exposing (List, (::))
import Maybe exposing (Maybe(..))
import Result exposing (Result(..))
import String exposing (String)
import Char exposing (Char)
import Tuple
import Debug
import Platform exposing ( Program )
import Platform.Cmd as Cmd exposing ( Cmd )
import Platform.Sub as Sub exposing ( Sub )
```
*/
async function getDefaultImportCompletions(): Promise<CompletionItem[]> {
    const home = getElmHome();
    console.log({ home })
    return []
}