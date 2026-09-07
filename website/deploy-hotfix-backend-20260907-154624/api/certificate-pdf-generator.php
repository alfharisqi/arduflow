<?php

declare(strict_types=1);

const ARDUFLOW_PT_PER_MM = 72 / 25.4;

function arduflow_certificate_layout(): array
{
    return [
        'page' => ['width_mm' => 297, 'height_mm' => 210],
        'colors' => [
            'deepNavy' => '#031426',
            'gold' => '#C8872F',
            'goldLight' => '#EBC179',
            'blue' => '#155F7C',
            'paper' => '#FFFDF8',
            'ink' => '#061A36',
        ],
        'dynamic' => [
            'participantName' => [
                'x' => 51, 'y' => 80, 'w' => 195, 'h' => 27,
                'font' => 'times_bold', 'maxSize' => 28, 'minSize' => 15,
                'maxLines' => 2, 'lineHeight' => 1.03, 'align' => 'center',
                'color' => '#061A36', 'uppercase' => true,
            ],
            'description' => [
                'x' => 56, 'y' => 116, 'w' => 185, 'h' => 22,
                'font' => 'times', 'maxSize' => 11.5, 'minSize' => 8.3,
                'maxLines' => 3, 'lineHeight' => 1.12, 'align' => 'center',
                'color' => '#061A36',
            ],
            'organizerLine' => [
                'x' => 70, 'y' => 145, 'w' => 157, 'h' => 8,
                'font' => 'times_bold', 'maxSize' => 12.5, 'minSize' => 8.5,
                'maxLines' => 1, 'lineHeight' => 1, 'align' => 'center',
                'color' => '#061A36',
            ],
            'date' => [
                'x' => 42, 'y' => 160, 'w' => 85, 'h' => 9,
                'font' => 'times', 'maxSize' => 8.8, 'minSize' => 7.1,
                'maxLines' => 2, 'lineHeight' => 1.1, 'align' => 'left',
                'color' => '#061A36',
            ],
            'certificateNumber' => [
                'x' => 190, 'y' => 160, 'w' => 72, 'h' => 9,
                'font' => 'times', 'maxSize' => 8.3, 'minSize' => 6.4,
                'maxLines' => 2, 'lineHeight' => 1.08, 'align' => 'left',
                'color' => '#061A36',
            ],
            'instructor' => [
                'x' => 43, 'y' => 188, 'w' => 70, 'h' => 8,
                'font' => 'times', 'maxSize' => 8.8, 'minSize' => 6.6,
                'maxLines' => 2, 'lineHeight' => 1.03, 'align' => 'center',
                'color' => '#061A36',
            ],
            'organizer' => [
                'x' => 185, 'y' => 188, 'w' => 70, 'h' => 8,
                'font' => 'times', 'maxSize' => 8.8, 'minSize' => 6.6,
                'maxLines' => 2, 'lineHeight' => 1.03, 'align' => 'center',
                'color' => '#061A36',
            ],
        ],
    ];
}

final class ArduflowCertificatePdf
{
    private array $commands = [];

    private const FONT_MAP = [
        'helvetica' => 'F1',
        'helvetica_bold' => 'F2',
        'times' => 'F3',
        'times_bold' => 'F4',
    ];

    public function __construct(
        private readonly float $width,
        private readonly float $height
    ) {}

    public function width(): float
    {
        return $this->width;
    }

    public function height(): float
    {
        return $this->height;
    }

    public function rect(
        float $x,
        float $yTop,
        float $w,
        float $h,
        string $mode = 'S'
    ): void {
        $this->commands[] = sprintf(
            "%.3F %.3F %.3F %.3F re %s\n",
            $x,
            $this->height - $yTop - $h,
            $w,
            $h,
            $mode
        );
    }

    public function line(
        float $x1,
        float $y1Top,
        float $x2,
        float $y2Top,
        float $lineWidth = 1
    ): void {
        $this->commands[] = sprintf(
            "%.3F w %.3F %.3F m %.3F %.3F l S\n",
            $lineWidth,
            $x1,
            $this->height - $y1Top,
            $x2,
            $this->height - $y2Top
        );
    }

    public function circle(
        float $cx,
        float $cyTop,
        float $r,
        string $mode = 'S'
    ): void {
        $cy = $this->height - $cyTop;
        $c = 0.5522847498 * $r;

        $this->commands[] = sprintf(
            "%.3F %.3F m %.3F %.3F %.3F %.3F %.3F %.3F c %.3F %.3F %.3F %.3F %.3F %.3F c %.3F %.3F %.3F %.3F %.3F %.3F c %.3F %.3F %.3F %.3F %.3F %.3F c %s\n",
            $cx + $r, $cy,
            $cx + $r, $cy + $c, $cx + $c, $cy + $r, $cx, $cy + $r,
            $cx - $c, $cy + $r, $cx - $r, $cy + $c, $cx - $r, $cy,
            $cx - $r, $cy - $c, $cx - $c, $cy - $r, $cx, $cy - $r,
            $cx + $c, $cy - $r, $cx + $r, $cy - $c, $cx + $r, $cy,
            $mode
        );
    }

    public function setFill(string $hex): void
    {
        [$r, $g, $b] = arduflow_pdf_rgb($hex);
        $this->commands[] = sprintf("%.4F %.4F %.4F rg\n", $r, $g, $b);
    }

    public function setStroke(string $hex): void
    {
        [$r, $g, $b] = arduflow_pdf_rgb($hex);
        $this->commands[] = sprintf("%.4F %.4F %.4F RG\n", $r, $g, $b);
    }

    public function text(
        string $text,
        float $x,
        float $yTop,
        string $font,
        float $size,
        string $color,
        string $align = 'left',
        float $boxWidth = 0
    ): void {
        $textWidth = arduflow_certificate_estimate_width($text, $size, $font);

        if ($align === 'center') {
            $x += max(0, ($boxWidth - $textWidth) / 2);
        } elseif ($align === 'right') {
            $x += max(0, $boxWidth - $textWidth);
        }

        [$r, $g, $b] = arduflow_pdf_rgb($color);

        $this->commands[] = sprintf(
            "BT %.4F %.4F %.4F rg /%s %.3F Tf %.3F %.3F Td (%s) Tj ET\n",
            $r,
            $g,
            $b,
            self::FONT_MAP[$font] ?? 'F1',
            $size,
            $x,
            $this->height - $yTop - $size,
            arduflow_pdf_encode_text($text)
        );
    }

    public function output(): string
    {
        $content = implode('', $this->commands);

        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',

            sprintf(
                '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %.3F %.3F] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R /F4 7 0 R >> >> /Contents 8 0 R >>',
                $this->width,
                $this->height
            ),

            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold /Encoding /WinAnsiEncoding >>',

            sprintf(
                "<< /Length %d >>\nstream\n%s\nendstream",
                strlen($content),
                $content
            ),
        ];

        $pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
        $offsets = [0];

        foreach ($objects as $index => $object) {
            $objectNumber = $index + 1;

            $offsets[$objectNumber] = strlen($pdf);

            $pdf .=
                $objectNumber
                . " 0 obj\n"
                . $object
                . "\nendobj\n";
        }

        $count = count($objects);
        $xrefOffset = strlen($pdf);

        $pdf .=
            "xref\n0 "
            . ($count + 1)
            . "\n0000000000 65535 f \n";

        for ($i = 1; $i <= $count; $i++) {
            $pdf .= sprintf(
                "%010d 00000 n \n",
                $offsets[$i]
            );
        }

        return $pdf
            . "trailer\n<< /Size "
            . ($count + 1)
            . " /Root 1 0 R >>\n"
            . "startxref\n"
            . $xrefOffset
            . "\n%%EOF";
    }
}

function arduflow_certificate_generate_pdf(array $certificate): string
{
    $layout = arduflow_certificate_layout();

    $pdf = new ArduflowCertificatePdf(
        arduflow_mm_to_pt((float) $layout['page']['width_mm']),
        arduflow_mm_to_pt((float) $layout['page']['height_mm'])
    );

    arduflow_certificate_draw_static(
        $pdf,
        $layout['colors']
    );

    arduflow_certificate_draw_dynamic(
        $pdf,
        $layout['dynamic'],
        $certificate
    );

    return $pdf->output();
}

function arduflow_certificate_draw_static(
    ArduflowCertificatePdf $pdf,
    array $colors
): void {
    $m = static fn(float $value): float =>
        arduflow_mm_to_pt($value);

    $pdf->setFill($colors['deepNavy']);
    $pdf->rect(
        0,
        0,
        $pdf->width(),
        $pdf->height(),
        'f'
    );

    $pdf->setFill($colors['paper']);
    $pdf->rect(
        $m(4),
        $m(3),
        $m(289),
        $m(204),
        'f'
    );

    $pdf->setStroke($colors['gold']);

    $pdf->rect(
        $m(7),
        $m(6),
        $m(283),
        $m(198)
    );

    foreach (
        [
            [12, 11, 285, 11],
            [12, 199, 285, 199],
            [12, 11, 12, 199],
            [285, 11, 285, 199],
        ] as $line
    ) {
        $pdf->line(
            $m($line[0]),
            $m($line[1]),
            $m($line[2]),
            $m($line[3]),
            0.65
        );
    }

    $pdf->setStroke(
        $colors['goldLight']
    );

    for ($i = 0; $i < 8; $i++) {
        $offset = $i * 4.3;

        $left = 18 + $offset;
        $leftEnd = 27 + $offset;

        $right = 279 - $offset;
        $rightEnd = $right - 9;

        $pdf->line(
            $m($left),
            $m(16),
            $m($left),
            $m(51),
            0.35
        );

        $pdf->line(
            $m($left),
            $m(51),
            $m($leftEnd),
            $m(60),
            0.35
        );

        $pdf->circle(
            $m($left),
            $m(16),
            $m(0.9)
        );

        $pdf->circle(
            $m($leftEnd),
            $m(60),
            $m(0.9)
        );

        $pdf->line(
            $m($right),
            $m(16),
            $m($right),
            $m(51),
            0.35
        );

        $pdf->line(
            $m($right),
            $m(51),
            $m($rightEnd),
            $m(60),
            0.35
        );

        $pdf->circle(
            $m($right),
            $m(16),
            $m(0.9)
        );

        $pdf->circle(
            $m($rightEnd),
            $m(60),
            $m(0.9)
        );
    }

    $pdf->setStroke(
        $colors['gold']
    );

    $pdf->line(
        $m(86),
        $m(39),
        $m(211),
        $m(39),
        0.6
    );

    $pdf->circle(
        $m(148.5),
        $m(39),
        $m(1.2),
        'f'
    );

    $pdf->text(
        'ardu',
        $m(108),
        $m(17),
        'helvetica_bold',
        $m(13.5),
        $colors['ink']
    );

    $pdf->text(
        'flow',
        $m(145),
        $m(17),
        'helvetica_bold',
        $m(13.5),
        '#F2C500'
    );

    $pdf->setStroke(
        '#F2C500'
    );

    $pdf->line(
        $m(104),
        $m(17),
        $m(104),
        $m(33),
        1.1
    );

    $pdf->line(
        $m(104),
        $m(33),
        $m(112),
        $m(33),
        1.1
    );

    $pdf->text(
        'SERTIFIKAT',
        $m(57),
        $m(44.8),
        'times_bold',
        $m(23.5),
        $colors['gold'],
        'center',
        $m(183)
    );

    $pdf->text(
        'SERTIFIKAT',
        $m(57),
        $m(44),
        'times_bold',
        $m(23.5),
        $colors['ink'],
        'center',
        $m(183)
    );

    $pdf->text(
        'Workshop Arduflow IDE',
        $m(85),
        $m(71),
        'times_bold',
        $m(12.8),
        $colors['blue'],
        'center',
        $m(127)
    );

    $pdf->setStroke(
        $colors['gold']
    );

    foreach (
        [
            [92, 88, 124, 88],
            [173, 88, 205, 88],
            [91, 111, 206, 111],
            [38, 156, 118, 156],
            [179, 156, 259, 156],
            [38, 184, 108, 184],
            [189, 184, 259, 184],
        ] as $line
    ) {
        $pdf->line(
            $m($line[0]),
            $m($line[1]),
            $m($line[2]),
            $m($line[3]),
            0.45
        );
    }

    $pdf->circle(
        $m(126),
        $m(88),
        $m(0.75),
        'f'
    );

    $pdf->circle(
        $m(171),
        $m(88),
        $m(0.75),
        'f'
    );

    $pdf->circle(
        $m(148.5),
        $m(111),
        $m(1.1),
        'f'
    );

    $pdf->text(
        'Diberikan kepada',
        $m(124),
        $m(84.7),
        'times',
        $m(6.8),
        $colors['ink'],
        'center',
        $m(49)
    );

    arduflow_certificate_draw_seal(
        $pdf,
        $colors
    );

    arduflow_certificate_draw_icons(
        $pdf
    );

    $pdf->text(
        'Instruktur',
        $m(43),
        $m(195),
        'times',
        $m(6.2),
        $colors['ink'],
        'center',
        $m(70)
    );

    $pdf->text(
        'Penyelenggara',
        $m(185),
        $m(195),
        'times',
        $m(6.2),
        $colors['ink'],
        'center',
        $m(70)
    );
}

function arduflow_certificate_draw_dynamic(
    ArduflowCertificatePdf $pdf,
    array $layout,
    array $certificate
): void {
    $participant = (string) (
        $certificate['userName']
        ?? $certificate['user_name']
        ?? 'Nama Peserta'
    );

    $description = (string) (
        $certificate['description']
        ?? 'Atas partisipasinya dan keberhasilan mengikuti kegiatan Workshop Arduflow IDE serta mempelajari visual programming untuk pengembangan proyek IoT.'
    );

    $issuedAt = (string) (
        $certificate['issuedAt']
        ?? $certificate['issued_at']
        ?? $certificate['completedAt']
        ?? $certificate['completed_at']
        ?? date('Y-m-d')
    );

    $number = (string) (
        $certificate['certificateNumber']
        ?? $certificate['certificate_number']
        ?? ''
    );

    $instructor = (string) (
        $certificate['instructor']
        ?? 'Instruktur'
    );

    $organizer = (string) (
        $certificate['organizer']
        ?? 'Arduflow'
    );

    $values = [
        'participantName' =>
            $participant,

        'description' =>
            $description,

        'organizerLine' =>
            'Diselenggarakan oleh '
            . $organizer,

        'date' =>
            'Tanggal: '
            . arduflow_certificate_format_date(
                $issuedAt
            ),

        'certificateNumber' =>
            'Nomor Sertifikat: '
            . $number,

        'instructor' =>
            $instructor,

        'organizer' =>
            $organizer,
    ];

    foreach (
        $values
        as $key => $value
    ) {
        arduflow_draw_text_box(
            $pdf,
            $layout[$key],
            $value
        );
    }
}

function arduflow_certificate_draw_seal(
    ArduflowCertificatePdf $pdf,
    array $colors
): void {
    $m = static fn(float $value): float =>
        arduflow_mm_to_pt($value);

    $cx = $m(148.5);
    $cy = $m(169.5);

    $pdf->setFill(
        $colors['goldLight']
    );

    $pdf->setStroke(
        $colors['gold']
    );

    $pdf->circle(
        $cx,
        $cy,
        $m(15.2),
        'B'
    );

    $pdf->setFill(
        $colors['deepNavy']
    );

    $pdf->circle(
        $cx,
        $cy,
        $m(11.6),
        'f'
    );

    $pdf->setStroke(
        $colors['gold']
    );

    $pdf->circle(
        $cx,
        $cy,
        $m(10.1)
    );

    $pdf->setStroke(
        '#FFFFFF'
    );

    $points = [
        [
            $cx - $m(4),
            $cy - $m(2),
        ],
        [
            $cx,
            $cy - $m(6),
        ],
        [
            $cx + $m(4),
            $cy - $m(1),
        ],
    ];

    $pdf->line(
        $points[0][0],
        $points[0][1],
        $points[1][0],
        $points[1][1],
        1.1
    );

    $pdf->line(
        $points[1][0],
        $points[1][1],
        $points[2][0],
        $points[2][1],
        1.1
    );

    $pdf->line(
        $points[0][0],
        $points[0][1],
        $points[2][0],
        $points[2][1],
        1.1
    );

    foreach (
        $points
        as [$x, $y]
    ) {
        $pdf->circle(
            $x,
            $y,
            $m(1.45)
        );
    }

    $pdf->text(
        '*',
        $cx - $m(1.2),
        $cy - $m(15.4),
        'helvetica_bold',
        $m(6.5),
        $colors['gold']
    );
}

function arduflow_certificate_draw_icons(
    ArduflowCertificatePdf $pdf
): void {
    $m = static fn(float $value): float =>
        arduflow_mm_to_pt($value);

    $pdf->setStroke('#F28A00');
    $pdf->setFill('#F28A00');

    $x = $m(37);
    $y = $m(160);

    $pdf->rect(
        $x,
        $y,
        $m(4.3),
        $m(4.1)
    );

    $pdf->line(
        $x,
        $y + $m(1.25),
        $x + $m(4.3),
        $y + $m(1.25),
        0.45
    );

    $pdf->line(
        $x + $m(1.1),
        $y - $m(0.7),
        $x + $m(1.1),
        $y + $m(0.8),
        0.45
    );

    $pdf->line(
        $x + $m(3.2),
        $y - $m(0.7),
        $x + $m(3.2),
        $y + $m(0.8),
        0.45
    );

    $x = $m(184);
    $y = $m(159.6);

    $points = [
        [2, 0],
        [5, 1.7],
        [5, 5.2],
        [2, 7],
        [-1, 5.2],
        [-1, 1.7],
    ];

    $count = count($points);

    for (
        $i = 0;
        $i < $count;
        $i++
    ) {
        $next =
            ($i + 1)
            % $count;

        $pdf->line(
            $x + $m($points[$i][0]),
            $y + $m($points[$i][1]),
            $x + $m($points[$next][0]),
            $y + $m($points[$next][1]),
            0.5
        );
    }
}

function arduflow_draw_text_box(
    ArduflowCertificatePdf $pdf,
    array $box,
    string $text
): void {
    $font = (string) (
        $box['font']
        ?? 'times'
    );

    $x = arduflow_mm_to_pt(
        (float) $box['x']
    );

    $y = arduflow_mm_to_pt(
        (float) $box['y']
    );

    $w = arduflow_mm_to_pt(
        (float) $box['w']
    );

    $h = arduflow_mm_to_pt(
        (float) $box['h']
    );

    $lineHeightFactor = (float) (
        $box['lineHeight']
        ?? 1.1
    );

    $normalizedText =
        arduflow_certificate_normalize_text(
            $text
        );

    if (
        !empty(
            $box['uppercase']
        )
    ) {
        $normalizedText =
            function_exists(
                'mb_strtoupper'
            )
                ? mb_strtoupper(
                    $normalizedText,
                    'UTF-8'
                )
                : strtoupper(
                    $normalizedText
                );
    }

    $fit =
        arduflow_certificate_fit_text(
            $normalizedText,
            $font,
            arduflow_mm_to_pt(
                (float) (
                    $box['maxSize']
                    ?? 10
                )
            ),
            arduflow_mm_to_pt(
                (float) (
                    $box['minSize']
                    ?? 7
                )
            ),
            $w,
            $h,
            (int) (
                $box['maxLines']
                ?? 1
            ),
            $lineHeightFactor
        );

    $lineHeight =
        $fit['fontSize']
        * $lineHeightFactor;

    $startY =
        $y
        + max(
            0,
            (
                $h
                - count(
                    $fit['lines']
                )
                * $lineHeight
            )
            / 2
        );

    foreach (
        $fit['lines']
        as $index => $line
    ) {
        $pdf->text(
            $line,
            $x,
            $startY
                + $index
                * $lineHeight,
            $font,
            $fit['fontSize'],
            (string) (
                $box['color']
                ?? '#061A36'
            ),
            (string) (
                $box['align']
                ?? 'left'
            ),
            $w
        );
    }
}

function arduflow_certificate_fit_text(
    string $text,
    string $font,
    float $maxSize,
    float $minSize,
    float $boxWidth,
    float $boxHeight,
    int $maxLines,
    float $lineHeightFactor
): array {
    for (
        $fontSize = $maxSize;
        $fontSize >= $minSize;
        $fontSize -= 0.35
    ) {
        $lines =
            arduflow_certificate_wrap_text(
                $text,
                $fontSize,
                $font,
                $boxWidth
            );

        if (
            count($lines) <= $maxLines
            && count($lines)
                * $fontSize
                * $lineHeightFactor
                <= $boxHeight
        ) {
            return [
                'fontSize' =>
                    $fontSize,

                'lines' =>
                    $lines,
            ];
        }
    }

    $lines =
        arduflow_certificate_wrap_text(
            $text,
            $minSize,
            $font,
            $boxWidth
        );

    while (
        count($lines)
        > $maxLines
    ) {
        $last =
            array_pop($lines);

        $lines[
            count($lines) - 1
        ] .=
            ' '
            . $last;
    }

    return [
        'fontSize' =>
            $minSize,

        'lines' =>
            $lines,
    ];
}

function arduflow_certificate_wrap_text(
    string $text,
    float $fontSize,
    string $font,
    float $maxWidth
): array {
    $words =
        preg_split(
            '/\s+/',
            trim($text),
            -1,
            PREG_SPLIT_NO_EMPTY
        )
        ?: [];

    if ($words === []) {
        return [''];
    }

    $spaceWidth =
        arduflow_certificate_estimate_width(
            ' ',
            $fontSize,
            $font
        );

    $lines = [];
    $current = '';
    $currentWidth = 0.0;

    foreach ($words as $word) {
        $wordWidth =
            arduflow_certificate_estimate_width(
                $word,
                $fontSize,
                $font
            );

        $candidateWidth =
            $current === ''
                ? $wordWidth
                : $currentWidth
                    + $spaceWidth
                    + $wordWidth;

        if (
            $current !== ''
            && $candidateWidth > $maxWidth
        ) {
            $lines[] = $current;
            $current = $word;
            $currentWidth = $wordWidth;

            continue;
        }

        $current =
            $current === ''
                ? $word
                : $current
                    . ' '
                    . $word;

        $currentWidth =
            $candidateWidth;
    }

    if ($current !== '') {
        $lines[] = $current;
    }

    return $lines;
}

function arduflow_certificate_estimate_width(
    string $text,
    float $fontSize,
    string $font
): float {
    $width = 0.0;

    $chars =
        preg_split(
            '//u',
            $text,
            -1,
            PREG_SPLIT_NO_EMPTY
        )
        ?: [];

    foreach ($chars as $char) {
        $width += match (true) {
            $char === ' ' =>
                0.28,

            $char >= 'A'
            && $char <= 'Z' =>
                0.66,

            $char >= '0'
            && $char <= '9' =>
                0.54,

            str_contains(
                '.,:;|!()[]-',
                $char
            ) =>
                0.30,

            default =>
                0.50,
        };
    }

    return $width
        * $fontSize
        * (
            str_contains(
                $font,
                'bold'
            )
                ? 1.05
                : 1.0
        );
}

function arduflow_certificate_normalize_text(
    string $text
): string {
    $text =
        preg_replace(
            '/\s+/',
            ' ',
            trim($text)
        )
        ?? '';

    return str_replace(
        [
            '“',
            '”',
            '’',
            '‘',
            '–',
            '—',
        ],
        [
            '"',
            '"',
            "'",
            "'",
            '-',
            '-',
        ],
        $text
    );
}

function arduflow_certificate_format_date(
    ?string $value
): string {
    static $months = [
        '01' => 'Januari',
        '02' => 'Februari',
        '03' => 'Maret',
        '04' => 'April',
        '05' => 'Mei',
        '06' => 'Juni',
        '07' => 'Juli',
        '08' => 'Agustus',
        '09' => 'September',
        '10' => 'Oktober',
        '11' => 'November',
        '12' => 'Desember',
    ];

    $value =
        trim(
            (string) $value
        )
        ?: date('Y-m-d');

    $timestamp =
        strtotime($value);

    if ($timestamp === false) {
        return $value;
    }

    return date(
        'j',
        $timestamp
    )
        . ' '
        . $months[
            date(
                'm',
                $timestamp
            )
        ]
        . ' '
        . date(
            'Y',
            $timestamp
        );
}

function arduflow_mm_to_pt(
    float $mm
): float {
    return $mm
        * ARDUFLOW_PT_PER_MM;
}

function arduflow_pdf_rgb(
    string $hex
): array {
    static $cache = [];

    $hex =
        strtoupper(
            ltrim(
                $hex,
                '#'
            )
        );

    if (
        isset(
            $cache[$hex]
        )
    ) {
        return $cache[$hex];
    }

    if (
        strlen($hex)
        === 3
    ) {
        $hex =
            $hex[0]
            . $hex[0]
            . $hex[1]
            . $hex[1]
            . $hex[2]
            . $hex[2];
    }

    return $cache[$hex] = [
        hexdec(
            substr(
                $hex,
                0,
                2
            )
        ) / 255,

        hexdec(
            substr(
                $hex,
                2,
                2
            )
        ) / 255,

        hexdec(
            substr(
                $hex,
                4,
                2
            )
        ) / 255,
    ];
}

function arduflow_pdf_encode_text(
    string $text
): string {
    $text =
        arduflow_certificate_normalize_text(
            $text
        );

    $encoded =
        iconv(
            'UTF-8',
            'Windows-1252//TRANSLIT//IGNORE',
            $text
        );

    if ($encoded === false) {
        $encoded =
            preg_replace(
                '/[^\x20-\x7E]/',
                '',
                $text
            )
            ?? '';
    }

    return str_replace(
        [
            '\\',
            '(',
            ')',
            "\r",
            "\n",
        ],
        [
            '\\\\',
            '\(',
            '\)',
            ' ',
            ' ',
        ],
        $encoded
    );
}