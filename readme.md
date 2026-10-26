# Elm VSCode

My personal language extension for Elm in VSCode

![](/logo.jpg)

[Open with VSCode](vscode:extension/asgr-dk.elm-vscode)

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