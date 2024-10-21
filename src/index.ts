import {
  HttpApiBuilder,
  HttpApiSwagger,
  HttpMiddleware,
  HttpServer,
} from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { createServer } from "node:http";
import { MyApiLive } from "./api";
import { OBS, OBSWebSocket } from "./services";
import OBSWebSocketJS, {
  OBSWebSocketError,
  type OBSRequestTypes,
} from "obs-websocket-js";
import { OBSError } from "./api/scenes.errors";

const OBSLive = Layer.scoped(
  OBS,
  Effect.gen(function* () {
    const obs = yield* OBSWebSocket;

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

const OBSWebSocketLive = Layer.scoped(
  OBSWebSocket,
  Effect.gen(function* () {
    const obs = new OBSWebSocketJS();
    yield* Effect.tryPromise(() => obs.connect("ws://10.0.1.95:4456"));
    return obs;
  }).pipe(Effect.tapError((e) => Effect.log("Errror connecting to OBS:", e))),
);

// use the `HttpApiBuilder.serve` function to register our API with the HTTP
// server
const HttpLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiSwagger.layer()),
  Layer.provide(HttpApiBuilder.middlewareCors()),
  Layer.provide(MyApiLive),
  Layer.provide(OBSLive),
  Layer.provide(OBSWebSocketLive),
  HttpServer.withLogAddress,
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3001 })),
);

// run the server
Layer.launch(HttpLive).pipe(NodeRuntime.runMain);
