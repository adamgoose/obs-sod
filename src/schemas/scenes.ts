import { Schema } from "@effect/schema";

export const Scene = Schema.Struct({
  sceneIndex: Schema.Int,
  sceneName: Schema.String,
  sceneUuid: Schema.UUID,
});

export const SceneList = Schema.Struct({
  currentProgramSceneName: Schema.String,
  currentProgramSceneUuid: Schema.String,
  currentPreviewSceneName: Schema.optionalWith(Schema.String, {
    nullable: true,
  }),
  currentPreviewSceneUuid: Schema.optionalWith(Schema.String, {
    nullable: true,
  }),
  scenes: Schema.Array(Scene),
});

export const SceneItem = Schema.Struct({
  //
});

export const SceneItemList = Schema.Struct({
  sceneItems: Schema.Array(SceneItem),
});
