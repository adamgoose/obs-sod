import { HttpApiBuilder, HttpApiGroup } from "@effect/platform";
import { Effect, Layer } from "effect";
import { Schema } from "@effect/schema";
import { OBS, OBSWebSocket } from "../services";
import { MyApi } from "./routes";
import { SceneList } from "../schemas/scenes";

export const ScenesApiLive: Layer.Layer<
  HttpApiGroup.HttpApiGroup.Service<"scenes">,
  never,
  OBS
> = HttpApiBuilder.group(MyApi, "scenes", (handlers) =>
  handlers.pipe(
    HttpApiBuilder.handle("list", () =>
      Effect.gen(function* () {
        const obs = yield* OBS;

        const sceneList = yield* obs.call("GetSceneList");

        return Schema.decodeUnknownSync(SceneList)(sceneList);
      }),
    ),
    HttpApiBuilder.handle("getItems", ({ path: { sceneUuid } }) =>
      Effect.gen(function* () {
        const obs = yield* OBS;

        const scene = yield* obs.call("GetSceneItemList", { sceneUuid });

        return scene;
      }),
    ),
    HttpApiBuilder.handle("removeBackground", () =>
      Effect.gen(function* () {
        const obs = yield* OBS;

        yield* obs.call("RemoveInput", {
          inputName: "Background",
        });
      }),
    ),
    HttpApiBuilder.handle("setBackground", ({ payload: { file } }) =>
      Effect.gen(function* () {
        const obs = yield* OBS;

        yield* obs
          .call("RemoveInput", {
            inputName: "Background",
          })
          .pipe(Effect.catchAll(Effect.succeed));

        yield* Effect.sleep(500);

        const background = yield* obs.call("CreateInput", {
          sceneUuid: obs.sceneUuid,
          inputName: "Background",
          inputKind: "image_source",
          inputSettings: {
            file,
          },
          sceneItemEnabled: false,
        });

        yield* obs.call("SetSceneItemEnabled", {
          sceneUuid: obs.sceneUuid,
          sceneItemId: background.sceneItemId,
          sceneItemEnabled: true,
        });
      }),
    ),
  ),
);
