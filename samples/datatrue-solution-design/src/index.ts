import { create } from "./create";
import { deleteTokens } from "./deleteTokens";
import { onOpen } from "./menu";
import { run } from "./run";
import { setTokens } from "./setTokens";

Object.assign(globalThis, {
  create,
  deleteTokens,
  onOpen,
  run,
  setTokens,
})
