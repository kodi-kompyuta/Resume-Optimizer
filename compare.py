import re

def extract_text_from_docx_xml(xml_file):
    with open(xml_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract all text between <w:t> tags
    texts = re.findall(r'<w:t[^>]*>(.*?)</w:t>', content, re.DOTALL)

    # Join and clean up
    full_text = ''.join(texts)

    return full_text

# Extract text from both files
original = extract_text_from_docx_xml('original_content.xml')
optimized = extract_text_from_docx_xml('optimized_content.xml')

# Write to files for comparison
with open('original_text.txt', 'w', encoding='utf-8') as f:
    f.write(original)

with open('optimized_text.txt', 'w', encoding='utf-8') as f:
    f.write(optimized)

print("Original length:", len(original))
print("Optimized length:", len(optimized))
print("\n=== ORIGINAL ===")
print(original[:1000])
print("\n=== OPTIMIZED ===")
print(optimized[:1000])
