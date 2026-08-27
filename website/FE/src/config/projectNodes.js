import { NODE_SPRITE_MAP } from './nodeSpriteMap.js';

export const PROJECT_NODE_CATALOG = [
  { type: 'square-wave', name: 'Square Wave', category: 'Generator', description: 'Oscillator signal generator' },
  { type: 'digital-out', name: 'Digital Out', category: 'Hardware I/O', description: 'Set pin HIGH or LOW' },
  { type: 'digital-in', name: 'Digital In', category: 'Hardware I/O', description: 'Read digital pin status' },
  { type: 'pwm-output', name: 'PWM Output', category: 'Hardware I/O', description: 'Write PWM value to output pin' },
  { type: 'analog-in', name: 'Analog In', category: 'Hardware I/O', description: 'Read analog value 0-1023' },
  { type: 'boolean', name: 'Boolean', category: 'Logic & Control', description: 'High or low signal state' },
  { type: 'number', name: 'Number', category: 'Logic & Control', description: 'Static numeric value' },
  { type: 'boolean-value', name: 'Boolean Value', category: 'Logic & Control', description: 'True or false constant' },
  { type: 'compare', name: 'Compare', category: 'Logic & Control', description: 'Compare two values' },
  { type: 'if-then-else', name: 'If Then Else', category: 'Logic & Control', description: 'Conditional branch output' },
  { type: 'logic-and', name: 'Logic AND', category: 'Logic & Control', description: 'True if both inputs are true' },
  { type: 'logic-or', name: 'Logic OR', category: 'Logic & Control', description: 'True if any input is true' },
  { type: 'logic-not', name: 'Logic NOT', category: 'Logic & Control', description: 'Invert input signal' },
  { type: 'delay', name: 'Delay', category: 'Timing', description: 'Delay signal in milliseconds' },
  { type: 'pulse', name: 'Pulse', category: 'Timing', description: 'Output pulse for a duration' },
  { type: 'timer', name: 'Timer', category: 'Timing', description: 'Count up or down by time' },
  { type: 'schedule', name: 'Schedule', category: 'Timing', description: 'Run action on a recurring schedule' },
  { type: 'push-button', name: 'Push Button', category: 'Input', description: 'Manual momentary input' },
  { type: 'light-bulb', name: 'Light Bulb', category: 'Indicators', description: 'On or off visual indicator' },
  { type: 'gauge-display', name: 'Gauge Display', category: 'Indicators', description: 'Visual analog value gauge' },
  { type: 'serial-tx', name: 'Serial TX', category: 'Communication', description: 'Send serial data' },
  { type: 'value-monitor', name: 'Value Monitor', category: 'Monitoring', description: 'Watch live values' },
  { type: 'eeprom-store', name: 'EEPROM Store', category: 'Storage', description: 'Persist value to EEPROM' },
  { type: 'eeprom-read', name: 'EEPROM Read', category: 'Storage', description: 'Read value from EEPROM' },
  { type: 'servo-motor', name: 'Servo Motor', category: 'Output', description: 'Control servo angle 0-180 degrees' },
  { type: 'serial-rx-switch', name: 'Serial RX Switch', category: 'Communication', description: 'Match incoming serial command' },
  { type: 'counter-up-down', name: 'Counter Up/Down', category: 'Logic & Control', description: 'Count trigger events up or down' },
  { type: 'latch-sr-hold', name: 'Latch (SR/Hold)', category: 'Logic & Control', description: 'Set and reset held output state' },
  { type: 'math-operation', name: 'Math Operation', category: 'Logic & Control', description: 'Run arithmetic operation' },
  { type: 'shift-register-8ch', name: 'Shift Register 8-CH', category: 'Hardware I/O', description: 'Control 8-channel shift register output' },
];

const NODE_TYPE_ALIASES = new Map([
  ['pwm / analog out', 'pwm-output'],
  ['pwm output', 'pwm-output'],
  ['numeric value', 'number'],
  ['boolean (high/low)', 'boolean'],
  ['comparator', 'compare'],
  ['pulse timer', 'pulse'],
  ['pushbutton', 'push-button'],
  ['latch (sr / hold)', 'latch-sr-hold'],
  ['latch (sr/hold)', 'latch-sr-hold'],
  ['shift register 8-ch', 'shift-register-8ch'],
  ['shift register 8ch', 'shift-register-8ch'],
]);

export function normalizeNodeType(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getNodeTypeFromName(name) {
  const label = String(name || '').trim().toLowerCase();
  const alias = NODE_TYPE_ALIASES.get(label);

  if (alias) {
    return alias;
  }

  const type = normalizeNodeType(name);

  return NODE_SPRITE_MAP[type] ? type : '';
}

export function getProjectNodeType(node) {
  const directType = normalizeNodeType(node?.type);

  if (NODE_SPRITE_MAP[directType]) {
    return directType;
  }

  return getNodeTypeFromName(node?.name || node?.title);
}

export function normalizeProjectNode(node) {
  if (!node || typeof node !== 'object') {
    const name = String(node || '').trim();
    const type = getNodeTypeFromName(name);

    return {
      type,
      name: name || 'Node ArduFlow',
      category: '',
      description: '',
    };
  }

  const type = getProjectNodeType(node);

  return {
    ...node,
    type,
    name: node.name || node.title || 'Node ArduFlow',
    category: node.category || '',
    description: node.description || '',
  };
}