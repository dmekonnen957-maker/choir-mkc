const fs = require('fs');
const path = require('path');

function extractKeys(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    // Find all 'key': assignments at the start of lines
    const keys = new Set();
    const regex = /^\s*'([^']+)'\s*:\s*/gm;
    let match;
    while ((match = regex.exec(content)) !== null) {
        keys.add(match[1]);
    }
    return keys;
}

// Read LanguageContext
const lcPath = path.join(__dirname, 'resources/js/context/LanguageContext.jsx');
const lc = fs.readFileSync(lcPath, 'utf8');

// Extract translationsEn
const enMatch = lc.match(/const translationsEn = \{(.*?)\n};/s);
const enKeys = new Set();
if (enMatch) {
    const regex = /^\s*'([^']+)'\s*:/gm;
    let m;
    while ((m = regex.exec(enMatch[1])) !== null) enKeys.add(m[1]);
}

// Extract translationsAm
const amMatch = lc.match(/const translationsAm = \{(.*?)\n};/s);
const amKeys = new Set();
if (amMatch) {
    const regex = /^\s*'([^']+)'\s*:/gm;
    let m;
    while ((m = regex.exec(amMatch[1])) !== null) amKeys.add(m[1]);
}

// Keys in En but not in Am (from LanguageContext)
const enOnly = new Set([...enKeys].filter(k => !amKeys.has(k)));
console.log('=== KEYS IN EN BUT NOT IN AM (from LanguageContext) ===');
[...enOnly].sort().forEach(k => console.log(k));
console.log(`\nTotal: ${enOnly.size}`);

// Auth translations
const authEnPath = path.join(__dirname, 'resources/js/i18n/authTranslationsEn.js');
const authAmPath = path.join(__dirname, 'resources/js/i18n/authTranslationsAm.js');
const authEnKeys = extractKeys(authEnPath);
const authAmKeys = extractKeys(authAmPath);

const authEnOnly = new Set([...authEnKeys].filter(k => !authAmKeys.has(k)));
console.log('\n=== KEYS IN authTranslationsEn BUT NOT IN authTranslationsAm ===');
[...authEnOnly].sort().forEach(k => console.log(k));
console.log(`\nTotal: ${authEnOnly.size}`);

// All keys in Amharic
const allAmKeys = new Set([...amKeys, ...authAmKeys]);

// Find all t() keys used in member pages and components
const memberDirs = [
    path.join(__dirname, 'resources/js/pages/member'),
    path.join(__dirname, 'resources/js/components/member'),
];

const memberKeys = new Set();
function walkDir(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            walkDir(fullPath);
        } else if (file.name.endsWith('.jsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const regex = /t\('([^']+)'/g;
            let m;
            while ((m = regex.exec(content)) !== null) memberKeys.add(m[1]);
        }
    }
}

for (const dir of memberDirs) walkDir(dir);

// Check which member page keys are NOT in any translation file
const allAvailableKeys = new Set([...enKeys, ...amKeys, ...authEnKeys, ...authAmKeys]);
const missingKeys = new Set([...memberKeys].filter(k => !allAvailableKeys.has(k)));

console.log('\n=== MEMBER t() KEYS NOT IN ANY TRANSLATION FILE ===');
[...missingKeys].sort().forEach(k => console.log(k));
console.log(`\nTotal: ${missingKeys.size}`);

// Check which member page keys are NOT in Amharic translations
const missingAmKeys = new Set([...memberKeys].filter(k => !allAmKeys.has(k)));
console.log('\n=== MEMBER t() KEYS MISSING FROM AMHARIC TRANSLATIONS ===');
[...missingAmKeys].sort().forEach(k => console.log(k));
console.log(`\nTotal: ${missingAmKeys.size}`);

// Show the fallback text for missing Amharic keys
console.log('\n=== MISSING AMHARIC KEY DETAILS (with English fallback) ===');
// Combine En translations to get fallback values
const enAll = new Map();
for (const k of enKeys) enAll.set(k, 'in LC En');
for (const k of authEnKeys) enAll.set(k, 'in authEn');

[...missingAmKeys].sort().forEach(k => {
    console.log(`${k} - available in En: ${enAll.has(k) ? 'YES' : 'NO'}`);
});
