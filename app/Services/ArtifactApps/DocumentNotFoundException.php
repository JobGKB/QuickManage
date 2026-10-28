<?php

namespace App\Services\ArtifactApps;

use RuntimeException;

class DocumentNotFoundException extends RuntimeException
{
    public function __construct(public readonly string $path)
    {
        parent::__construct("Document {$path} bestaat niet.");
    }
}
