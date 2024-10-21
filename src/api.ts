import { Layer } from "effect";
import { HttpApi, HttpApiBuilder } from "@effect/platform";
import { OBS, OBSWebSocket } from "./services";
import { MyApi } from "./api/routes";
import { ScenesApiLive } from "./api/scenes";

export const MyApiLive: Layer.Layer<HttpApi.HttpApi.Service, never, OBS> =
  HttpApiBuilder.api(MyApi).pipe(Layer.provide(ScenesApiLive));
