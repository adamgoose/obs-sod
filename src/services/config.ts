import { Schema } from "@effect/schema";
import { Context, Effect, Layer } from "effect";
import { FileSystem } from "@effect/platform";
import YAML from "yaml";

export class StreamConfig extends Context.Tag("StreamConfig")<
  StreamConfig,
  Schema.Schema.Type<typeof StreamConfigSchema>
>() {}

// export const StreamConfigLive = Layer.effect(
//   StreamConfig,
//   Effect.gen(function* () {
//     const fs = yield* FileSystem.FileSystem;
//     const raw = yield* fs.readFile("./schema.yaml");
//     const parsed = YAML.parse(raw.toString());

//     return Schema.decodeUnknownSync(StreamConfigSchema)(parsed);
//   }),
// );

export const StreamConfigLive = Layer.effect(
  StreamConfig,
  Effect.tryPromise(async () => (await import("../../config.ts")).default),
);

export enum StreamConfigSceneItemTransformAlignment {
  OBS_ALIGN_CENTER = 0,
  OBS_ALIGN_LEFT = 1 << 0,
  OBS_ALIGN_RIGHT = 1 << 1,
  OBS_ALIGN_TOP = 1 << 2,
  OBS_ALIGN_BOTTOM = 1 << 3,
}
export const StreamConfigSceneItemTransformAlignmentSchema = Schema.Enums(
  StreamConfigSceneItemTransformAlignment,
);

export const StreamConfigSceneItemTransformSchema = Schema.Struct({
  alignment: Schema.optionalWith(Schema.Int, {
    default: () =>
      StreamConfigSceneItemTransformAlignment.OBS_ALIGN_LEFT |
      StreamConfigSceneItemTransformAlignment.OBS_ALIGN_TOP,
  }),
  positionX: Schema.Number,
  positionY: Schema.Number,
  scaleX: Schema.optionalWith(Schema.Number, { default: () => 1 }),
  scaleY: Schema.optionalWith(Schema.Number, { default: () => 1 }),
});

export const StreamConfigTextStyleSchema = Schema.Struct({
  text: Schema.String,
  drop_shadow: Schema.optionalWith(Schema.Boolean, { default: () => false }),
  color1: Schema.optionalWith(Schema.Int, { default: () => 0xff000000 }),
  color2: Schema.optionalWith(Schema.Int, { default: () => 0xff000000 }),
});

export const StreamConfigTextSchema = Schema.Struct({
  style: StreamConfigTextStyleSchema,
  transform: StreamConfigSceneItemTransformSchema,
});

export const StreamConfigActionPlayVideoSchema = Schema.Struct({
  type: Schema.Literal("play_video"),
  url: Schema.String,
});

export const StreamConfigActionWaitUntilSchema = Schema.Struct({
  type: Schema.Literal("wait_until"),
  until: Schema.Date,
});

export const StreamConfigActionSetTextSchema = Schema.Struct({
  type: Schema.Literal("set_text"),
  text: Schema.Record({ key: Schema.String, value: StreamConfigTextSchema }),
});

export const StreamConfigActionStartCountdownSchema = Schema.Struct({
  type: Schema.Literal("start_countdown"),
  until: Schema.Date,
  style: StreamConfigTextStyleSchema.omit("text"),
  transform: StreamConfigSceneItemTransformSchema,
});

export const StreamConfigActionSchema = Schema.Union(
  StreamConfigActionPlayVideoSchema,
  StreamConfigActionWaitUntilSchema,
  StreamConfigActionSetTextSchema,
  StreamConfigActionStartCountdownSchema,
);

export const StreamConfigSchema = Schema.Struct({
  obs: Schema.optionalWith(
    Schema.Struct({
      address: Schema.String,
      password: Schema.optional(Schema.String),
    }),
    {
      default: () => ({
        address: "ws://127.0.0.1:4455",
      }),
    },
  ),
  rtmp: Schema.Struct({
    server: Schema.String,
    key: Schema.optionalWith(Schema.String, { default: () => "" }),
  }),
  background: Schema.optional(
    Schema.Union(
      Schema.Struct({
        source: Schema.Literal("file"),
        file: Schema.String,
      }),
      Schema.Struct({
        source: Schema.Literal("url"),
        url: Schema.String,
      }),
    ),
  ),
  text: Schema.optional(
    Schema.Record({ key: Schema.String, value: StreamConfigTextSchema }),
  ),
  actions: Schema.Array(StreamConfigActionSchema),
});
