// Integration contract only. No requests are made in this frontend phase.
export const backendConnected = false;
export const futureEndpoints = Object.freeze({
  creatorProfile: 'POST /api/creator-profile',
  research: 'POST /api/research',
  researchStatus: 'GET /api/research/:id',
  results: 'GET /api/research/:id/results',
  history: 'GET /api/research/history',
});
export class BackendUnavailableError extends Error {
  constructor() { super('Live AI research requires backend integration.'); this.name = 'BackendUnavailableError'; }
}
export async function requestResearch() { throw new BackendUnavailableError(); }
