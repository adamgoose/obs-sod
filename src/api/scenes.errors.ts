import { Schema } from "@effect/schema";
import { OBSWebSocketError } from "obs-websocket-js";

export class CreateInputError extends Schema.TaggedError<CreateInputError>()(
  "CreateInputError",
  {
    code: Schema.Number,
    message: Schema.String,
  },
) {}

export class OBSError extends Schema.TaggedError<OBSError>()("OBSError", {
  code: Schema.Number,
  message: Schema.String,
}) {
  constructor(readonly error: OBSWebSocketError) {
    super({ code: error.code, message: error.message });
  }
}
