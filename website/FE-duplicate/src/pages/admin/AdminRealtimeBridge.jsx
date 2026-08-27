import { useEffect } from 'react';
import mqtt from 'mqtt';
import { getAdminRealtimeMqttConfig } from '../../services/authApi.js';

export const ADMIN_REALTIME_EVENT = 'arduflow:admin-realtime';

export function AdminRealtimeBridge() {
  useEffect(() => {
    let client = null;
    let disposed = false;

    async function connect() {
      try {
        const config = await getAdminRealtimeMqttConfig();
        if (disposed || !config?.enabled || !config?.websocket_url || !Array.isArray(config?.topics) || config.topics.length === 0) {
          return;
        }

        client = mqtt.connect(config.websocket_url, {
          clientId: config.client_id || `arduflow-admin-${Date.now()}`,
          username: config.username || undefined,
          password: config.password || undefined,
          clean: true,
          connectTimeout: 4000,
          reconnectPeriod: 5000,
        });

        client.on('connect', () => {
          config.topics.forEach((topic) => client?.subscribe(topic, { qos: 0 }));
        });

        client.on('message', (topic, message) => {
          let payload = {};
          try {
            payload = JSON.parse(message.toString());
          } catch {
            payload = { raw: message.toString() };
          }

          window.dispatchEvent(new CustomEvent(ADMIN_REALTIME_EVENT, {
            detail: { topic, payload },
          }));
        });
      } catch {
        // Realtime is optional; pages keep using regular API refresh as fallback.
      }
    }

    connect();

    return () => {
      disposed = true;
      if (client) {
        client.end(true);
      }
    };
  }, []);

  return null;
}
