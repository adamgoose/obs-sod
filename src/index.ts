import { Effect, Logger, LogLevel } from "effect";
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

    // yield* obs.call("StartStream");
    // yield* Effect.log("Started Live Streaming")

    // Do other stuff
    for (let step of streamConfig.actions) {
      yield* Effect.log("Starting [" + step.type + "] step");

      switch (step.type) {
        case "wait_until":
          yield* Effect.sleep(step.until.getTime() - new Date().getTime());
          break;
        case "play_video":
          yield* designer.playVideo("vid", {
            url: step.url,
            blocking: false,
          });
          break;
        case "set_text":
          for (let name in step.text) {
            yield* designer.updateText(name, step.text[name]);
          }
          break;
        case "start_countdown":
          yield* designer.startCountdown(step);
          break;
      }

      yield* Effect.log("Finishing [" + step.type + "] step");
    }

    // yield* obs.call("StopStream");
    // yield* Effect.log("Finished Live Stream")
  }).pipe(
    Effect.provide(StreamDesignerLive),
    Effect.provide(OBSLive),
    Effect.provide(StreamConfigLive),
    Effect.provide(NodeContext.layer),
    Effect.catchTag("OBSError", Effect.logError),
    Logger.withMinimumLogLevel(LogLevel.Debug),
  ),
);
