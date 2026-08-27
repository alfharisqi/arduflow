<?php

declare(strict_types=1);

/**
 * Server-side PDF generator for ArduFlow certificates.
 *
 * The layout is intentionally fixed to A4 landscape so generated certificates
 * are independent from browser viewport size, canvas scaling, and screenshots.
 */

function arduflow_certificate_layout(): array
{
    return [
        'page' => [
            'width_mm' => 297,
            'height_mm' => 210,
        ],
        'colors' => [
            'navy' => '#061D35',
            'deepNavy' => '#031426',
            'gold' => '#C8872F',
            'goldLight' => '#EBC179',
            'blue' => '#155F7C',
            'paper' => '#FFFDF8',
            'ink' => '#061A36',
            'muted' => '#53616F',
        ],
        'dynamic' => [
            'participantName' => [
                'x' => 51,
                'y' => 80,
                'w' => 195,
                'h' => 27,
                'font' => 'times_bold',
                'maxSize' => 28,
                'minSize' => 15,
                'maxLines' => 2,
                'lineHeight' => 1.03,
                'align' => 'center',
                'color' => '#061A36',
                'uppercase' => true,
            ],
            'description' => [
                'x' => 56,
                'y' => 116,
                'w' => 185,
                'h' => 22,
                'font' => 'times',
                'maxSize' => 11.5,
                'minSize' => 8.3,
                'maxLines' => 3,
                'lineHeight' => 1.12,
                'align' => 'center',
                'color' => '#061A36',
            ],
            'organizerLine' => [
                'x' => 70,
                'y' => 145,
                'w' => 157,
                'h' => 8,
                'font' => 'times_bold',
                'maxSize' => 12.5,
                'minSize' => 8.5,
                'maxLines' => 1,
                'lineHeight' => 1,
                'align' => 'center',
                'color' => '#061A36',
            ],
            'date' => [
                'x' => 42,
                'y' => 160,
                'w' => 85,
                'h' => 9,
                'font' => 'times',
                'maxSize' => 8.8,
                'minSize' => 7.1,
                'maxLines' => 2,
                'lineHeight' => 1.1,
                'align' => 'left',
                'color' => '#061A36',
            ],
            'certificateNumber' => [
                'x' => 190,
                'y' => 160,
                'w' => 72,
                'h' => 9,
                'font' => 'times',
                'maxSize' => 8.3,
                'minSize' => 6.4,
                'maxLines' => 2,
                'lineHeight' => 1.08,
                'align' => 'left',
                'color' => '#061A36',
            ],
            'instructor' => [
                'x' => 43,
                'y' => 188,
                'w' => 70,
                'h' => 8,
                'font' => 'times',
                'maxSize' => 8.8,
                'minSize' => 6.6,
                'maxLines' => 2,
                'lineHeight' => 1.03,
                'align' => 'center',
                'color' => '#061A36',
            ],
            'organizer' => [
                'x' => 185,
                'y' => 188,
                'w' => 70,
                'h' => 8,
                'font' => 'times',
                'maxSize' => 8.8,
                'minSize' => 6.6,
                'maxLines' => 2,
                'lineHeight' => 1.03,
                'align' => 'center',
                'color' => '#061A36',
            ],
        ],
    ];
}

final class ArduflowCertificatePdf
{
    private float $width;
    private float $height;
    private array $commands = [];
    private array $fontMap = [
        'helvetica' => 'F1',
        'helvetica_bold' => 'F2',
        'times' => 'F3',
        'times_bold' => 'F4',
    ];

    public function __construct(float $width, float $height)
    {
        $this->width = $width;
        $this->height = $height;
    }

    public function width(): float
    {
        return $this->width;
    }

    public function height(): float
    {
        return $this->height;
    }

    public function rect(float $x, float $yTop, float $w, float $h, string $mode = 'S'): void
    {
        $y = $this->height - $yTop - $h;
        $this->commands[] = sprintf("%.3F %.3F %.3F %.3F re %s\n", $x, $y, $w, $h, $mode);
    }

    public function line(float $x1, float $y1Top, float $x2, float $y2Top, float $lineWidth = 1): void
    {
        $this->commands[] = sprintf(
            "%.3F w %.3F %.3F m %.3F %.3F l S\n",
            $lineWidth,
            $x1,
            $this->height - $y1Top,
            $x2,
            $this->height - $y2Top
        );
    }

    public function circle(float $cx, float $cyTop, float $r, string $mode = 'S'): void
    {
        $cy = $this->height - $cyTop;
        $c = 0.5522847498 * $r;
        $this->commands[] = sprintf(
            "%.3F %.3F m %.3F %.3F %.3F %.3F %.3F %.3F c %.3F %.3F %.3F %.3F %.3F %.3F c %.3F %.3F %.3F %.3F %.3F %.3F c %.3F %.3F %.3F %.3F %.3F %.3F c %s\n",
            $cx + $r,
            $cy,
            $cx + $r,
            $cy + $c,
            $cx + $c,
            $cy + $r,
            $cx,
            $cy + $r,
            $cx - $c,
            $cy + $r,
            $cx - $r,
            $cy + $c,
            $cx - $r,
            $cy,
            $cx - $r,
            $cy - $c,
            $cx - $c,
            $cy - $r,
            $cx,
            $cy - $r,
            $cx + $c,
            $cy - $r,
            $cx + $r,
            $cy - $c,
            $cx + $r,
            $cy,
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

    public function text(string $text, float $x, float $yTop, string $font, float $size, string $color, string $align = 'left', float $boxWidth = 0): void
    {
        $fontId = $this->fontMap[$font] ?? 'F1';
        $encoded = arduflow_pdf_encode_text($text);
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
            $fontId,
            $size,
            $x,
            $this->height - $yTop - $size,
            $encoded
        );
    }

    public function output(): string
    {
        $content = implode('', $this->commands);
        $objects = [];
        $objects[] = '<< /Type /Catalog /Pages 2 0 R >>';
        $objects[] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
        $objects[] = sprintf(
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %.3F %.3F] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R /F4 7 0 R >> >> /Contents 8 0 R >>',
            $this->width,
            $this->height
        );
        $objects[] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
        $objects[] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
        $objects[] = '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>';
        $objects[] = '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold /Encoding /WinAnsiEncoding >>';
        $objects[] = sprintf("<< /Length %d >>\nstream\n%s\nendstream", strlen($content), $content);

        $pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
        $offsets = [0];

        foreach ($objects as $index => $object) {
            $offsets[$index + 1] = strlen($pdf);
            $pdf .= ($index + 1) . " 0 obj\n" . $object . "\nendobj\n";
        }

        $xrefOffset = strlen($pdf);
        $pdf .= "xref\n0 " . (count($objects) + 1) . "\n";
        $pdf .= "0000000000 65535 f \n";

        for ($i = 1; $i <= count($objects); $i++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
        }

        $pdf .= "trailer\n<< /Size " . (count($objects) + 1) . " /Root 1 0 R >>\n";
        $pdf .= "startxref\n" . $xrefOffset . "\n%%EOF";

        return $pdf;
    }
}

function arduflow_certificate_generate_pdf(array $certificate): string
{
    $layout = arduflow_certificate_layout();
    $pageWidth = arduflow_mm_to_pt((float) $layout['page']['width_mm']);
    $pageHeight = arduflow_mm_to_pt((float) $layout['page']['height_mm']);
    $colors = $layout['colors'];
    $pdf = new ArduflowCertificatePdf($pageWidth, $pageHeight);

    arduflow_certificate_draw_static($pdf, $colors);
    arduflow_certificate_draw_dynamic($pdf, $layout['dynamic'], $certificate);

    return $pdf->output();
}

function arduflow_certificate_draw_static(ArduflowCertificatePdf $pdf, array $colors): void
{
    $pdf->setFill($colors['deepNavy']);
    $pdf->rect(0, 0, $pdf->width(), $pdf->height(), 'f');

    $pdf->setFill($colors['paper']);
    $pdf->rect(arduflow_mm_to_pt(4), arduflow_mm_to_pt(3), arduflow_mm_to_pt(289), arduflow_mm_to_pt(204), 'f');

    $pdf->setStroke($colors['gold']);
    $pdf->rect(arduflow_mm_to_pt(7), arduflow_mm_to_pt(6), arduflow_mm_to_pt(283), arduflow_mm_to_pt(198), 'S');
    $pdf->line(arduflow_mm_to_pt(12), arduflow_mm_to_pt(11), arduflow_mm_to_pt(285), arduflow_mm_to_pt(11), 0.65);
    $pdf->line(arduflow_mm_to_pt(12), arduflow_mm_to_pt(199), arduflow_mm_to_pt(285), arduflow_mm_to_pt(199), 0.65);
    $pdf->line(arduflow_mm_to_pt(12), arduflow_mm_to_pt(11), arduflow_mm_to_pt(12), arduflow_mm_to_pt(199), 0.65);
    $pdf->line(arduflow_mm_to_pt(285), arduflow_mm_to_pt(11), arduflow_mm_to_pt(285), arduflow_mm_to_pt(199), 0.65);

    $pdf->setStroke($colors['goldLight']);
    for ($i = 0; $i < 8; $i++) {
        $offset = $i * 4.3;
        $pdf->line(arduflow_mm_to_pt(18 + $offset), arduflow_mm_to_pt(16), arduflow_mm_to_pt(18 + $offset), arduflow_mm_to_pt(51), 0.35);
        $pdf->line(arduflow_mm_to_pt(18 + $offset), arduflow_mm_to_pt(51), arduflow_mm_to_pt(27 + $offset), arduflow_mm_to_pt(60), 0.35);
        $pdf->circle(arduflow_mm_to_pt(18 + $offset), arduflow_mm_to_pt(16), arduflow_mm_to_pt(0.9), 'S');
        $pdf->circle(arduflow_mm_to_pt(27 + $offset), arduflow_mm_to_pt(60), arduflow_mm_to_pt(0.9), 'S');

        $right = 279 - $offset;
        $pdf->line(arduflow_mm_to_pt($right), arduflow_mm_to_pt(16), arduflow_mm_to_pt($right), arduflow_mm_to_pt(51), 0.35);
        $pdf->line(arduflow_mm_to_pt($right), arduflow_mm_to_pt(51), arduflow_mm_to_pt($right - 9), arduflow_mm_to_pt(60), 0.35);
        $pdf->circle(arduflow_mm_to_pt($right), arduflow_mm_to_pt(16), arduflow_mm_to_pt(0.9), 'S');
        $pdf->circle(arduflow_mm_to_pt($right - 9), arduflow_mm_to_pt(60), arduflow_mm_to_pt(0.9), 'S');
    }

    $pdf->setStroke($colors['gold']);
    $pdf->line(arduflow_mm_to_pt(86), arduflow_mm_to_pt(39), arduflow_mm_to_pt(211), arduflow_mm_to_pt(39), 0.6);
    $pdf->circle(arduflow_mm_to_pt(148.5), arduflow_mm_to_pt(39), arduflow_mm_to_pt(1.2), 'f');

    $pdf->text('ardu', arduflow_mm_to_pt(108), arduflow_mm_to_pt(17), 'helvetica_bold', arduflow_mm_to_pt(13.5), $colors['ink']);
    $pdf->text('flow', arduflow_mm_to_pt(145), arduflow_mm_to_pt(17), 'helvetica_bold', arduflow_mm_to_pt(13.5), '#F2C500');
    $pdf->setStroke('#F2C500');
    $pdf->line(arduflow_mm_to_pt(104), arduflow_mm_to_pt(17), arduflow_mm_to_pt(104), arduflow_mm_to_pt(33), 1.1);
    $pdf->line(arduflow_mm_to_pt(104), arduflow_mm_to_pt(33), arduflow_mm_to_pt(112), arduflow_mm_to_pt(33), 1.1);

    $pdf->text('SERTIFIKAT', arduflow_mm_to_pt(57), arduflow_mm_to_pt(44.8), 'times_bold', arduflow_mm_to_pt(23.5), $colors['gold'], 'center', arduflow_mm_to_pt(183));
    $pdf->text('SERTIFIKAT', arduflow_mm_to_pt(57), arduflow_mm_to_pt(44), 'times_bold', arduflow_mm_to_pt(23.5), $colors['ink'], 'center', arduflow_mm_to_pt(183));
    $pdf->text('Workshop Arduflow IDE', arduflow_mm_to_pt(85), arduflow_mm_to_pt(71), 'times_bold', arduflow_mm_to_pt(12.8), $colors['blue'], 'center', arduflow_mm_to_pt(127));

    $pdf->setStroke($colors['gold']);
    $pdf->line(arduflow_mm_to_pt(92), arduflow_mm_to_pt(88), arduflow_mm_to_pt(124), arduflow_mm_to_pt(88), 0.45);
    $pdf->line(arduflow_mm_to_pt(173), arduflow_mm_to_pt(88), arduflow_mm_to_pt(205), arduflow_mm_to_pt(88), 0.45);
    $pdf->circle(arduflow_mm_to_pt(126), arduflow_mm_to_pt(88), arduflow_mm_to_pt(0.75), 'f');
    $pdf->circle(arduflow_mm_to_pt(171), arduflow_mm_to_pt(88), arduflow_mm_to_pt(0.75), 'f');
    $pdf->text('Diberikan kepada', arduflow_mm_to_pt(124), arduflow_mm_to_pt(84.7), 'times', arduflow_mm_to_pt(6.8), $colors['ink'], 'center', arduflow_mm_to_pt(49));

    $pdf->line(arduflow_mm_to_pt(91), arduflow_mm_to_pt(111), arduflow_mm_to_pt(206), arduflow_mm_to_pt(111), 0.45);
    $pdf->circle(arduflow_mm_to_pt(148.5), arduflow_mm_to_pt(111), arduflow_mm_to_pt(1.1), 'f');

    $pdf->line(arduflow_mm_to_pt(38), arduflow_mm_to_pt(156), arduflow_mm_to_pt(118), arduflow_mm_to_pt(156), 0.45);
    $pdf->line(arduflow_mm_to_pt(179), arduflow_mm_to_pt(156), arduflow_mm_to_pt(259), arduflow_mm_to_pt(156), 0.45);
    $pdf->line(arduflow_mm_to_pt(38), arduflow_mm_to_pt(184), arduflow_mm_to_pt(108), arduflow_mm_to_pt(184), 0.45);
    $pdf->line(arduflow_mm_to_pt(189), arduflow_mm_to_pt(184), arduflow_mm_to_pt(259), arduflow_mm_to_pt(184), 0.45);

    arduflow_certificate_draw_seal($pdf, $colors);
    arduflow_certificate_draw_icons($pdf, $colors);

    $pdf->text('Instruktur', arduflow_mm_to_pt(43), arduflow_mm_to_pt(195), 'times', arduflow_mm_to_pt(6.2), $colors['ink'], 'center', arduflow_mm_to_pt(70));
    $pdf->text('Penyelenggara', arduflow_mm_to_pt(185), arduflow_mm_to_pt(195), 'times', arduflow_mm_to_pt(6.2), $colors['ink'], 'center', arduflow_mm_to_pt(70));
}

function arduflow_certificate_draw_dynamic(ArduflowCertificatePdf $pdf, array $layout, array $certificate): void
{
    $participant = (string) ($certificate['userName'] ?? $certificate['user_name'] ?? 'Nama Peserta');
    $description = (string) ($certificate['description'] ?? 'Atas partisipasinya dan keberhasilan mengikuti kegiatan Workshop Arduflow IDE serta mempelajari visual programming untuk pengembangan proyek IoT.');
    $issuedAt = (string) ($certificate['issuedAt'] ?? $certificate['issued_at'] ?? $certificate['completedAt'] ?? $certificate['completed_at'] ?? date('Y-m-d'));
    $number = (string) ($certificate['certificateNumber'] ?? $certificate['certificate_number'] ?? '');
    $instructor = (string) ($certificate['instructor'] ?? 'Instruktur');
    $organizer = (string) ($certificate['organizer'] ?? 'Arduflow');

    arduflow_draw_text_box($pdf, $layout['participantName'], $participant);
    arduflow_draw_text_box($pdf, $layout['description'], $description);
    arduflow_draw_text_box($pdf, $layout['organizerLine'], 'Diselenggarakan oleh ' . $organizer);
    arduflow_draw_text_box($pdf, $layout['date'], 'Tanggal: ' . arduflow_certificate_format_date($issuedAt));
    arduflow_draw_text_box($pdf, $layout['certificateNumber'], 'Nomor Sertifikat: ' . $number);
    arduflow_draw_text_box($pdf, $layout['instructor'], $instructor);
    arduflow_draw_text_box($pdf, $layout['organizer'], $organizer);
}

function arduflow_certificate_draw_seal(ArduflowCertificatePdf $pdf, array $colors): void
{
    $cx = arduflow_mm_to_pt(148.5);
    $cy = arduflow_mm_to_pt(169.5);

    $pdf->setFill($colors['goldLight']);
    $pdf->setStroke($colors['gold']);
    $pdf->circle($cx, $cy, arduflow_mm_to_pt(15.2), 'B');
    $pdf->setFill($colors['deepNavy']);
    $pdf->circle($cx, $cy, arduflow_mm_to_pt(11.6), 'f');
    $pdf->setStroke($colors['gold']);
    $pdf->circle($cx, $cy, arduflow_mm_to_pt(10.1), 'S');

    $pdf->setStroke('#FFFFFF');
    $pdf->line($cx - arduflow_mm_to_pt(4), $cy - arduflow_mm_to_pt(2), $cx, $cy - arduflow_mm_to_pt(6), 1.1);
    $pdf->line($cx, $cy - arduflow_mm_to_pt(6), $cx + arduflow_mm_to_pt(4), $cy - arduflow_mm_to_pt(1), 1.1);
    $pdf->line($cx - arduflow_mm_to_pt(4), $cy - arduflow_mm_to_pt(2), $cx + arduflow_mm_to_pt(4), $cy - arduflow_mm_to_pt(1), 1.1);
    $pdf->circle($cx - arduflow_mm_to_pt(4), $cy - arduflow_mm_to_pt(2), arduflow_mm_to_pt(1.45), 'S');
    $pdf->circle($cx, $cy - arduflow_mm_to_pt(6), arduflow_mm_to_pt(1.45), 'S');
    $pdf->circle($cx + arduflow_mm_to_pt(4), $cy - arduflow_mm_to_pt(1), arduflow_mm_to_pt(1.45), 'S');
    $pdf->text('*', $cx - arduflow_mm_to_pt(1.2), $cy - arduflow_mm_to_pt(15.4), 'helvetica_bold', arduflow_mm_to_pt(6.5), $colors['gold']);
}

function arduflow_certificate_draw_icons(ArduflowCertificatePdf $pdf, array $colors): void
{
    $pdf->setStroke('#F28A00');
    $pdf->setFill('#F28A00');

    $x = arduflow_mm_to_pt(37);
    $y = arduflow_mm_to_pt(160);
    $pdf->rect($x, $y, arduflow_mm_to_pt(4.3), arduflow_mm_to_pt(4.1), 'S');
    $pdf->line($x, $y + arduflow_mm_to_pt(1.25), $x + arduflow_mm_to_pt(4.3), $y + arduflow_mm_to_pt(1.25), 0.45);
    $pdf->line($x + arduflow_mm_to_pt(1.1), $y - arduflow_mm_to_pt(0.7), $x + arduflow_mm_to_pt(1.1), $y + arduflow_mm_to_pt(0.8), 0.45);
    $pdf->line($x + arduflow_mm_to_pt(3.2), $y - arduflow_mm_to_pt(0.7), $x + arduflow_mm_to_pt(3.2), $y + arduflow_mm_to_pt(0.8), 0.45);

    $x = arduflow_mm_to_pt(184);
    $y = arduflow_mm_to_pt(159.6);
    $pdf->line($x + arduflow_mm_to_pt(2), $y, $x + arduflow_mm_to_pt(5), $y + arduflow_mm_to_pt(1.7), 0.5);
    $pdf->line($x + arduflow_mm_to_pt(5), $y + arduflow_mm_to_pt(1.7), $x + arduflow_mm_to_pt(5), $y + arduflow_mm_to_pt(5.2), 0.5);
    $pdf->line($x + arduflow_mm_to_pt(5), $y + arduflow_mm_to_pt(5.2), $x + arduflow_mm_to_pt(2), $y + arduflow_mm_to_pt(7), 0.5);
    $pdf->line($x + arduflow_mm_to_pt(2), $y + arduflow_mm_to_pt(7), $x - arduflow_mm_to_pt(1), $y + arduflow_mm_to_pt(5.2), 0.5);
    $pdf->line($x - arduflow_mm_to_pt(1), $y + arduflow_mm_to_pt(5.2), $x - arduflow_mm_to_pt(1), $y + arduflow_mm_to_pt(1.7), 0.5);
    $pdf->line($x - arduflow_mm_to_pt(1), $y + arduflow_mm_to_pt(1.7), $x + arduflow_mm_to_pt(2), $y, 0.5);
}

function arduflow_draw_text_box(ArduflowCertificatePdf $pdf, array $box, string $text): void
{
    $font = (string) ($box['font'] ?? 'times');
    $maxSize = arduflow_mm_to_pt((float) ($box['maxSize'] ?? 10));
    $minSize = arduflow_mm_to_pt((float) ($box['minSize'] ?? 7));
    $x = arduflow_mm_to_pt((float) $box['x']);
    $y = arduflow_mm_to_pt((float) $box['y']);
    $w = arduflow_mm_to_pt((float) $box['w']);
    $h = arduflow_mm_to_pt((float) $box['h']);
    $maxLines = (int) ($box['maxLines'] ?? 1);
    $lineHeightFactor = (float) ($box['lineHeight'] ?? 1.1);
    $align = (string) ($box['align'] ?? 'left');
    $color = (string) ($box['color'] ?? '#061A36');
    $normalizedText = arduflow_certificate_normalize_text($text);

    if (!empty($box['uppercase'])) {
        $normalizedText = strtoupper($normalizedText);
    }

    $fit = arduflow_certificate_fit_text($normalizedText, $font, $maxSize, $minSize, $w, $h, $maxLines, $lineHeightFactor);
    $lineHeight = $fit['fontSize'] * $lineHeightFactor;
    $totalHeight = count($fit['lines']) * $lineHeight;
    $startY = $y + max(0, ($h - $totalHeight) / 2);

    foreach ($fit['lines'] as $index => $line) {
        $lineTop = $startY + ($index * $lineHeight);
        $pdf->text($line, $x, $lineTop, $font, $fit['fontSize'], $color, $align, $w);
    }
}

function arduflow_certificate_fit_text(string $text, string $font, float $maxSize, float $minSize, float $boxWidth, float $boxHeight, int $maxLines, float $lineHeightFactor): array
{
    for ($fontSize = $maxSize; $fontSize >= $minSize; $fontSize -= 0.35) {
        $lines = arduflow_certificate_wrap_text($text, $fontSize, $font, $boxWidth);
        $totalHeight = count($lines) * $fontSize * $lineHeightFactor;

        if (count($lines) <= $maxLines && $totalHeight <= $boxHeight) {
            return [
                'fontSize' => $fontSize,
                'lines' => $lines,
            ];
        }
    }

    $lines = arduflow_certificate_wrap_text($text, $minSize, $font, $boxWidth);

    while (count($lines) > $maxLines) {
        $last = array_pop($lines);
        $lines[count($lines) - 1] .= ' ' . $last;
    }

    return [
        'fontSize' => $minSize,
        'lines' => $lines,
    ];
}

function arduflow_certificate_wrap_text(string $text, float $fontSize, string $font, float $maxWidth): array
{
    $words = preg_split('/\s+/', trim($text)) ?: [];
    $lines = [];
    $current = '';

    foreach ($words as $word) {
        $candidate = $current === '' ? $word : $current . ' ' . $word;

        if ($current !== '' && arduflow_certificate_estimate_width($candidate, $fontSize, $font) > $maxWidth) {
            $lines[] = $current;
            $current = $word;
            continue;
        }

        $current = $candidate;
    }

    if ($current !== '') {
        $lines[] = $current;
    }

    return $lines !== [] ? $lines : [''];
}

function arduflow_certificate_estimate_width(string $text, float $fontSize, string $font): float
{
    $boldBoost = str_contains($font, 'bold') ? 1.05 : 1;
    $width = 0.0;
    $chars = preg_split('//u', $text, -1, PREG_SPLIT_NO_EMPTY) ?: [];

    foreach ($chars as $char) {
        if ($char === ' ') {
            $width += 0.28;
        } elseif (preg_match('/[A-Z]/', $char) === 1) {
            $width += 0.66;
        } elseif (preg_match('/[0-9]/', $char) === 1) {
            $width += 0.54;
        } elseif (preg_match('/[.,:;|!()\[\]\-]/', $char) === 1) {
            $width += 0.30;
        } else {
            $width += 0.50;
        }
    }

    return $width * $fontSize * $boldBoost;
}

function arduflow_certificate_normalize_text(string $text): string
{
    $text = preg_replace('/\s+/', ' ', trim($text)) ?? '';
    $text = str_replace(['“', '”', '’', '‘', '–', '—'], ['"', '"', "'", "'", '-', '-'], $text);

    return $text;
}

function arduflow_certificate_format_date(?string $value): string
{
    if ($value === null || trim($value) === '') {
        $value = date('Y-m-d');
    }

    $timestamp = strtotime($value);
    if ($timestamp === false) {
        return (string) $value;
    }

    $months = [
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

    return date('j', $timestamp) . ' ' . $months[date('m', $timestamp)] . ' ' . date('Y', $timestamp);
}

function arduflow_mm_to_pt(float $mm): float
{
    return $mm * 72 / 25.4;
}

function arduflow_pdf_rgb(string $hex): array
{
    $hex = ltrim($hex, '#');

    if (strlen($hex) === 3) {
        $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
    }

    return [
        hexdec(substr($hex, 0, 2)) / 255,
        hexdec(substr($hex, 2, 2)) / 255,
        hexdec(substr($hex, 4, 2)) / 255,
    ];
}

function arduflow_pdf_encode_text(string $text): string
{
    $text = arduflow_certificate_normalize_text($text);
    $encoded = iconv('UTF-8', 'Windows-1252//TRANSLIT//IGNORE', $text);

    if ($encoded === false) {
        $encoded = preg_replace('/[^\x20-\x7E]/', '', $text) ?? '';
    }

    return str_replace(['\\', '(', ')', "\r", "\n"], ['\\\\', '\(', '\)', ' ', ' '], $encoded);
}
