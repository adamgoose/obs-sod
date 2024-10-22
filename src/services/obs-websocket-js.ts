import { Schema } from "@effect/schema";
import { Context, Effect, Layer } from "effect";
import OBSWebSocket, {
  OBSWebSocketError,
  type OBSRequestTypes,
  type OBSResponseTypes,
} from "obs-websocket-js";
import { StreamConfig } from "./config";

export class OBS extends Context.Tag("OBS")<
  OBS,
  {
    client: OBSWebSocket;
    call: <Type extends keyof OBSRequestTypes>(
      requestType: Type,
      requestData?: OBSRequestTypes[Type],
    ) => Effect.Effect<OBSResponseTypes[Type], OBSError>;
    on: (
      ...args: Parameters<OBSWebSocket["on"]>
    ) => Effect.Effect<ReturnType<OBSWebSocket["on"]>, OBSError>;
    off: (
      ...args: Parameters<OBSWebSocket["off"]>
    ) => Effect.Effect<ReturnType<OBSWebSocket["off"]>, OBSError>;

    sceneUuid: string;
  }
>() {}

export const OBSLive = Layer.scoped(
  OBS,
  Effect.gen(function* () {
    const streamConfig = yield* StreamConfig;
    const obs = yield* Effect.acquireRelease(
      Effect.sync(() => new OBSWebSocket()),
      (obs) => Effect.promise(() => obs.disconnect()),
    );
    yield* Effect.tryPromise(() =>
      obs.connect(streamConfig.obs.address, streamConfig.obs.password),
    );

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
      client: obs,
      call: <Type extends keyof OBSRequestTypes>(
        requestType: Type,
        requestData?: OBSRequestTypes[Type],
      ) =>
        Effect.tryPromise({
          try: () => obs.call(requestType, requestData),
          catch: (e) => new OBSError(e as OBSWebSocketError),
        }),
      on: (...args: Parameters<typeof obs.on>) =>
        Effect.sync(() => obs.on(...args)),
      off: (...args: Parameters<typeof obs.off>) =>
        Effect.sync(() => obs.off(...args)),
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
