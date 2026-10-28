module Main exposing (main)

import Json.Decode
import Port


type alias Flags =
    {}


type alias Model =
    {}


type Msg
    = SendOutput String


main : Program Flags Model Msg
main =
    Platform.worker
        { init = init
        , update = update
        , subscriptions = subs
        }


init flags =
    ( {}, Cmd.none )


update msg model =
    case msg of
        SendOutput text ->
            ( model, Port.send (Port.Output text) )


subs model =
    Port.subscribe
        (\input ->
            case input of
                Port.InputError error ->
                    SendOutput (Json.Decode.errorToString error)

                Port.Input text ->
                    SendOutput text
        )
