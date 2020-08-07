import { create } from "./create";
import { deleteTokens } from "./deleteTokens";
import { onOpen } from "./menu";
import { run } from "./run";
import { setTokens } from "./setTokens";

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
