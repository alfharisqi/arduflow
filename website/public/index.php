<?php

require dirname(__DIR__) . '/app/Support/helpers.php';

spl_autoload_register(function (string $class): void {
    $prefix = 'App\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $path = base_path('app/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php');
    if (is_file($path)) {
        require $path;
    }
});

use App\Features\Leads\LeadController;
use App\Support\Router;
use App\Support\View;

$router = new Router();

$router->get('/', fn() => View::render('Home', ['title' => 'Platform Edukasi IoT']));
$router->get('/ide', fn() => View::render('Ide', ['title' => 'ArduFlow IDE']));
$router->get('/akses', fn() => View::render('Access', ['title' => 'Akses Token IDE']));
$router->get('/program', fn() => View::render('Program', ['title' => 'Program dan Workshop']));
$router->get('/tutorial', fn() => View::render('Tutorial', ['title' => 'Tutorial dan Dokumentasi']));
$router->get('/project', fn() => View::render('Project', ['title' => 'Project Showcase']));
$router->get('/partner', fn() => View::render('Partner', ['title' => 'Partner dan Testimoni']));
$router->get('/kontak', fn() => View::render('Kontak', ['title' => 'Kontak dan Request Demo']));
$router->post('/leads', fn() => (new LeadController())->store());

$router->dispatch();
