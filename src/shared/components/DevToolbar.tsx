import { useState, useEffect } from 'react';
import { getScenarioNames } from '@/scenarios/index';
import { loadScenario, getCurrentScenarioName } from '@/scenarios/loader';

export function DevToolbar() {
  const [current] = useState(getCurrentScenarioName());
  const [scenarios, setScenarios] = useState<string[]>([]);

  useEffect(() => {
    setScenarios(getScenarioNames());
  }, []);

  const handleSwitch = (name: string) => {
    if (window.confirm(`Switch to "${name}" scenario? This will reset all data.`)) {
      loadScenario(name);
    }
  };

  if (import.meta.env.PROD) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#1a1a1a',
        color: '#fff',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '13px',
        zIndex: 9999,
        borderTop: '2px solid #333',
      }}
    >
      <span style={{ fontWeight: 600 }}>Scenario:</span>
      <select
        value={current}
        onChange={(e) => handleSwitch(e.target.value)}
        aria-label="Select data scenario"
        style={{
          background: '#333',
          color: '#fff',
          border: '1px solid #555',
          borderRadius: '4px',
          padding: '4px 8px',
        }}
      >
        {scenarios.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <span style={{ color: '#888' }}>
        Current: <strong>{current}</strong>
      </span>
    </div>
  );
}
