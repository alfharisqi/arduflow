<?php

declare(strict_types=1);

namespace Arduflow\Api\Security;

final class PasswordCheck
{
    public function __construct(
        public readonly bool $valid,
        public readonly bool $needsRehash = false,
        public readonly bool $legacyDisabled = false,
    ) {
    }
}
