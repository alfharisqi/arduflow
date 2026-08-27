<?php

declare(strict_types=1);

namespace Arduflow\Api\Controllers;

use Arduflow\Api\Http\Request;
use Arduflow\Api\Http\Response;
use Arduflow\Api\Repositories\ProgramRepository;
use Arduflow\Api\Services\AuthSessionService;
use Arduflow\Api\Services\MqttService;

final class ProgramController
{
    public function __construct(
        private readonly ProgramRepository $programs,
        private readonly AuthSessionService $sessions,
        private readonly MqttService $mqtt,
    ) {
    }

    public function index(Request $request): Response
    {
        return Response::json(['programs' => array_map([$this, 'present'], $this->programs->all())]);
    }

    public function show(Request $request): Response
    {
        $program = $this->programs->find((int) $request->route('id'));
        return $program ? Response::json(['program' => $this->present($program)]) : Response::json(['message' => 'Program tidak ditemukan.'], 404);
    }

    public function create(Request $request): Response
    {
        if (!$this->sessions->admin($request)) {
            return Response::json(['message' => 'Akses admin diperlukan.'], 401);
        }
        $payload = $this->payload($request->json(), false);
        if (is_string($payload)) {
            return Response::json(['message' => $payload], 422);
        }
        $program = $this->programs->create($payload);
        $this->mqtt->publish('admin/notifications', ['type' => 'program.created', 'id' => (int) $program['id']]);
        return Response::json(['message' => 'Program berhasil dibuat.', 'program' => $this->present($program)], 201);
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
        $program = $this->programs->update((int) $request->route('id'), $payload);
        if (!$program) {
            return Response::json(['message' => 'Program tidak ditemukan.'], 404);
        }
        $this->mqtt->publish('admin/notifications', ['type' => 'program.updated', 'id' => (int) $program['id']]);
        return Response::json(['message' => 'Program berhasil diperbarui.', 'program' => $this->present($program)]);
    }

    public function delete(Request $request): Response
    {
        if (!$this->sessions->admin($request)) {
            return Response::json(['message' => 'Akses admin diperlukan.'], 401);
        }
        $id = (int) $request->route('id');
        if (!$this->programs->softDelete($id)) {
            return Response::json(['message' => 'Program tidak ditemukan.'], 404);
        }
        $this->mqtt->publish('admin/notifications', ['type' => 'program.deleted', 'id' => $id]);
        return Response::json(['message' => 'Program berhasil dihapus.']);
    }

    private function payload(array $input, bool $partial): array|string
    {
        $result = [];
        if (array_key_exists('name', $input) || array_key_exists('title', $input)) {
            $result['name'] = trim((string) ($input['name'] ?? $input['title']));
        }
        foreach (['description', 'status'] as $field) {
            if (array_key_exists($field, $input)) {
                $result[$field] = trim((string) $input[$field]);
            }
        }
        if ((!$partial && empty($result['name'])) || (array_key_exists('name', $result) && $result['name'] === '')) {
            return 'Nama program wajib diisi.';
        }
        if (!$partial) {
            $result += ['description' => null, 'status' => 'draft'];
        }
        if (array_key_exists('description', $result) && $result['description'] === '') {
            $result['description'] = null;
        }
        return $result;
    }

    public function present(array $row): array
    {
        return [...$row, 'id' => (int) $row['id'], 'title' => $row['name']];
    }
}
