import { deleteTokens } from "../../common/src/deleteTokens";
import { setTokens } from "../../common/src/setTokens";
import { create } from "./create";
import { onOpen } from "./menu";
import { run } from "./run";

// @ts-ignore
global.create = create;
// @ts-ignore
global.deleteTokens = deleteTokens;
// @ts-ignore
global.onOpen = onOpen;
// @ts-ignore
global.run = run;
// @ts-ignore
global.setTokens = setTokens;
