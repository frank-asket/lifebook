/** "Prayer Sanctuary | LifeBook". Unique titles tell people (and screen readers, on every navigation) where they are. */
export function pageTitle(title?: string | null): string {
  const name = title?.trim();
  return name && name !== 'LifeBook' ? `${name} | LifeBook` : 'LifeBook';
}
