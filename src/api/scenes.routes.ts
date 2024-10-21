import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "@effect/schema";
import { SceneItemList, SceneList } from "../schemas/scenes";
import { OBSError } from "./scenes.errors";

const sceneUuid = HttpApiEndpoint.setPath(
  Schema.Struct({
    sceneUuid: Schema.UUID,
  }),
);
export class ScenesApi extends HttpApiGroup.make("scenes").pipe(
  HttpApiGroup.add(
    HttpApiEndpoint.get("list", "/scenes").pipe(
      HttpApiEndpoint.setSuccess(SceneList),
      HttpApiEndpoint.addError(OBSError, { status: 500 }),
    ),
  ),
  HttpApiGroup.add(
    HttpApiEndpoint.get("getItems", "/scenes/:sceneUuid/items").pipe(
      sceneUuid,
      HttpApiEndpoint.setSuccess(SceneItemList),
      HttpApiEndpoint.addError(OBSError, { status: 500 }),
    ),
  ),
  HttpApiGroup.add(
    HttpApiEndpoint.del(
      "removeBackground",
      "/scenes/:sceneUuid/background",
    ).pipe(sceneUuid, HttpApiEndpoint.addError(OBSError, { status: 500 })),
  ),
  HttpApiGroup.add(
    HttpApiEndpoint.post("setBackground", "/scenes/:sceneUuid/background").pipe(
      sceneUuid,
      HttpApiEndpoint.setPayload(
        Schema.Struct({
          file: Schema.String,
        }),
      ),
      HttpApiEndpoint.addError(OBSError, { status: 500 }),
    ),
  ),
) {}
