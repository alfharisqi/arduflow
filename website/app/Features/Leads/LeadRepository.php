<?php

namespace App\Features\Leads;

use App\Support\Database;

class LeadRepository
{
    public function create(array $data): void
    {
        $pdo = Database::connection();
        $sql = 'INSERT INTO leads (name, email, phone, interest, message, created_at) VALUES (:name, :email, :phone, :interest, :message, :created_at)';

        $pdo->prepare($sql)->execute([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'interest' => $data['interest'],
            'message' => $data['message'],
            'created_at' => date('Y-m-d H:i:s'),
        ]);
    }
}
