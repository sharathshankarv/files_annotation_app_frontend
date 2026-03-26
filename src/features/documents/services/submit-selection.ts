import { SelectionPayload } from "../components/pdf-viewer/types";

export async function submitSelectionDummy(payload: SelectionPayload) {
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    ok: true,
    requestId: crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    payload,
  };
}
