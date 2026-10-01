import type { ScenarioName, AppData } from './types';
import { emptyScenario } from './empty';
import { minimalScenario } from './minimal';
import { fullScenario } from './full';

const scenarios: Record<ScenarioName, () => AppData> = {};

export function registerScenario(name: ScenarioName, factory: () => AppData) {
  scenarios[name] = factory;
}

export function getScenario(name: ScenarioName): AppData {
  const factory = scenarios[name];
  if (!factory) throw new Error(`Scenario "${name}" not found. Available: ${Object.keys(scenarios).join(', ')}`);
  return factory();
}

export function getScenarioNames(): ScenarioName[] {
  return Object.keys(scenarios);
}

registerScenario('empty', emptyScenario);
registerScenario('minimal', minimalScenario);
registerScenario('full', fullScenario);
