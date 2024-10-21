import { Context, Effect } from "effect";
import OBSWebSocketJS, {
  type OBSRequestTypes,
  type OBSResponseTypes,
} from "obs-websocket-js";
import type { OBSError } from "./api/scenes.errors";

export class OBSWebSocket extends Context.Tag("OBSWebSocket")<
  OBSWebSocket,
  OBSWebSocketJS
>() {}

export class OBS extends Context.Tag("OBS")<
  OBS,
  {
    call: <Type extends keyof OBSRequestTypes>(
      requestType: Type,
      requestData?: OBSRequestTypes[Type],
    ) => Effect.Effect<OBSResponseTypes[Type], OBSError, never>;
    sceneUuid: string;
  }
>() {}
