<?php

namespace App\Services;

class TransposeService
{
    public const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    public const FLAT_TO_SHARP = [
        'Db' => 'C#',
        'Eb' => 'D#',
        'Gb' => 'F#',
        'Ab' => 'G#',
        'Bb' => 'A#',
        'Cb' => 'B',
        'Fb' => 'E',
    ];

    public static function normalizeKey(string $key): string
    {
        $key = trim($key);

        return self::FLAT_TO_SHARP[$key] ?? $key;
    }

    public static function transposeKey(string $key, int $steps): string
    {
        $key = self::normalizeKey($key);
        $index = array_search($key, self::CHROMATIC, true);

        if ($index === false) {
            return $key;
        }

        $new = ($index + $steps) % 12;
        if ($new < 0) {
            $new += 12;
        }

        return self::CHROMATIC[$new];
    }

    public static function transposeChord(string $chord, int $steps): string
    {
        $chord = trim($chord);

        if (str_contains($chord, '/')) {
            [$main, $bass] = explode('/', $chord, 2);

            return self::transposeChord($main, $steps) . '/' . self::transposeKey($bass, $steps);
        }

        if (preg_match('/^([A-Ga-g][#b]?)(.*)$/', $chord, $m)) {
            return self::transposeKey($m[1], $steps) . $m[2];
        }

        return $chord;
    }

    public static function transposeLyrics(?string $lyrics, int $steps): ?string
    {
        if ($lyrics === null) {
            return null;
        }

        return preg_replace_callback('/\[([^\]]+)\]/', function ($matches) use ($steps) {
            return '[' . self::transposeChord($matches[1], $steps) . ']';
        }, $lyrics);
    }
}
