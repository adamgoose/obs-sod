import { Schema } from "@effect/schema";
import { Context, Effect, Layer } from "effect";
import OBSWebSocket, {
  OBSWebSocketError,
  type OBSRequestTypes,
  type OBSResponseTypes,
} from "obs-websocket-js";

export class OBS extends Context.Tag("OBS")<
  OBS,
  {
    call: <Type extends keyof OBSRequestTypes>(
      requestType: Type,
      requestData?: OBSRequestTypes[Type],
    ) => Effect.Effect<OBSResponseTypes[Type], OBSError, never>;
    sceneUuid: string;
  }
>() {}

export const OBSLive = Layer.effect(
  OBS,
  Effect.gen(function* () {
    const obs = yield* Effect.sync(() => new OBSWebSocket());
    yield* Effect.tryPromise(() => obs.connect("ws://10.0.1.95:4456"));

    const scenes = yield* Effect.tryPromise(() => obs.call("GetSceneList"));
    let scene = scenes.scenes.find((scene) => scene.sceneName == "NotLiveTV");
    if (!scene) {
      scene = yield* Effect.tryPromise(() =>
        obs.call("CreateScene", {
          sceneName: "NotLiveTV",
        }),
      );
    }
    yield* Effect.log("Got Scene ID: " + scene.sceneUuid);

    return {
      call: <Type extends keyof OBSRequestTypes>(
        requestType: Type,
        requestData?: OBSRequestTypes[Type],
      ) =>
        Effect.tryPromise({
          try: () => obs.call(requestType, requestData),
          catch: (e) => new OBSError(e as OBSWebSocketError),
        }),
      sceneUuid: scene.sceneUuid as string,
    };
  }),
);

export class OBSError extends Schema.TaggedError<OBSError>()("OBSError", {
  code: Schema.Number,
  message: Schema.String,
}) {
  constructor(readonly error: OBSWebSocketError) {
    super({ code: error.code, message: error.message });
  }
}
