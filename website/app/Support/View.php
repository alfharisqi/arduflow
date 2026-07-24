<?php

namespace App\Support;

class View
{
    public static function render(string $page, array $data = []): void
    {
        extract($data, EXTR_SKIP);
        require base_path('app/Components/Layout.php');
    }

    public static function partial(string $component, array $data = []): void
    {
        extract($data, EXTR_SKIP);
        require base_path('app/Components/' . $component . '.php');
    }
}
