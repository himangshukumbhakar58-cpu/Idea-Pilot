// Illustrative editorial examples, not research findings or measured analytics.
export const DEMO_ID = 'sample-student-tech';
export const goals = ['Grow My Audience', 'Build Authority', 'Increase Engagement', 'Find Better Content Ideas', 'Build a Consistent Strategy'];
export const platforms = ['YouTube', 'Instagram / Reels'];
export const emptyProfile = { name: '', platform: 'YouTube', niche: '', audience: '', language: 'English', goal: goals[3], channelUrl: '', contentUrl: '', competitors: '' };
export const sampleProfile = { ...emptyProfile, name: 'Creator', niche: 'Technology', audience: 'College students exploring practical AI tools' };
export const agents = [
  { id: 'trend', name: 'TrendScout', role: 'The signal finder', description: 'Find relevant trend signals and emerging topics.', activity: 'Researching trends and topic signals.', color: 'blue', icon: 'Radar', findings: ['Explore practical AI workflows for student life.', 'Investigate whether interest is timely using dated, public sources.'], question: 'What is worth paying attention to?' },
  { id: 'audience', name: 'AudienceInsight', role: 'The audience advocate', description: 'Discover audience questions, needs and pain points.', activity: 'Discovering audience questions and needs.', color: 'purple', icon: 'UsersRound', findings: ['Test questions about cost, learning curves and usefulness.', 'Look for recurring problems in public questions and feedback.'], question: 'What does your audience actually need?' },
  { id: 'gap', name: 'CompetitorGap', role: 'The different perspective', description: 'Identify gaps and differentiation opportunities.', activity: 'Analysing public competitor coverage and content gaps.', color: 'mint', icon: 'ScanSearch', findings: ['Compare public content about AI tools for students.', 'Explore a task-first angle instead of an interchangeable tools list.'], question: 'Where can your perspective stand out?' },
  { id: 'strategy', name: 'StrategyArchitect', role: 'The big-picture thinker', description: 'Combine all research into actionable content strategy.', activity: 'Waiting for research agents and preparing final recommendations.', color: 'amber', icon: 'Orbit', findings: ['Start with one useful discovery, then demonstrate a complete workflow.', 'Use feedback to connect the next topic to an actual audience question.'], question: 'How does it all become a plan?' },
];
export const scoreWeights = [
  { key: 'demand', label: 'Audience Demand', weight: 30 },
  { key: 'trend', label: 'Trend Relevance', weight: 25 },
  { key: 'difference', label: 'Differentiation Potential', weight: 20 },
  { key: 'gap', label: 'Competitor Gap', weight: 15 },
  { key: 'evidence', label: 'Evidence Quality', weight: 10 },
];
export function calculateScore(scores) {
  return Math.round(scoreWeights.reduce((total, { key, weight }) => total + Math.min(100, Math.max(0, Number(scores[key]) || 0)) * weight / 100, 0));
}
export const opportunities = [
  { id: 'student-ai', topic: 'AI Tools Every College Student Should Actually Use', angle: 'Focus on tools that genuinely save students time instead of another generic AI tools list.', format: 'YouTube Long Form', shortFormat: 'Long form', confidence: 'High', scores: { demand: 90, trend: 88, difference: 85, gap: 87, evidence: 80 }, reasoning: 'A task-first comparison could connect tool discovery to a recognisable student problem. Validate this hypothesis with real audience and source evidence.', category: 'Practical AI', duration: '8–12 min', icon: 'Sparkles' },
  { id: 'notes-workflow', topic: 'Turn Messy Lecture Notes into a Study System', angle: 'Follow one set of real notes from first draft to a useful revision workflow.', format: 'YouTube Tutorial', shortFormat: 'Tutorial', confidence: 'High', scores: { demand: 88, trend: 80, difference: 91, gap: 84, evidence: 72 }, reasoning: 'A visible before-and-after makes the idea concrete and provides a natural follow-up to tool discovery. Demand is an illustrative assumption.', category: 'Student workflows', duration: '6–9 min', icon: 'NotebookPen' },
  { id: 'free-vs-paid', topic: 'Free vs Paid AI: What Does a Student Really Need?', angle: 'Compare the same study task using free and paid options, with clear limitations.', format: 'Instagram / Reels', shortFormat: 'Reel', confidence: 'Medium', scores: { demand: 86, trend: 83, difference: 82, gap: 78, evidence: 65 }, reasoning: 'Budget is a useful editorial lens for the example audience. A fair comparison could support a thoughtful purchase decision, subject to current product verification.', category: 'Budget tech', duration: '45–60 sec', icon: 'Scale' },
  { id: 'ai-mistakes', topic: '3 AI Study Mistakes That Cost You More Time', angle: 'Demonstrate the failure first, then show a practical fix and a verification habit.', format: 'YouTube Short', shortFormat: 'Short', confidence: 'Medium', scores: { demand: 82, trend: 79, difference: 85, gap: 73, evidence: 68 }, reasoning: 'A problem-and-fix format complements a tutorial without repeating it. Specific examples would need testing before publication.', category: 'Better habits', duration: '45–60 sec', icon: 'Lightbulb' },
  { id: 'week-experiment', topic: 'I Tried an AI-Assisted Study Routine for a Week', angle: 'Document what helped, what failed and what you would keep. Show your process honestly.', format: 'YouTube Long Form', shortFormat: 'Long form', confidence: 'Medium', scores: { demand: 80, trend: 75, difference: 88, gap: 76, evidence: 60 }, reasoning: 'A personal experiment can bring the series together. Present individual experience as experience, without making broad performance claims.', category: 'Creator experiment', duration: '8–10 min', icon: 'FlaskConical' },
];
export function normaliseSavedIds(ids = []) {
  return [...new Set(Array.isArray(ids) ? ids : [])].filter(id => opportunities.some(item => item.id === id));
}

// Editorial intent belongs to the topic, not to a particular day number.
const strategyNotes = {
  'student-ai': { label: 'Find practical tools', objective: 'Help viewers choose useful tools', reason: 'Use specific student tasks to give tool discovery a practical purpose.' },
  'notes-workflow': { label: 'Show the workflow', objective: 'Demonstrate a repeatable study workflow', reason: 'Turn one set of notes into a worked example viewers can follow.' },
  'free-vs-paid': { label: 'Remove the budget barrier', objective: 'Address the budget question', reason: 'Compare the same task fairly so viewers can understand costs and limitations.' },
  'ai-mistakes': { label: 'Build better habits', objective: 'Teach a verification habit', reason: 'Show a specific mistake and correction to complement the practical examples.' },
  'week-experiment': { label: 'Reflect on the experiment', objective: 'Build trust through a documented experiment', reason: 'Connect the student-AI theme to an honest account of what helped and what failed.' },
};

export function buildStrategy(savedIds = []) {
  const priorityIds = normaliseSavedIds(savedIds);
  const selected = [...priorityIds.map(id => opportunities.find(item => item.id === id)), ...opportunities.filter(item => !priorityIds.includes(item.id))];
  const primaryPlatform = selected[0].format.includes('Instagram') ? 'Instagram / Reels' : 'YouTube';
  return [0, 1, 2, 0, 3, 4, 0].map((slot, index) => {
    const item = selected[slot];
    const research = index === 3, review = index === 6;
    const kind = research ? 'Research' : review ? 'Review' : 'Publish';
    const note = strategyNotes[item.id];
    const previous = selected[Math.max(0, slot - 1)];
    const connection = index === 0 ? 'Open the week with your first priority in the shared student-AI theme.' : index === 4 ? `After the listening day, return to the theme with “${item.topic}”. Use any collected feedback to refine it.` : `Follow “${previous.topic}” with another practical perspective on the same student-AI theme.`;
    return {
      id: `${DEMO_ID}:${index + 1}:${item.id}:${kind.toLowerCase()}`,
      day: index + 1, opportunityId: item.id, kind,
      label: research ? 'Listen before you create' : review ? 'Find your next starting point' : note.label,
      topic: research ? 'What is still confusing about your AI study workflow?' : review ? 'Review the week and shortlist unanswered questions' : item.topic,
      platform: research || review ? primaryPlatform : item.format.includes('Instagram') ? 'Instagram / Reels' : 'YouTube',
      format: research ? primaryPlatform === 'Instagram / Reels' ? 'Story question / audience feedback' : 'Audience question / community post' : review ? 'Creator research session' : item.format,
      angle: research ? 'Invite specific questions about the first three examples shared this week.' : review ? 'Choose the next research question using actual feedback, when available.' : item.angle,
      objective: research ? 'Gather audience questions' : review ? 'Prepare the next research cycle' : note.objective,
      reason: research ? `Pause after “${selected[0].topic}”, “${selected[1].topic}” and “${selected[2].topic}” to listen before continuing.` : review ? 'Review the five sample topics and any audience questions to prepare the next research brief.' : `${connection} ${note.reason}`,
    };
  });
}
