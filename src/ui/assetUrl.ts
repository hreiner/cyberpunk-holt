/** URL d'un asset servi depuis `public/assets`, compatible avec GitHub Pages. */
export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}assets/${path}`;
}
