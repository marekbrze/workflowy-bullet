export type ScenarioName = 'empty' | 'minimal' | 'full' | string;

export interface AppData {
  [moduleKey: string]: unknown[];
}
