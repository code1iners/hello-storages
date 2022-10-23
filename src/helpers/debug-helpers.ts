import { dbugger, DebugInput } from "@ce1pers/logger-helpers";

export const debug = (inputs: DebugInput) => {
  if (process.env.NODE_ENV === "development") dbugger(inputs);
};
