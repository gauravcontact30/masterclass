import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import { learningLinksFor } from '@/lib/media/learning-links';
import { LearningResources } from '@/components/learning-resources';
import { TECHNOLOGY_HANDBOOKS } from '@/lib/pro-learn/technology-handbooks';
import { TECHNOLOGIES_CATALOG } from '@/lib/technology-catalog';
import catalog from '@/lib/catalog-preview.json';
import apiCatalog from '@/lib/api-docs-catalog.json';
import sites from '@/lib/media/learning-sites.json';

const technologies = [...new Set([
  ...catalog.technologies.map(item => item.title),
  ...Object.values(TECHNOLOGIES_CATALOG).flatMap(item => [item.id, item.name]),
  ...TECHNOLOGY_HANDBOOKS.map(item => item.title).filter(title => !title.startsWith('English ')),
  ...apiCatalog.packages.map(item => item.name),
  'Popular AWS services', 'AI terms worth knowing', 'Python handbook',
])];

test.each(technologies)('%s has an official resource and topic-specific platform links', technology => {
  const links = learningLinksFor(technology);
  expect(links.map(link => link.kind)).toEqual(['Official resource', 'Course search', 'Course search']);
  for (const link of links) {
    expect(new URL(link.page).protocol).toBe('https:');
    expect(existsSync(join(process.cwd(), 'public', link.src))).toBe(true);
  }
  expect(new URL(links[1].page).searchParams.get('q')).toBeTruthy();
  expect(new URL(links[2].page).searchParams.get('query')).toBeTruthy();
});

test.each(sites)('$name has a valid local thumbnail and HTTPS destination', site => {
  expect(existsSync(join(process.cwd(), 'public', site.thumbnail))).toBe(true);
  expect(new URL(site.url).protocol).toBe('https:');
});

test('specific technologies never inherit their parent technology links', () => {
  expect(learningLinksFor('React Testing Library')[0].page).toContain('testing-library.com');
  expect(learningLinksFor('Redux Toolkit')[0].page).toContain('redux-toolkit.js.org');
  expect(learningLinksFor('TanStack Query')[0].page).toContain('tanstack.com/query');
  expect(learningLinksFor('Maths')).toEqual([]);
});

test('thumbnail links open resources directly with safe external-link attributes', () => {
  render(<LearningResources technology="React Testing Library" />);
  const shelf = screen.getByRole('region', { name: 'Visual resources for React Testing Library' });
  expect(within(shelf).getByText('3 resources')).toBeInTheDocument();
  const thumbnails = within(shelf).getAllByRole('link', { name: /^Visit / });
  expect(thumbnails).toHaveLength(2);
  for (const link of thumbnails) {
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link.querySelector('img')).not.toBeNull();
  }
});
