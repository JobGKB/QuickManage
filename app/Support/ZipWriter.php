<?php

namespace App\Support;

/**
 * Minimale ZIP-schrijver (store/geen compressie) zodat er geen ext-zip nodig is.
 */
class ZipWriter
{
    /** @var array<int, array{name:string, data:string, crc:int, size:int, offset:int}> */
    private array $entries = [];

    private string $buffer = '';

    /**
     * Voegt een bestand toe aan het archief.
     */
    public function add(string $name, string $data): void
    {
        $crc = crc32($data);
        $size = strlen($data);
        $offset = strlen($this->buffer);
        [$dosTime, $dosDate] = $this->dosDateTime();

        // Lokale header (compressiemethode 0 = store).
        $this->buffer .= pack('V', 0x04034b50);
        $this->buffer .= pack('v', 20);
        $this->buffer .= pack('v', 0);
        $this->buffer .= pack('v', 0);
        $this->buffer .= pack('v', $dosTime);
        $this->buffer .= pack('v', $dosDate);
        $this->buffer .= pack('V', $crc);
        $this->buffer .= pack('V', $size);
        $this->buffer .= pack('V', $size);
        $this->buffer .= pack('v', strlen($name));
        $this->buffer .= pack('v', 0);
        $this->buffer .= $name;
        $this->buffer .= $data;

        $this->entries[] = compact('name', 'crc', 'size', 'offset');
    }

    /**
     * Bouwt het volledige ZIP-archief en geeft de binary terug.
     */
    public function finish(): string
    {
        $central = '';
        [$dosTime, $dosDate] = $this->dosDateTime();

        foreach ($this->entries as $entry) {
            $central .= pack('V', 0x02014b50);
            $central .= pack('v', 20);
            $central .= pack('v', 20);
            $central .= pack('v', 0);
            $central .= pack('v', 0);
            $central .= pack('v', $dosTime);
            $central .= pack('v', $dosDate);
            $central .= pack('V', $entry['crc']);
            $central .= pack('V', $entry['size']);
            $central .= pack('V', $entry['size']);
            $central .= pack('v', strlen($entry['name']));
            $central .= pack('v', 0);
            $central .= pack('v', 0);
            $central .= pack('v', 0);
            $central .= pack('v', 0);
            $central .= pack('V', 0);
            $central .= pack('V', $entry['offset']);
            $central .= $entry['name'];
        }

        $eocd = pack('V', 0x06054b50)
            .pack('v', 0)
            .pack('v', 0)
            .pack('v', count($this->entries))
            .pack('v', count($this->entries))
            .pack('V', strlen($central))
            .pack('V', strlen($this->buffer))
            .pack('v', 0);

        return $this->buffer.$central.$eocd;
    }

    /**
     * Huidige tijd als DOS-datum/tijd (voor ZIP-headers).
     */
    private function dosDateTime(): array
    {
        $now = getdate();
        $dosTime = ($now['hours'] << 11) | ($now['minutes'] << 5) | (intdiv($now['seconds'], 2));
        $dosDate = (($now['year'] - 1980) << 9) | ($now['mon'] << 5) | $now['mday'];

        return [$dosTime, $dosDate];
    }
}
