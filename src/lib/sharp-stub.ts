export default function () {
  // no-op: @xenova/transformers pulls in sharp for Node-only image I/O.
  // We only use the feature-extraction pipeline, so a stub is enough for the browser build.
}
