<?php

declare(strict_types=1);

namespace Arduflow\Api\Controllers;

use Arduflow\Api\Http\Request;
use Arduflow\Api\Http\Response;
use Arduflow\Api\Repositories\WorkshopRepository;
use Arduflow\Api\Services\AuthSessionService;
use Arduflow\Api\Services\MqttService;

final class WorkshopController
{
    public function __construct(
        private readonly WorkshopRepository $workshops,
        private readonly AuthSessionService $sessions,
        private readonly MqttService $mqtt,
    ) {
    }

    public function index(Request $request): Response
    {
        return Response::json(['workshops' => array_map([$this, 'present'], $this->workshops->all())]);
    }

    public function show(Request $request): Response
    {
        $workshop = $this->workshops->find((int) $request->route('id'));
        return $workshop
            ? Response::json(['workshop' => $this->present($workshop)])
            : Response::json(['message' => 'Workshop tidak ditemukan.'], 404);
    }

    public function create(Request $request): Response
    {
        $admin = $this->sessions->admin($request);
        if (!$admin) {
            return Response::json(['message' => 'Akses admin diperlukan.'], 401);
        }
        $payload = $this->payload($request->json(), false);
        if (is_string($payload)) {
            return Response::json(['message' => $payload], 422);
        }
        $workshop = $this->workshops->create($payload, (int) $admin['id']);
        $this->mqtt->publish('admin/notifications', ['type' => 'workshop.created', 'id' => (int) $workshop['id']]);
        return Response::json(['message' => 'Workshop berhasil dibuat.', 'workshop' => $this->present($workshop)], 201);
    }

    public function update(Request $request): Response
    {
        if (!$this->sessions->admin($request)) {
            return Response::json(['message' => 'Akses admin diperlukan.'], 401);
        }
        $payload = $this->payload($request->json(), true);
        if (is_string($payload)) {
            return Response::json(['message' => $payload], 422);
        }
        $workshop = $this->workshops->update((int) $request->route('id'), $payload);
        if (!$workshop) {
            return Response::json(['message' => 'Workshop tidak ditemukan.'], 404);
        }
        $this->mqtt->publish('admin/notifications', ['type' => 'workshop.updated', 'id' => (int) $workshop['id']]);
        return Response::json(['message' => 'Workshop berhasil diperbarui.', 'workshop' => $this->present($workshop)]);
    }

    public function delete(Request $request): Response
    {
        if (!$this->sessions->admin($request)) {
            return Response::json(['message' => 'Akses admin diperlukan.'], 401);
        }
        $id = (int) $request->route('id');
        if (!$this->workshops->softDelete($id)) {
            return Response::json(['message' => 'Workshop tidak ditemukan.'], 404);
        }
        $this->mqtt->publish('admin/notifications', ['type' => 'workshop.deleted', 'id' => $id]);
        return Response::json(['message' => 'Workshop berhasil dihapus.']);
    }

    private function payload(array $input, bool $partial): array|string
    {
        $result = [];
        $aliases = [
            'title' => ['title'], 'description' => ['description'], 'category' => ['category'],
            'method' => ['method'], 'location' => ['location'], 'meeting_url' => ['meeting_url', 'meetingUrl'],
            'start_at' => ['start_at', 'starts_at', 'startsAt'], 'end_at' => ['end_at', 'ends_at', 'endsAt'],
            'capacity' => ['capacity'], 'status' => ['status'],
            'certificate_enabled' => ['certificate_enabled', 'certificateEnabled'],
        ];
        foreach ($aliases as $target => $keys) {
            foreach ($keys as $key) {
                if (array_key_exists($key, $input)) {
                    $value = $input[$key];
                    $result[$target] = match ($target) {
                        'capacity' => (int) $value,
                        'certificate_enabled' => filter_var($value, FILTER_VALIDATE_BOOL) ? 1 : 0,
                        default => is_string($value) ? trim($value) : $value,
                    };
                    break;
                }
            }
        }
        if ((!$partial && empty($result['title'])) || (array_key_exists('title', $result) && $result['title'] === '')) {
            return 'Judul workshop wajib diisi.';
        }
        if (isset($result['capacity']) && $result['capacity'] < 0) {
            return 'Kapasitas workshop tidak boleh negatif.';
        }
        if (!$partial) {
            $result += [
                'description' => null, 'category' => null, 'method' => null, 'location' => null,
                'meeting_url' => null, 'start_at' => null, 'end_at' => null, 'capacity' => 0,
                'status' => 'draft', 'certificate_enabled' => 0,
            ];
        }
        foreach (['description', 'category', 'method', 'location', 'meeting_url', 'start_at', 'end_at'] as $nullable) {
            if (array_key_exists($nullable, $result) && $result[$nullable] === '') {
                $result[$nullable] = null;
            }
        }
        return $result;
    }

    public function present(array $row): array
    {
        return [
            ...$row,
            'id' => (int) $row['id'],
            'capacity' => (int) $row['capacity'],
            'certificate_enabled' => (bool) $row['certificate_enabled'],
            'starts_at' => $row['start_at'], 'ends_at' => $row['end_at'],
            'startsAt' => $row['start_at'], 'endsAt' => $row['end_at'],
            'meetingUrl' => $row['meeting_url'],
            'certificateEnabled' => (bool) $row['certificate_enabled'],
        ];
    }
}
