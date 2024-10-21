import { HttpApi } from "@effect/platform";
import { ScenesApi } from "./scenes.routes";

export class MyApi extends HttpApi.empty.pipe(HttpApi.addGroup(ScenesApi)) {}
