<?php

declare(strict_types=1);

require_once dirname(__DIR__) . DIRECTORY_SEPARATOR . 'api' . DIRECTORY_SEPARATOR . 'certificate-pdf-generator.php';

$outputDirectory = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'samples' . DIRECTORY_SEPARATOR . 'certificates';

if (!is_dir($outputDirectory) && !mkdir($outputDirectory, 0775, true) && !is_dir($outputDirectory)) {
    fwrite(STDERR, "Failed to create sample output directory: {$outputDirectory}\n");
    exit(1);
}

$samples = [
    [
        'filename' => 'sample-certificate-short-name.pdf',
        'userName' => 'Dimas Permana',
        'description' => 'Atas partisipasinya dan keberhasilan mengikuti kegiatan Workshop Arduflow IDE serta mempelajari visual programming untuk pengembangan proyek IoT.',
        'issuedAt' => '2026-08-12',
        'certificateNumber' => 'AFW-CERT-2026-SHORT1',
        'instructor' => 'Dhafa Firjatullah',
        'organizer' => 'Arduflow IDE',
    ],
    [
        'filename' => 'sample-certificate-long-name.pdf',
        'userName' => 'Dhafa Firjatullah Hikmal Pratama Nugraha',
        'description' => 'Atas partisipasinya dan keberhasilan mengikuti kegiatan Workshop Arduflow IDE serta mempelajari visual programming untuk pengembangan proyek IoT.',
        'issuedAt' => '2026-08-20',
        'certificateNumber' => 'AFW-CERT-2026-LONG-NAME-8871',
        'instructor' => 'Bapak Ali Prasetyo Santoso',
        'organizer' => 'Arduflow Indonesia Education Lab',
    ],
    [
        'filename' => 'sample-certificate-long-description.pdf',
        'userName' => 'Siti Aminah Lestari',
        'description' => 'Atas partisipasi aktif, kedisiplinan, dan keberhasilannya mengikuti seluruh rangkaian kegiatan Workshop Arduflow IDE dari pengenalan komponen, visual programming, sampai presentasi mini proyek IoT.',
        'issuedAt' => '2026-09-05',
        'certificateNumber' => 'AFW-CERT-2026-DESC-2239',
        'instructor' => 'Tim Mentor Arduflow',
        'organizer' => 'Arduflow',
    ],
];

foreach ($samples as $sample) {
    $filename = $sample['filename'];
    unset($sample['filename']);
    $pdf = arduflow_certificate_generate_pdf($sample);
    $destination = $outputDirectory . DIRECTORY_SEPARATOR . $filename;
    file_put_contents($destination, $pdf, LOCK_EX);
    echo $destination . PHP_EOL;
}
