# Elm VSCode

My personal language extension for Elm in VSCode

![](/logo.jpg)

## Features

- Format On Save
- Syntax Highlighting
- Compiler Diagnostics

I'm working on:

- Code Completion

## Requirements

Supported platforms are windows, macos, & linux.

| binary     | version   | releases                                    |
| ---------- | --------- | ------------------------------------------- |
| elm        | >= 0.19.1 | https://github.com/elm/compiler/releases    |
| elm-format | >= 0.8.8  | https://github.com/avh4/elm-format/releases |

## Development

Publishing workflow uses a PAT with publishing scope to marketplace. It is [configured here](https://github.com/asgr-dk/elm-vscode/settings/secrets/actions) and [generated here](https://dev.azure.com/asgr-dk/_usersSettings/tokens). Next expiry is 16 October 2027.

Implicit imports for all modules are defined [here](https://package.elm-lang.org/packages/elm/core/latest/) as the following:
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