/**
 * Membangkitkan variabel CSS Material Design 3 dari warna seed memakai algoritma resmi
 * Material, bukan warna yang dipilih manual, supaya setiap pasangan `on*` dijamin
 * memenuhi kontras WCAG AA. Jalankan ulang kalau seed di DESIGN.md berubah:
 *
 *   npm run generate:theme
 */
import { writeFileSync } from "node:fs";
import { Hct, SchemeTonalSpot, MaterialDynamicColors, argbFromHex, hexFromArgb } from "@material/material-color-utilities";

/** Seed merek. Alasan pemilihannya ada di DESIGN.md. */
const SEED = "#00696B";

/**
 * Status siklus hidup tidak ada di peran baku M3. Keduanya dibangkitkan dengan algoritma
 * yang sama dari seed sendiri agar tetap serasi secara tonal dan kontrasnya tetap dijamin.
 * Warna ini selalu dipasangkan dengan label teks, tidak pernah menjadi satu-satunya penanda.
 */
const STATUS_SEEDS = {
    success: "#276E3D",
    pending: "#7A5A00",
};

const BASE_ROLES = [
    "primary", "onPrimary", "primaryContainer", "onPrimaryContainer", "inversePrimary",
    "secondary", "onSecondary", "secondaryContainer", "onSecondaryContainer",
    "tertiary", "onTertiary", "tertiaryContainer", "onTertiaryContainer",
    "error", "onError", "errorContainer", "onErrorContainer",
    "background", "onBackground",
    "surface", "onSurface", "surfaceVariant", "onSurfaceVariant",
    "surfaceDim", "surfaceBright",
    "surfaceContainerLowest", "surfaceContainerLow", "surfaceContainer",
    "surfaceContainerHigh", "surfaceContainerHighest",
    "outline", "outlineVariant", "shadow", "scrim",
    "inverseSurface", "inverseOnSurface",
];

const toKebab = (name) => name.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());

function buildRoles(seedHex, isDark) {
    const scheme = new SchemeTonalSpot(Hct.fromInt(argbFromHex(seedHex)), isDark, 0);
    const roles = {};
    for (const role of BASE_ROLES) {
        roles[role] = hexFromArgb(MaterialDynamicColors[role].getArgb(scheme));
    }
    return roles;
}

function buildStatusRoles(isDark) {
    const roles = {};
    for (const [name, seed] of Object.entries(STATUS_SEEDS)) {
        const scheme = new SchemeTonalSpot(Hct.fromInt(argbFromHex(seed)), isDark, 0);
        const pick = (role) => hexFromArgb(MaterialDynamicColors[role].getArgb(scheme));
        roles[name] = pick("primary");
        roles[`on${name[0].toUpperCase()}${name.slice(1)}`] = pick("onPrimary");
        roles[`${name}Container`] = pick("primaryContainer");
        roles[`on${name[0].toUpperCase()}${name.slice(1)}Container`] = pick("onPrimaryContainer");
    }
    return roles;
}

// --- Verifikasi kontras -----------------------------------------------------

const channel = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));

function luminance(hex) {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a, b) {
    const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
}

/** Pasangan yang benar-benar dipakai di layar, beserta rasio minimum yang harus dipenuhi. */
const CONTRAST_PAIRS = [
    ["onSurface", "surface", 4.5],
    ["onSurface", "surfaceContainer", 4.5],
    ["onSurface", "surfaceContainerHigh", 4.5],
    ["onSurfaceVariant", "surface", 4.5],
    ["onSurfaceVariant", "surfaceContainer", 4.5],
    ["onSurfaceVariant", "surfaceContainerHighest", 4.5],
    ["onPrimary", "primary", 4.5],
    ["onPrimaryContainer", "primaryContainer", 4.5],
    ["onSecondaryContainer", "secondaryContainer", 4.5],
    ["onTertiaryContainer", "tertiaryContainer", 4.5],
    ["onError", "error", 4.5],
    ["onErrorContainer", "errorContainer", 4.5],
    ["onSuccessContainer", "successContainer", 4.5],
    ["onPendingContainer", "pendingContainer", 4.5],
    ["onInverseSurface", "inverseSurface", 4.5],
    ["primary", "surface", 3],
    ["outline", "surface", 3],
    ["outline", "surfaceContainer", 3],
];

function verify(label, roles) {
    const failures = [];
    for (const [fg, bg, minimum] of CONTRAST_PAIRS) {
        const foreground = fg === "onInverseSurface" ? roles.inverseOnSurface : roles[fg];
        const background = roles[bg];
        if (!foreground || !background) {
            continue;
        }
        const ratio = contrast(foreground, background);
        if (ratio < minimum) {
            failures.push(`${label}: ${fg} di atas ${bg} hanya ${ratio.toFixed(2)}:1, minimum ${minimum}:1`);
        }
    }
    return failures;
}

// --- Keluaran ---------------------------------------------------------------

const light = { ...buildRoles(SEED, false), ...buildStatusRoles(false) };
const dark = { ...buildRoles(SEED, true), ...buildStatusRoles(true) };

const failures = [...verify("terang", light), ...verify("gelap", dark)];

const declarations = (roles) =>
    Object.entries(roles)
        .map(([role, value]) => `    --md-${toKebab(role)}: ${value};`)
        .join("\n");

const css = `/* Dibangkitkan oleh scripts/generate-m3-theme.mjs dari seed ${SEED}. Jangan diubah manual. */
/* Jalankan "npm run generate:theme" setelah mengubah seed di berkas skrip tersebut. */

:root {
    color-scheme: light;
${declarations(light)}
}

/* Pengguna yang belum memilih tema mengikuti preferensi sistemnya. */
@media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
        color-scheme: dark;
${declarations(dark).replace(/^/gm, "    ")}
    }
}

/* Pilihan eksplisit dari tombol tema selalu menang atas preferensi sistem. */
:root[data-theme="dark"] {
    color-scheme: dark;
${declarations(dark)}
}

:root[data-theme="light"] {
    color-scheme: light;
${declarations(light)}
}
`;

writeFileSync(new URL("../src/styles/m3-theme.css", import.meta.url), css, "utf8");

if (failures.length > 0) {
    console.error("Kontras belum memenuhi WCAG AA:");
    failures.forEach((line) => console.error("  - " + line));
    process.exit(1);
}

console.log(`Tema M3 dibangkitkan dari seed ${SEED}. ${CONTRAST_PAIRS.length * 2} pemeriksaan kontras lolos.`);
