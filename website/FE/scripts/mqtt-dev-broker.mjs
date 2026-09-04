import net from 'node:net';
import { createServer as createHttpServer } from 'node:http';
import { Aedes } from 'aedes';
import { WebSocketServer, createWebSocketStream } from 'ws';

const broker = await Aedes.createBroker();
const tcpPort = Number(process.env.MQTT_TCP_PORT || 1883);
const wsPort = Number(process.env.MQTT_WS_PORT || 9001);

const tcpServer = net.createServer(broker.handle);
tcpServer.listen(tcpPort, '127.0.0.1', () => {
  console.log(`MQTT TCP broker listening on 127.0.0.1:${tcpPort}`);
});

const httpServer = createHttpServer();
const wsServer = new WebSocketServer({ server: httpServer, path: '/mqtt' });

wsServer.on('connection', (socket) => {
  const stream = createWebSocketStream(socket);
  broker.handle(stream);
});

httpServer.listen(wsPort, '127.0.0.1', () => {
  console.log(`MQTT WebSocket broker listening on ws://127.0.0.1:${wsPort}/mqtt`);
});

function shutdown() {
  wsServer.close();
  httpServer.close();
  tcpServer.close();
  broker.close();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
