<?php

namespace App\Services\ArtifactApps;

use InvalidArgumentException;

/**
 * Assembles an artifact page from its source fragments, exactly like the app's
 * own build.py does, so editing resources/apps/<slug>/src needs no build step.
 */
class ArtifactPageBuilder
{
    public static function build(string $layout, string $dir): string
    {
        return match ($layout) {
            'volgorde-json' => self::volgordeJson($dir),
            'kop-stijl-pagina-scripts' => self::kopStijlPaginaScripts($dir),
            default => throw new InvalidArgumentException("Onbekende layout '{$layout}'."),
        };
    }

    /** Eisenhower build.py: the files listed in volgorde.json, joined with "\n". */
    private static function volgordeJson(string $dir): string
    {
        $order = json_decode(self::read($dir, 'volgorde.json'), true, flags: JSON_THROW_ON_ERROR);

        return implode("\n", array_map(fn (string $file) => self::read($dir, $file), $order));
    }

    /** Leeghwater build.py: kop + <style>stijl</style> + pagina + <script>[3-9]?-*.js</script>. */
    private static function kopStijlPaginaScripts(string $dir): string
    {
        $scripts = array_values(array_filter(scandir($dir), fn ($f) => preg_match('/^[3-9].-.*\.js$/', $f)));
        sort($scripts, SORT_STRING);

        return self::read($dir, '00-kop.html')
            . "<style>\n" . self::read($dir, '10-stijl.css') . "</style>\n"
            . self::read($dir, '20-pagina.html')
            . "<script>\n" . implode('', array_map(fn ($f) => self::read($dir, $f), $scripts)) . "</script>\n";
    }

    private static function read(string $dir, string $file): string
    {
        $contents = @file_get_contents($dir . DIRECTORY_SEPARATOR . $file);
        if ($contents === false) {
            throw new InvalidArgumentException("Bronbestand ontbreekt: {$dir}/{$file}");
        }

        return $contents;
    }
}
