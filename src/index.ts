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

    // Configure Stream Settings
    yield* designer.configureStreamService();
    yield* Effect.log("Set Stream Service Settings");

    // Prepare Background
    if (streamConfig.background !== undefined) {
      yield* designer.setBackground();
      yield* Effect.log("Configured Background");
    }

    // Prepare Text
    if (streamConfig.text !== undefined) {
      yield* designer.setText("Title", streamConfig.text.title);
      if (streamConfig.text.subtitle !== undefined) {
        yield* designer.setText("Subtitle", streamConfig.text.subtitle);
      }
      yield* Effect.log("Configured Text");
    }
  }).pipe(
    Effect.provide(StreamDesignerLive),
    Effect.provide(OBSLive),
    Effect.provide(StreamConfigLive),
    Effect.provide(NodeContext.layer),
  ),
);
