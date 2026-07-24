<?php

use App\Support\View;

$title = $title ?? 'Arduflow';
$description = $description ?? 'Platform edukasi IoT berbasis visual programming untuk belajar Arduino dan project smart home.';
?>
<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="<?= e($description) ?>">
    <title><?= e($title) ?> | Arduflow</title>
    <link rel="stylesheet" href="/assets/css/app.css">
</head>
<body>
    <?php View::partial('Navbar'); ?>
    <main>
        <?php require base_path('app/Pages/' . $page . '.php'); ?>
    </main>
    <?php View::partial('Footer'); ?>
</body>
</html>
