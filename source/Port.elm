port module Port exposing (Input(..), Output(..), send, subscribe)

import Help
import Json.Decode
import Json.Encode


type Output
    = Output String


port output : Json.Encode.Value -> Cmd msg


send : Output -> Cmd msg
send =
    output << encodeOutput


encodeOutput : Output -> Json.Encode.Value
encodeOutput output_ =
    case output_ of
        Output text ->
            Json.Encode.string text


type Input
    = Input String
    | InputError Json.Decode.Error


port input : (Json.Decode.Value -> msg) -> Sub msg


subscribe : (Input -> msg) -> Sub msg
subscribe toMsg =
    input (Json.Decode.decodeValue inputDecoder >> Help.recoverWith InputError >> toMsg)


inputDecoder : Json.Decode.Decoder Input
inputDecoder =
    Json.Decode.oneOf
        [ Json.Decode.map Input Json.Decode.string
        ]
