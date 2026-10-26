const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load, React, create, act } = require('../../mobile/test/helpers.cjs');

test('all English/French legal routes remain explicitly unapproved and non-indexed', () => {
  for (const prefix of ['', 'fr/']) for (const document of ['privacy', 'terms']) {
    const relative = prefix ? '../../../' : '../../';
    const page = load(`../../marketing/app/${prefix}${document}/page.tsx`, { [`${relative}components/legal-overview`]: { LegalOverview: 'LegalOverview' } });
    assert.equal(page.metadata.other['lifebook-legal-status'], 'draft');
    assert.equal(page.metadata.robots.index, false);
  }
});

test('French legal pages retain French navigation, draft disclosure and the confirmed operator contact', async () => {
  const { LegalOverview } = load('../../marketing/components/legal-overview.tsx', { './site-frame': { SiteFrame: 'SiteFrame' } });
  let renderer;
  await act(async () => { renderer = create(React.createElement(LegalOverview, { locale: 'fr', document: 'privacy' })); });
  assert.equal(renderer.root.findByType('SiteFrame').props.locale, 'fr');
  assert.match(renderer.root.findByProps({ className: 'legal-notice' }).props.children, /doit être validé/);
  assert.equal(renderer.root.findByType('a').props.href, 'mailto:lifebook.meditation@gmail.com');
  assert.ok(JSON.stringify(renderer.toJSON()).includes('Franck Asket'));
  await act(async () => renderer.update(React.createElement(LegalOverview, { locale: 'fr', document: 'terms' })));
  assert.equal(renderer.root.findByType('h1').props.children, 'Conditions d’utilisation');
  await act(async () => renderer.unmount());
});
