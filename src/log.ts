import { Signale } from "signale";

export const logger = new Signale({
  // interactive: true,
  config: {
    displayTimestamp: true,
  },
});
