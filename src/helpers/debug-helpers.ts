import { dbugger, DebugInput } from "@ce1pers/logger-helpers";

const DEBUG_MODE = true;

export const debug = (inputs: DebugInput) => {
  if (DEBUG_MODE) dbugger(inputs);
};
