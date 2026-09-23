import re

# Read the LanguageContext file
with open(r'c:\Users\lenovo\OneDrive\Documents\choir-mkc\resources\js\context\LanguageContext.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract English and Amharic translations from LanguageContext
en_match = re.search(r'const translationsEn = \{(.*?)\n};', content, re.DOTALL)
am_match = re.search(r'const translationsAm = \{(.*?)\n};', content, re.DOTALL)

en_keys = set(re.findall(r"'([^']+)' :", en_match.group(1))) if en_match else set()
am_keys = set(re.findall(r"'([^']+)' :", am_match.group(1))) if am_match else set()

# Keys in En but not in Am
en_only = en_keys - am_keys
print("=== KEYS IN EN BUT NOT IN AM (from LanguageContext) ===")
for k in sorted(en_only):
    print(k)
print(f"\nTotal: {len(en_only)}")

# Now check auth translations
with open(r'c:\Users\lenovo\OneDrive\Documents\choir-mkc\resources\js\i18n\authTranslationsEn.js', 'r', encoding='utf-8') as f:
    en_auth = f.read()
with open(r'c:\Users\lenovo\OneDrive\Documents\choir-mkc\resources\js\i18n\authTranslationsAm.js', 'r', encoding='utf-8') as f:
    am_auth = f.read()

en_auth_keys = set(re.findall(r"'([^']+)' :", en_auth))
am_auth_keys = set(re.findall(r"'([^']+)' :", am_auth))

auth_en_only = en_auth_keys - am_auth_keys
print("\n=== KEYS IN authTranslationsEn BUT NOT IN authTranslationsAm ===")
for k in sorted(auth_en_only):
    print(k)
print(f"\nTotal: {len(auth_en_only)}")

# Now find all t() keys used in member pages
member_keys = set()
import os
member_dir = r'c:\Users\lenovo\OneDrive\Documents\choir-mkc\resources\js\pages\member'
component_dir = r'c:\Users\lenovo\OneDrive\Documents\choir-mkc\resources\js\components\member'

for d in [member_dir, component_dir]:
    for root, dirs, files in os.walk(d):
        for fname in files:
            if fname.endswith('.jsx'):
                filepath = os.path.join(root, fname)
                with open(filepath, 'r', encoding='utf-8') as f:
                    page_content = f.read()
                # Find all t() calls and extract keys
                found = re.findall(r"t\('([^']+)'", page_content)
                member_keys.update(found)

print("\n=== ALL t() KEYS USED IN MEMBER PAGES AND COMPONENTS ===")
for k in sorted(member_keys):
    print(k)
print(f"\nTotal: {len(member_keys)}")

# All translation keys available (En + Am combined)
all_keys = en_keys | am_keys | en_auth_keys | am_auth_keys
missing_keys = member_keys - all_keys
print("\n=== MEMBER PAGE t() KEYS NOT IN ANY TRANSLATION FILE ===")
for k in sorted(missing_keys):
    print(k)
print(f"\nTotal: {len(missing_keys)}")
