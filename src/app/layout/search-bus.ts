import { signal } from '@angular/core';

export const globalSearchQuery = signal('');

export function setGlobalSearchQuery(v: string) {
  globalSearchQuery.set(v);
}
