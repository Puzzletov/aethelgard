import { redactRequest } from "./redactor";

self.onmessage = (event: MessageEvent<unknown>): void => {
  try {
    self.postMessage(redactRequest(event.data));
  } catch {
    throw new Error("redaction_failed");
  }
};
