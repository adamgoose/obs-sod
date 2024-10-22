import { Context, Effect, Layer } from "effect";
import { OBS, OBSError } from "./obs-websocket-js";
import {
  StreamConfig,
  StreamConfigSceneItemTransformSchema,
  StreamConfigTextSchema,
} from "./config";
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
    playVideo: (
      inputName: string,
      options: {
        url: string;
        blocking?: boolean;
      },
    ) => Effect.Effect<void, OBSError>;
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
      setText: (inputName, textConfig) =>
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
      playVideo: (sceneName, options) =>
        Effect.gen(function* () {
          yield* obs
            .call("RemoveScene", { sceneName })
            .pipe(
              Effect.catchAll(Effect.succeed),
              Effect.andThen(Effect.sleep(500)),
            );

          const scene = yield* obs.call("CreateScene", {
            sceneName,
          });

          const input = yield* obs.call("CreateInput", {
            sceneUuid: scene.sceneUuid,
            inputName: sceneName + "_video",
            inputKind: "ffmpeg_source",
            inputSettings: {
              input: options.url,
              input_format: "mp4",
              is_local_file: false,
            },
            sceneItemEnabled: true,
          });

          yield* obs.call("SetSceneItemTransform", {
            sceneUuid: scene.sceneUuid,
            sceneItemId: input.sceneItemId,
            sceneItemTransform: {
              alignment: 0,
              boundsType: "OBS_BOUNDS_STRETCH",
              positionX: 1920 / 2,
              positionY: 1080 / 2,
              boundsHeight: 1080,
              boundsWidth: 1920,
            },
          });

          yield* Effect.log("Playing video: " + sceneName);
          yield* obs.call("SetCurrentProgramScene", {
            sceneName,
          });

          const waitForEnd = Effect.gen(function* () {
            yield* Effect.async((resume) => {
              obs.client.on("MediaInputPlaybackEnded", ({ inputUuid }) => {
                console.log("ended:", inputUuid);
                if (inputUuid == input.inputUuid) {
                  resume(Effect.succeed(sceneName));
                }
              });
            });

            yield* obs.call("SetCurrentProgramScene", {
              sceneUuid: obs.sceneUuid,
            });

            yield* obs.call("RemoveScene", {
              sceneName,
            });
            yield* Effect.log("Finished video: " + sceneName);
          });

          if (options.blocking) {
            yield* waitForEnd;
          } else {
            yield* Effect.fork(waitForEnd);
          }
        }),
    };
  }),
);
