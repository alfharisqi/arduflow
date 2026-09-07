<?php

declare(strict_types=1);

namespace Arduflow\Api\Services;

use Arduflow\Api\Support\Config;

final class MqttService
{
    public function __construct(private readonly Config $config)
    {
    }

    public function enabled(): bool
    {
        return (bool) $this->config->get('mqtt.enabled', false);
    }

    public function publish(string $topic, array $payload): bool
    {
        if (!$this->enabled()) {
            return false;
        }

        $socket = null;
        try {
            $host = (string) $this->config->get('mqtt.host', '127.0.0.1');
            $port = (int) $this->config->get('mqtt.port', 1883);
            $timeout = max(1, (int) $this->config->get('mqtt.timeout_seconds', 2));
            $socket = @stream_socket_client("tcp://{$host}:{$port}", $errorCode, $errorMessage, $timeout);
            if (!is_resource($socket)) {
                return false;
            }
            stream_set_timeout($socket, $timeout);

            $clientId = (string) $this->config->get('mqtt.client_id', 'arduflow-php-api') . '-' . bin2hex(random_bytes(4));
            $username = (string) $this->config->get('mqtt.username', '');
            $password = (string) $this->config->get('mqtt.password', '');
            $flags = 0x02 | ($username !== '' ? 0x80 : 0) | ($password !== '' ? 0x40 : 0);
            $variable = $this->mqttString('MQTT') . chr(4) . chr($flags) . pack('n', 30);
            $body = $this->mqttString($clientId);
            if ($username !== '') {
                $body .= $this->mqttString($username);
            }
            if ($password !== '') {
                $body .= $this->mqttString($password);
            }
            $this->write($socket, chr(0x10) . $this->remainingLength(strlen($variable . $body)) . $variable . $body);
            $connack = $this->readExact($socket, 4);
            if (strlen($connack) !== 4 || ord($connack[0]) !== 0x20 || ord($connack[3]) !== 0) {
                return false;
            }

            $prefix = trim((string) $this->config->get('mqtt.topic_prefix', 'arduflow'), '/');
            $fullTopic = $prefix . '/' . trim($topic, '/');
            if (str_contains($fullTopic, '#') || str_contains($fullTopic, '+')) {
                throw new \InvalidArgumentException('Wildcard MQTT tidak boleh dipakai untuk publish.');
            }
            $message = json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            $packet = $this->mqttString($fullTopic) . $message;
            $this->write($socket, chr(0x30) . $this->remainingLength(strlen($packet)) . $packet);
            $this->write($socket, chr(0xE0) . chr(0));
            return true;
        } catch (\Throwable) {
            return false;
        } finally {
            if (is_resource($socket)) {
                fclose($socket);
            }
        }
    }

    private function mqttString(string $value): string
    {
        return pack('n', strlen($value)) . $value;
    }

    private function remainingLength(int $length): string
    {
        $encoded = '';
        do {
            $digit = $length % 128;
            $length = intdiv($length, 128);
            if ($length > 0) {
                $digit |= 0x80;
            }
            $encoded .= chr($digit);
        } while ($length > 0);
        return $encoded;
    }

    private function write($socket, string $data): void
    {
        $offset = 0;
        while ($offset < strlen($data)) {
            $written = fwrite($socket, substr($data, $offset));
            if ($written === false || $written === 0) {
                throw new \RuntimeException('MQTT write failed.');
            }
            $offset += $written;
        }
    }

    private function readExact($socket, int $length): string
    {
        $result = '';
        while (strlen($result) < $length && !feof($socket)) {
            $chunk = fread($socket, $length - strlen($result));
            if ($chunk === false || $chunk === '') {
                break;
            }
            $result .= $chunk;
        }
        return $result;
    }
}
