<?php

namespace App\Services\ArtifactApps;

use RuntimeException;
use stdClass;

/**
 * Document database of one artifact app, stored as a single JSON file:
 *
 *   {"app": "...", "version": 12, "updatedAt": "...", "documents": {"<collection>/<id>": {...}}}
 *
 * Documents are handled as decoded objects (never assoc arrays) so that empty
 * objects such as "dagen": {} survive a round trip. Reads take a shared lock and
 * writes an exclusive lock on "<file>.lock"; writes go to a temp file that is then
 * renamed over the original, so the file is never left half-written.
 */
class JsonDocumentStore
{
    public const PATH_PATTERN = '/^([A-Za-z0-9_-]{1,64})\/([^\/]{1,200})$/';

    private const JSON_FLAGS = JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION;

    public function __construct(private string $app, private string $dir)
    {
    }

    public function file(): string
    {
        return $this->dir . DIRECTORY_SEPARATOR . 'database.json';
    }

    public static function splitPath(string $path): ?array
    {
        return preg_match(self::PATH_PATTERN, $path, $m) ? [$m[1], $m[2]] : null;
    }

    /**
     * @return array{0: int, 1: stdClass} [version, documents]
     */
    public function read(): array
    {
        return $this->locked(LOCK_SH, function () {
            $db = $this->load();

            return [$db->version, $db->documents];
        });
    }

    /**
     * @param 'set'|'update'|'delete' $op
     * @throws DocumentNotFoundException when updating a document that does not exist
     */
    public function write(string $op, string $path, ?stdClass $data = null): int
    {
        return $this->locked(LOCK_EX, function () use ($op, $path, $data) {
            $db = $this->load();
            $exists = property_exists($db->documents, $path);

            if ($op === 'delete') {
                if (! $exists) {
                    return $db->version;
                }
                unset($db->documents->{$path});
            } elseif ($op === 'update') {
                if (! $exists) {
                    throw new DocumentNotFoundException($path);
                }
                foreach (get_object_vars($data) as $key => $value) {
                    $db->documents->{$path}->{$key} = $value;
                }
            } else {
                $db->documents->{$path} = $data;
            }

            $db->version++;
            $db->updatedAt = gmdate('Y-m-d\TH:i:s\Z');
            $this->save($db);

            return $db->version;
        });
    }

    private function load(): stdClass
    {
        $file = $this->file();
        if (! is_file($file)) {
            return (object) ['app' => $this->app, 'version' => 0, 'updatedAt' => null, 'documents' => new stdClass()];
        }

        $db = json_decode(file_get_contents($file), false, 512, JSON_THROW_ON_ERROR);
        if (! $db instanceof stdClass || ! ($db->documents ?? null) instanceof stdClass) {
            throw new RuntimeException("{$file} is geen geldige database (verwacht {\"documents\": {...}}).");
        }
        $db->version = (int) ($db->version ?? 0);

        return $db;
    }

    private function save(stdClass $db): void
    {
        $file = $this->file();
        $tmp = $file . '.' . bin2hex(random_bytes(4)) . '.tmp';
        file_put_contents($tmp, json_encode($db, self::JSON_FLAGS | JSON_THROW_ON_ERROR));
        if (! @rename($tmp, $file)) {
            // Windows refuses to rename over a file another program has open (e.g. a text editor).
            copy($tmp, $file);
            unlink($tmp);
        }
    }

    private function locked(int $mode, callable $fn): mixed
    {
        if (! is_dir($this->dir) && ! mkdir($this->dir, 0775, true) && ! is_dir($this->dir)) {
            throw new RuntimeException("Map {$this->dir} kan niet worden aangemaakt.");
        }

        $lock = fopen($this->file() . '.lock', 'c');
        try {
            flock($lock, $mode);

            return $fn();
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }
}
