<?php

declare(strict_types=1);

namespace Arduflow\Api\Support;

final class Clock
{
    public static function now(): string
    {
        return gmdate('Y-m-d\TH:i:s\Z');
    }

    public static function afterHours(int $hours): string
    {
        return gmdate('Y-m-d\TH:i:s\Z', time() + ($hours * 3600));
    }

    public static function afterMinutes(int $minutes): string
    {
        return gmdate('Y-m-d\TH:i:s\Z', time() + ($minutes * 60));
    }
}
