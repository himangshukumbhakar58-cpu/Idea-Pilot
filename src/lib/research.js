import { emptyProfile } from '../data/demo.js';

export const researchObjectives = ['Discover underserved content opportunities', 'Understand audience questions', 'Find a differentiated angle', 'Build a connected content strategy'];

export function createResearchDraft(profile = {}, stored = {}) {
  const defaults = {
    platform: profile.platform || emptyProfile.platform,
    niche: profile.niche || '', audience: profile.audience || '',
    topic: '', objective: researchObjectives[0],
    language: profile.language || emptyProfile.language,
    goal: profile.goal || emptyProfile.goal,
    channelUrl: profile.channelUrl || '', contentUrl: profile.contentUrl || '',
    competitors: profile.competitors || '',
  };
  return Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, typeof stored?.[key] === 'string' ? stored[key] : value]));
}

// A complete request shape for the future adapter. Building it performs no API call.
export function buildResearchRequest(draft, profile = {}) {
  const values = Object.fromEntries(Object.entries(createResearchDraft(profile, draft)).map(([key, value]) => [key, value.trim()]));
  return {
    platform: values.platform, niche: values.niche, topic: values.topic,
    audience: values.audience, objective: values.objective,
    creatorProfile: {
      name: String(profile.name || '').trim(),
      platform: values.platform, niche: values.niche, audience: values.audience,
      language: values.language, goal: values.goal,
      channelUrl: values.channelUrl, contentUrl: values.contentUrl,
      competitors: [...new Set(values.competitors.split(/[\n,]/).map(url => url.trim()).filter(Boolean))],
    },
  };
}
