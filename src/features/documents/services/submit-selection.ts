import { SelectionPayload } from '../components/pdf-viewer/types';
import { MOCK_CONFIG } from '@/utils/constants';

export async function submitSelectionDummy(payload: SelectionPayload) {
  await new Promise((resolve) => setTimeout(resolve, MOCK_CONFIG.SELECTION_SUBMIT_DELAY_MS));

  return {
    ok: true,
    requestId: crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    payload,
  };
}
