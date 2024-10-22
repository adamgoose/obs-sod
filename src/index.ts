import { Effect } from "effect";
import { StreamConfig, StreamConfigLive } from "./services/config";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { StreamDesigner, StreamDesignerLive } from "./services/stream-designer";
import { OBS, OBSLive } from "./services/obs-websocket-js";

NodeRuntime.runMain(
  Effect.gen(function* () {
    const obs = yield* OBS;
    const designer = yield* StreamDesigner;
    const streamConfig = yield* StreamConfig;
    yield* Effect.logDebug(streamConfig);

    // yield* Effect.log(
    //   yield* obs.call("GetSceneItemList", {
    //     sceneUuid: obs.sceneUuid,
    //   }),
    //   yield* obs.call("GetInputSettings", {
    //     // sceneUuid: obs.sceneUuid,
    //     // sceneItemId: 4,
    //     inputName: "Media Source",
    //   }),
    // );

    // Configure Stream Settings
    yield* designer.configureStreamService();
    yield* Effect.log("Set Stream Service Settings");

    // Prepare Background
    if (streamConfig.background !== undefined) {
      yield* designer.setBackground();
      yield* Effect.log("Configured Background");
    }

    // Prepare Text
    for (let name in streamConfig.text) {
      yield* designer.setText(name, streamConfig.text[name]);
      yield* Effect.log("Configured text layer: " + name);
    }

    // Activate Splash
    yield* obs.call("SetCurrentProgramScene", {
      sceneUuid: obs.sceneUuid,
    });
    yield* Effect.log("Activated Splash Scene");
  }).pipe(
    Effect.provide(StreamDesignerLive),
    Effect.provide(OBSLive),
    Effect.provide(StreamConfigLive),
    Effect.provide(NodeContext.layer),
  ),
);
