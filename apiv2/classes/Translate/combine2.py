import json
import sys

def create_translation_file(en_file_path, tr_file_path, output_file_path):
    # Read lines from both files
    with open(en_file_path, 'r', encoding='utf-8') as en_file:
        en_lines = en_file.read().splitlines()

    with open(tr_file_path, 'r', encoding='utf-8') as tr_file:
        tr_lines = tr_file.read().splitlines()

    # Check if both files have the same number of lines
    if len(en_lines) != len(tr_lines):
        raise ValueError("Files have different numbers of lines")

    # Create a dictionary from the lines
    translations = {en: tr for en, tr in zip(en_lines, tr_lines)}

    # Write the dictionary to the output file
    with open(output_file_path, 'w', encoding='utf-8') as output_file:
        json.dump(translations, output_file, indent=4, ensure_ascii=False)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: script.py <en_file_path> <tr_file_path> <output_file_path>")
        sys.exit(1)

    en_file_path = sys.argv[1]
    tr_file_path = sys.argv[2]
    output_file_path = sys.argv[3]

    create_translation_file(en_file_path, tr_file_path, output_file_path)

