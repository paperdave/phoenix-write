import { Dict } from '@davecode/types';
import { ComponentDefinition } from '../registry-utils';

export const levelComponentRegistry: Dict<ComponentDefinition> = {};

Object.values(import.meta.globEager('./*/index.ts'))
  .map(module => module.default)
  .filter(Boolean)
  .forEach(component => {
    levelComponentRegistry[component.type] = component;
  });
