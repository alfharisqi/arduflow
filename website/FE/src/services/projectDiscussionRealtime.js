import mqtt from 'mqtt';

const DEFAULT_BROKER_URL = 'wss://broker.hivemq.com:8884/mqtt';
const DEFAULT_TOPIC_PREFIX = 'arduflow/public/project-discussion/v1';

function randomClientId() {
  const randomPart = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replaceAll('-', '')
    : `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  return `arduflow_web_${randomPart}`.slice(0, 60);
}

function projectTopic(projectId) {
  const safeProjectId = String(projectId || '').replace(/[^a-zA-Z0-9_-]/g, '');
  const prefix = String(
    import.meta.env.VITE_PROJECT_DISCUSSION_MQTT_TOPIC_PREFIX || DEFAULT_TOPIC_PREFIX,
  ).replace(/^\/+|\/+$/g, '');
  return `${prefix}/${safeProjectId}`;
}

export function connectProjectDiscussionRealtime(projectId, { onEvent, onStatus } = {}) {
  const brokerUrl = import.meta.env.VITE_PROJECT_DISCUSSION_MQTT_URL || DEFAULT_BROKER_URL;
  const topic = projectTopic(projectId);
  let client;

  try {
    onStatus?.('connecting');
    client = mqtt.connect(brokerUrl, {
      clientId: randomClientId(),
      clean: true,
      keepalive: 30,
      connectTimeout: 10000,
      reconnectPeriod: 2000,
      protocolVersion: 4,
    });
  } catch {
    onStatus?.('offline');
    return { publish: () => false, close: () => {} };
  }

  client.on('connect', () => {
    client.subscribe(topic, { qos: 0 }, (error) => {
      onStatus?.(error ? 'offline' : 'connected');
    });
  });
  client.on('reconnect', () => onStatus?.('connecting'));
  client.on('offline', () => onStatus?.('offline'));
  client.on('close', () => onStatus?.('offline'));
  client.on('error', () => onStatus?.('offline'));
  client.on('message', (receivedTopic, payload) => {
    if (receivedTopic !== topic) return;
    try {
      const event = JSON.parse(payload.toString());
      if (String(event.projectId) === String(projectId)) onEvent?.(event);
    } catch {
      // Invalid public-broker messages are ignored.
    }
  });

  return {
    publish(event = {}) {
      if (!client.connected) return false;
      client.publish(topic, JSON.stringify({
        type: 'discussion.updated',
        projectId: String(projectId),
        updatedAt: new Date().toISOString(),
        nonce: Math.random().toString(36).slice(2),
        ...event,
      }), { qos: 0, retain: false });
      return true;
    },
    close() {
      client.end(true);
    },
  };
}
