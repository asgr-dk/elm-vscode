module Help exposing (recoverWith)


recoverWith : (error -> ok) -> Result error ok -> ok
recoverWith fromError result =
    case result of
        Ok value ->
            value

        Err error ->
            fromError error
