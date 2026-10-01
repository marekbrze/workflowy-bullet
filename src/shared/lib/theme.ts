/** Light is the designed default; dark follows the system setting. There is no manual switch. */
export function applyTheme(dark: boolean): void {
  document.documentElement.classList.toggle('dark', dark)
}

export function initTheme(): void {
  const query = window.matchMedia('(prefers-color-scheme: dark)')
  applyTheme(query.matches)
  query.addEventListener('change', (event) => applyTheme(event.matches))
}
