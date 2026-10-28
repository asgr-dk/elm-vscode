port module Main exposing (main)

import Json.Decode
import Json.Encode


type alias Flags =
    {}


type alias Model =
    {}


type Msg
    = DoNothing


init : Flags -> ( Model, Cmd Msg )
init flags =
    ( {}, Cmd.none )


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        DoNothing ->
            ( model, Cmd.none )


subs : Model -> Sub Msg
subs model =
    Sub.none


port output : Json.Encode.Value -> Cmd msg


port input : (Json.Decode.Value -> msg) -> Sub msg


main : Program Flags Model Msg
main =
    Platform.worker
        { init = init
        , update = update
        , subscriptions = subs
        }
