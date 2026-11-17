import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

test('IdeaPilot routes and local demo workflow', async (suite) => {
  const dom = new JSDOM('<!doctype html><html><body><div id="test-root"></div></body></html>', { url: 'http://localhost/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
  window.scrollTo = () => {};
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { MemoryRouter } = await import('react-router-dom');
  const { act } = React;
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  const { default: App } = await server.ssrLoadModule('/src/App.jsx');
  const { AppProvider } = await server.ssrLoadModule('/src/context/AppContext.jsx');
  let root;
  const text = () => document.body.textContent;
  async function mount(path) {
    if (root) await act(async () => root.unmount());
    root = createRoot(document.getElementById('test-root'));
    await act(async () => root.render(React.createElement(MemoryRouter, { initialEntries: [path], future: { v7_startTransition: true, v7_relativeSplatPath: true } }, React.createElement(AppProvider, null, React.createElement(App)))));
    assert.ok(!text().includes('Something went wrong'), `Error boundary rendered on ${path}`);
  }
  function byLabel(label) {
    const item = [...document.querySelectorAll('label')].find(node => node.textContent === label);
    assert.ok(item, `Label not found: ${label}`);
    return document.getElementById(item.htmlFor);
  }
  async function fill(label, value) {
    const element = byLabel(label);
    const prototype = element.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : element.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
    await act(async () => { Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value); element.dispatchEvent(new window.Event(element.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); });
  }
  async function click(label, exact = false) {
    const target = [...document.querySelectorAll('button,a')].find(node => exact ? node.textContent.trim() === label : node.textContent.includes(label));
    assert.ok(target, `Control not found: ${label}`);
    await act(async () => target.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true })));
  }
  async function submit() {
    const form = document.querySelector('form'); assert.ok(form);
    await act(async () => form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
  }
  try {
    await suite.test('all ten routes render without broken imports', async () => {
      for (const path of ['/', '/login', '/signup', '/onboarding', '/dashboard', '/research', '/results', '/strategy', '/history', '/profile']) {
        await mount(path); assert.ok(document.querySelector('h1,h2'), `No page title: ${path}`);
        assert.ok(document.querySelector('#main-content'), `No main content: ${path}`);
      }
    });
    await suite.test('signup validates passwords and never saves authentication details', async () => {
      await mount('/signup');
      await fill('Name','Test Creator'); await fill('Email','creator@example.com'); await fill('Password','password123'); await fill('Confirm Password','different123'); await submit();
      assert.ok(text().includes('Your passwords do not match'));
      await fill('Confirm Password','password123'); await submit();
      assert.ok(text().includes('Authentication is not connected yet'));
      assert.ok(!JSON.stringify({ ...localStorage }).includes('password123'));
      await click('Continue in Demo Mode'); assert.ok(text().includes("Let's Build Your"));
    });
    await suite.test('a fresh dashboard agrees with its zero-result summary', async () => {
      await mount('/dashboard');
      assert.equal(document.querySelectorAll('.opportunity-card').length, 0);
      assert.ok(text().includes('No research results yet.'));
      assert.equal(document.querySelector('.nav-count').textContent, '0');
    });
    await suite.test('landing composer replaces the static preview and carries a complete brief', async () => {
      localStorage.setItem('ideapilot:researchDraft', JSON.stringify({ language: 'Bengali', goal: 'Build Authority', competitors: 'https://example.com/public-channel' }));
      await mount('/');
      assert.equal(document.querySelectorAll('.pixel-text-animated').length, 2);
      assert.equal(document.querySelectorAll('.product-preview').length, 0);
      assert.equal(document.querySelector('.launcher-send').disabled, true);
      await fill('What would you like to research?', '  Budget travel reels  ');
      await act(async () => document.querySelector('input[name="hero-platform"][value="Instagram / Reels"]').click());
      await submit();
      assert.ok(document.querySelector('.research-form'));
      assert.equal(byLabel('Topic / Question').value, 'Budget travel reels');
      assert.equal(byLabel('Platform').value, 'Instagram / Reels');
      assert.equal(byLabel('Preferred language').value, 'Bengali');
      assert.equal(byLabel('Competitor references').value, 'https://example.com/public-channel');
      assert.equal(JSON.parse(localStorage.getItem('ideapilot:history') || '[]').length, 0);
      localStorage.removeItem('ideapilot:researchDraft');
    });
    await suite.test('the globe lands in a four-agent map without pretending the agents are connected', async () => {
      await mount('/');
      assert.deepEqual([...document.querySelectorAll('[data-globe-waypoint]')].map(node => node.dataset.globeWaypoint), ['hero', 'problems', 'process', 'dock']);
      assert.equal(document.querySelectorAll('.agent-network-stage .agent-card').length, 4);
      assert.deepEqual([...document.querySelectorAll('[data-network-agent]')].map(node => node.dataset.networkAgent), ['trend', 'audience', 'gap', 'strategy']);
      assert.equal(document.querySelectorAll('.agent-network-stage .agent-status').length, 4);
      assert.ok([...document.querySelectorAll('.agent-network-stage .agent-status')].every(node => node.textContent.includes('Not connected')));
      assert.equal(document.querySelector('.research-globe-layer').getAttribute('aria-hidden'), 'true');
      assert.ok(text().includes('A visual map of the workflow. AI agents are not connected yet.'));
    });
    await suite.test('example chips and Enter work without sending during multiline or composition input', async () => {
      await mount('/'); await click('Travel reels', true);
      const input = byLabel('What would you like to research?');
      assert.ok(input.value.includes('Kolkata'));
      assert.equal(document.querySelector('input[name="hero-platform"]:checked').value, 'Instagram / Reels');
      await act(async () => input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true, cancelable: true })));
      assert.ok(document.querySelector('.launcher-card'));
      await act(async () => input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true, cancelable: true })));
      assert.ok(document.querySelector('.launcher-card'));
      await act(async () => input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })));
      assert.ok(byLabel('Topic / Question').value.includes('Kolkata'));
      localStorage.removeItem('ideapilot:researchDraft');
    });
    await suite.test('landing brief survives navigation when local storage cannot write', async () => {
      const originalStorage = globalThis.localStorage;
      try {
        globalThis.localStorage = { getItem: key => originalStorage.getItem(key), setItem() { throw new Error('quota'); } };
        await mount('/'); await fill('What would you like to research?', 'Keep this brief without storage'); await submit();
        assert.equal(byLabel('Topic / Question').value, 'Keep this brief without storage');
        assert.ok(text().includes('Browser storage is unavailable'));
      } finally { globalThis.localStorage = originalStorage; }
    });
    await suite.test('six-step onboarding saves a profile and navigates to dashboard', async () => {
      await mount('/onboarding'); await fill('Creator name','Test Creator'); await submit();
      await fill('Content niche','Technology'); await submit();
      await fill('Target audience','College students who want practical tools'); await submit();
      await fill('Preferred language','English'); await submit(); await submit();
      await fill('Channel URL','https://www.youtube.com/@testcreator'); await submit();
      assert.ok(text().includes('Welcome back, Test Creator'));
      assert.equal(JSON.parse(localStorage.getItem('ideapilot:profile')).niche,'Technology');
      for (const agent of ['TrendScout','AudienceInsight','CompetitorGap','StrategyArchitect']) assert.ok(text().includes(agent));
    });
    await suite.test('research refuses live execution and loads a clearly labelled fixed sample', async () => {
      await mount('/research'); await fill('Topic / Question','How should I explore student AI workflows?'); await submit();
      assert.ok(text().includes('Live AI research requires backend integration.'));
      assert.equal(JSON.parse(localStorage.getItem('ideapilot:history') || '[]').length,0);
      await click('View Demo Research');
      assert.equal(document.querySelectorAll('.opportunity-card').length,5);
      assert.ok(text().includes('This is sample information, not live AI research.'));
      assert.equal(JSON.parse(localStorage.getItem('ideapilot:history')).length,1);
      assert.equal(document.querySelector('.score-orb strong').textContent,'87');
    });
    await suite.test('score, evidence, tabs and local strategy selection work', async () => {
      await click('Score breakdown'); assert.equal(document.querySelectorAll('.score-row').length,5);
      await click('View Evidence'); assert.ok(document.querySelector('[role=dialog]'));
      assert.ok(text().includes('OBSERVED EVIDENCE')); assert.ok(text().includes('AI INTERPRETATION'));
      assert.equal(document.querySelectorAll('.evidence-card a').length,0);
      await act(async () => document.querySelector('[aria-label="Close dialog"]').click());
      assert.ok(!document.querySelector('[role=dialog]'));
      await click('Add to Strategy'); assert.equal(JSON.parse(localStorage.getItem('ideapilot:savedIds')).length,1);
      await click('Research Insights',true); assert.equal(document.querySelectorAll('.insight-card').length,4);
      await click('Evidence',true); assert.equal(document.querySelectorAll('.evidence-card').length,5);
      await click('View 7-Day Strategy'); assert.equal(document.querySelectorAll('.strategy-day').length,7);
      await click('Why this comes next'); assert.ok(document.querySelector('.sequence-reason'));
      await act(async () => document.querySelector('.complete-button').click());
      assert.deepEqual(JSON.parse(localStorage.getItem('ideapilot:completedStrategyItems')),['sample-student-tech:1:student-ai:publish']);
    });
    await suite.test('saved priorities update strategy intent without transferring completion', async () => {
      await mount('/results');
      await click('Added to Strategy', true);
      const budgetCard = [...document.querySelectorAll('.opportunity-card')].find(node => node.textContent.includes('Free vs Paid AI'));
      await act(async () => [...budgetCard.querySelectorAll('button')].find(button => button.textContent === 'Add to Strategy').click());
      await click('View 7-Day Strategy');
      const days = document.querySelectorAll('.strategy-day');
      assert.ok(days[0].textContent.includes('Free vs Paid AI'));
      assert.ok(days[0].textContent.includes('Address the budget question'));
      assert.equal(days[0].querySelector('.complete-button').getAttribute('aria-pressed'), 'false');
      assert.ok(days[2].textContent.includes('Demonstrate a repeatable study workflow'));
      assert.equal(document.querySelectorAll('.saved-priority-list li').length, 1);
      await act(async () => document.querySelector('.saved-priority-list button').click());
      assert.ok(document.querySelector('.strategy-day').textContent.includes('AI Tools Every College Student'));
      assert.equal(document.querySelector('.complete-button').getAttribute('aria-pressed'), 'true');
    });
    await suite.test('profile changes persist, history filters and demo logout work', async () => {
      await mount('/profile'); await fill('Creator name','Updated Creator'); await submit();
      assert.equal(JSON.parse(localStorage.getItem('ideapilot:profile')).name,'Updated Creator');
      await mount('/history'); assert.equal(document.querySelectorAll('.history-item').length,1);
      await fill('Search research','no matching topic'); assert.ok(text().includes('No matching research.'));
      await click('Clear filters'); assert.equal(document.querySelectorAll('.history-item').length,1);
      await fill('Platform','Instagram / Reels'); assert.ok(text().includes('No matching research.'));
      await click('Clear filters'); await click('View Results');
      assert.equal(JSON.parse(localStorage.getItem('ideapilot:history')).length,1);
      await click('Logout',true); assert.ok(text().includes('Welcome back.'));
      assert.equal(JSON.parse(localStorage.getItem('ideapilot:demoSession')),false);
      assert.equal(JSON.parse(localStorage.getItem('ideapilot:profile')).name,'Updated Creator');
    });
    await suite.test('mobile menu, modal focus trap and keyboard dismissal work', async () => {
      await mount('/dashboard');
      await act(async () => document.querySelector('[aria-label="Open navigation"]').click());
      assert.ok(document.querySelector('.sidebar.is-open'));
      await act(async () => document.querySelector('[aria-label="Close navigation"]').click());
      assert.ok(!document.querySelector('.sidebar.is-open'));
      await click('Settings',true); assert.ok(document.querySelector('[role=dialog]'));
      const first = document.querySelector('[aria-label="Close dialog"]'); assert.equal(document.activeElement,first);
      await act(async () => document.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true})));
      assert.equal(document.activeElement.textContent,'Done');
      await act(async () => document.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
      assert.ok(!document.querySelector('[role=dialog]'));
    });
    await suite.test('research drafts survive navigation and profile refresh keeps the topic', async () => {
      await mount('/research');
      await fill('Topic / Question', 'Keep my research question');
      await fill('Preferred language', 'Bengali');
      await fill('Creator goal', 'Build Authority');
      await fill('Competitor references', 'https://example.com/public-channel');
      await mount('/research');
      assert.equal(byLabel('Topic / Question').value, 'Keep my research question');
      assert.equal(byLabel('Preferred language').value, 'Bengali');
      assert.equal(byLabel('Creator goal').value, 'Build Authority');
      await mount('/profile'); await fill('Preferred language', 'Hindi'); await submit();
      await mount('/research');
      assert.equal(byLabel('Preferred language').value, 'Bengali');
      await click('Use current creator profile');
      assert.equal(byLabel('Preferred language').value, 'Hindi');
      assert.equal(byLabel('Topic / Question').value, 'Keep my research question');
      await fill('Competitor references', 'not-a-link'); await submit();
      assert.ok(text().includes('Each competitor reference must be a complete http:// or https:// URL.'));
      assert.equal(JSON.parse(localStorage.getItem('ideapilot:history')).length, 1);
    });
  } finally {
    if (root) await act(async () => root.unmount());
    await server.close(); dom.window.close();
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});
