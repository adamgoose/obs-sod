import { Context, Effect, Layer } from "effect";
import { OBS, OBSError } from "./obs-websocket-js";
import { StreamConfig, StreamConfigTextSchema } from "./config";
import _ from "lodash";
import type { Schema } from "@effect/schema";

export class StreamDesigner extends Context.Tag("StreamDesigner")<
  StreamDesigner,
  {
    configureStreamService: () => Effect.Effect<void, OBSError>;
    setBackground: () => Effect.Effect<void, OBSError | string>;
    setText: (
      inputName: string,
      textConfig: Schema.Schema.Type<typeof StreamConfigTextSchema>,
    ) => Effect.Effect<void, OBSError | string>;
  }
>() {}

export const StreamDesignerLive = Layer.effect(
  StreamDesigner,
  Effect.gen(function* () {
    const obs = yield* OBS;
    const streamConfig = yield* StreamConfig;

    return {
      configureStreamService: () =>
        Effect.gen(function* () {
          yield* obs.call("SetStreamServiceSettings", {
            streamServiceType: "rtmp_custom",
            streamServiceSettings: {
              bwtest: false,
              use_auth: false,
              server: streamConfig.rtmp.server,
              key: streamConfig.rtmp.key,
            },
          });
        }),
      setBackground: () =>
        Effect.gen(function* () {
          if (!streamConfig.background) {
            return Effect.fail("Background is not configured!");
          }

          yield* obs
            .call("RemoveInput", {
              inputName: "Background",
            })
            .pipe(
              Effect.catchAll(Effect.succeed),
              Effect.andThen(Effect.sleep(500)),
            );

          switch (streamConfig.background.source) {
            case "file":
              yield* obs.call("CreateInput", {
                sceneUuid: obs.sceneUuid,
                inputName: "Background",
                inputKind: "image_source",
                inputSettings: {
                  file: streamConfig.background.file,
                },
                sceneItemEnabled: true,
              });
              break;
            case "url":
              yield* Effect.fail("URL backgrounds aren't implemented yet");
              break;
          }
        }),
      setText: (
        inputName: string,
        textConfig: Schema.Schema.Type<typeof StreamConfigTextSchema>,
      ) =>
        Effect.gen(function* () {
          yield* obs
            .call("RemoveInput", { inputName })
            .pipe(
              Effect.catchAll(Effect.succeed),
              Effect.andThen(Effect.sleep(500)),
            );

          const input = yield* obs.call("CreateInput", {
            sceneUuid: obs.sceneUuid,
            inputName: inputName,
            inputKind: "text_ft2_source_v2",
            inputSettings: textConfig.style,
          });

          yield* obs.call("SetSceneItemTransform", {
            sceneUuid: obs.sceneUuid,
            sceneItemId: input.sceneItemId,
            sceneItemTransform: textConfig.transform,
          });
        }),
    };
  }),
);
