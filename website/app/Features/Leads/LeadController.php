<?php

namespace App\Features\Leads;

class LeadController
{
    public function store(): void
    {
        $data = [
            'name' => trim($_POST['name'] ?? ''),
            'email' => trim($_POST['email'] ?? ''),
            'phone' => trim($_POST['phone'] ?? ''),
            'interest' => trim($_POST['interest'] ?? 'akses'),
            'message' => trim($_POST['message'] ?? ''),
        ];

        if ($data['name'] === '' || $data['email'] === '') {
            header('Location: /kontak?status=invalid');
            return;
        }

        (new LeadRepository())->create($data);
        header('Location: /kontak?status=sent');
    }
}
