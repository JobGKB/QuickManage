<?php

namespace App\Support;

use Symfony\Component\HtmlSanitizer\HtmlSanitizer;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerAction;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerConfig;
use Symfony\Component\HtmlSanitizer\Visitor\AttributeSanitizer\AttributeSanitizerInterface;

/**
 * Allowlist sanitizer for documentation content written in the CMS editor.
 *
 * Only the elements and attributes listed here survive; everything else (scripts, event
 * handlers, inline styles, ids, images, iframes, forms, ...) is removed. The WYSIWYG editor
 * runs in the browser and is not a security boundary, so this is applied both when content
 * is saved and when it is rendered.
 */
class DocHtml
{
    /** Upper bound for submitted content, enforced by request validation. */
    public const MAX_LENGTH = 500000;

    private const ALLOWED_CLASSES = '/^(endpoint|method|method-(get|post|put|patch|delete)|language-[a-z0-9]{1,20})$/';

    private static ?HtmlSanitizer $sanitizer = null;

    public static function sanitize(?string $html): string
    {
        $html = trim((string) $html);

        if ($html === '') {
            return '';
        }

        $clean = self::sanitizer()->sanitize($html);

        // Editors end the content with an empty paragraph to keep the caret reachable.
        return trim(preg_replace('#(?:\s*<p>(?:\s|&nbsp;|<br\s*/?>)*</p>)+\s*$#u', '', $clean) ?? $clean);
    }

    public static function allowsClass(string $class): bool
    {
        return preg_match(self::ALLOWED_CLASSES, $class) === 1;
    }

    private static function sanitizer(): HtmlSanitizer
    {
        return self::$sanitizer ??= new HtmlSanitizer(self::config());
    }

    private static function config(): HtmlSanitizerConfig
    {
        $config = (new HtmlSanitizerConfig)
            // Unknown wrappers (<div>, <font>, <section>, ...) are removed but their text is kept.
            ->defaultAction(HtmlSanitizerAction::Block)
            // The default limit of 20.000 bytes silently truncates; length is validated on input instead.
            ->withMaxInputLength(-1)
            ->allowLinkSchemes(['http', 'https', 'mailto'])
            ->allowRelativeLinks()
            ->forceAttribute('a', 'rel', 'noopener noreferrer')
            ->withAttributeSanitizer(self::classSanitizer());

        // Elements whose content is code or markup rather than text are removed entirely.
        foreach (['script', 'style', 'iframe', 'object', 'embed', 'template', 'noscript', 'svg', 'math', 'head', 'title', 'textarea', 'select', 'xmp', 'noembed', 'noframes', 'plaintext'] as $element) {
            $config = $config->dropElement($element);
        }

        foreach (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'hr', 'blockquote', 'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'ul', 'ol', 'li', 'details', 'summary', 'table', 'thead', 'tbody', 'tfoot', 'tr'] as $element) {
            $config = $config->allowElement($element);
        }

        foreach (['p', 'span', 'pre', 'code'] as $element) {
            $config = $config->allowElement($element, ['class']);
        }

        return $config
            ->allowElement('a', ['href'])
            ->allowElement('th', ['colspan', 'rowspan', 'scope'])
            ->allowElement('td', ['colspan', 'rowspan']);
    }

    /**
     * Reduces a class attribute to the classes the documentation stylesheet knows.
     */
    private static function classSanitizer(): AttributeSanitizerInterface
    {
        return new class implements AttributeSanitizerInterface
        {
            public function getSupportedElements(): ?array
            {
                return null;
            }

            public function getSupportedAttributes(): ?array
            {
                return ['class'];
            }

            public function sanitizeAttribute(string $element, string $attribute, string $value, HtmlSanitizerConfig $config): ?string
            {
                $classes = array_filter(preg_split('/\s+/', trim($value)) ?: [], [DocHtml::class, 'allowsClass']);

                return $classes === [] ? null : implode(' ', $classes);
            }
        };
    }
}
