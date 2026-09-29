import sites from './learning-sites.json';

export type LearningLink = {
  title: string;
  page: string;
  credit: string;
  src: string;
  kind: 'Official resource' | 'Course search';
};

const normalize = (name: string) => name.toLowerCase().replace(/[.+&()_-]/g, ' ').replace(/\s+/g, ' ').trim();

/** Longest whole-name match keeps React Testing Library and Redux Toolkit distinct. */
export function learningLinksFor(technology: string): LearningLink[] {
  const name = normalize(technology);
  const matches = sites.flatMap(site => [site.name, ...site.aliases].map(alias => ({ site, alias: normalize(alias) })))
    .filter(({ alias }) => name === alias || name.startsWith(`${alias} `))
    .sort((a, b) => b.alias.length - a.alias.length);
  const site = matches[0]?.site;
  if (!site) return [];
  const query = encodeURIComponent(site.name);
  return [
    { title: `${site.name}: official website & documentation`, page: site.url, credit: new URL(site.url).hostname, src: site.thumbnail, kind: 'Official resource' },
    { title: `${site.name} courses on Udemy`, page: `https://www.udemy.com/courses/search/?q=${query}`, credit: 'Udemy', src: '/images/learning/udemy.svg', kind: 'Course search' },
    { title: `${site.name} courses on Coursera`, page: `https://www.coursera.org/courses?query=${query}`, credit: 'Coursera', src: '/images/learning/coursera.svg', kind: 'Course search' },
  ];
}
