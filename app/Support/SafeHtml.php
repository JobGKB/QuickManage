<?php

namespace App\Support;

class SafeHtml
{
    private const INLINE_TAGS = 'strong|b|em|i|u|p|ul|ol|li';

    /**
     * Escape all HTML, then re-enable only a few formatting tags without attributes
     * (<strong>, <b>, <em>, <i>, <u>, <p>, <ul>, <ol>, <li>, <br>) plus <a href="...">
     * with an http(s), mailto, relative (/...) or anchor (#...) URL. Anything else,
     * including other attributes such as onclick/style, stays escaped.
     */
    public static function basic(?string $text): string
    {
        $escaped = e((string) $text);

        $escaped = preg_replace('#&lt;br\s*/?&gt;#i', '<br>', $escaped);
        $escaped = preg_replace('#&lt;(/?)(' . self::INLINE_TAGS . ')&gt;#i', '<$1$2>', $escaped);

        // After e(), quotes are &quot; or &#039;.
        $escaped = preg_replace_callback(
            '#&lt;a\s+href=(&quot;|&\#039;)((?:(?!&quot;|&\#039;).)*)\1\s*&gt;#i',
            fn (array $m) => self::anchor($m[2]) ?? $m[0],
            $escaped
        );

        return preg_replace('#&lt;/a&gt;#i', '</a>', $escaped);
    }

    private static function anchor(string $escapedUrl): ?string
    {
        $url = trim(html_entity_decode($escapedUrl, ENT_QUOTES | ENT_HTML5, 'UTF-8'));

        if (! preg_match('#^(https?://|mailto:|/|\#)#i', $url)) {
            return null;
        }

        $attributes = 'href="' . e($url) . '"';

        if (preg_match('#^https?://#i', $url)) {
            $attributes .= ' target="_blank" rel="noopener noreferrer"';
        }

        return '<a ' . $attributes . '>';
    }
}
