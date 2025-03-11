import json
import re

def clean_word(word):
    """
    Remove any character from the word that is not an alphabet letter (A-Z or a-z) or a hyphen.
    """
    return re.sub(r'[^a-zA-Z-]', '', word)

def process_data(data):
    """
    Recursively process the JSON data.
    If data is a dictionary, process each value.
    If data is a list, process each element.
    """
    if isinstance(data, dict):
        return {key: process_data(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [process_data(item) for item in data]
    elif isinstance(data, str):
        return clean_word(data)
    else:
        return data

def main():
    input_filename = "categorized_words.json"
    output_filename = "edited_categorized_words.json"

    # Read the original JSON file.
    with open(input_filename, "r", encoding="utf-8") as infile:
        data = json.load(infile)

    # Process the JSON data.
    processed_data = process_data(data)

    # Write the processed data to a new file.
    with open(output_filename, "w", encoding="utf-8") as outfile:
        json.dump(processed_data, outfile, ensure_ascii=False, indent=4)

    print(f"Processed file saved as {output_filename}")

if __name__ == "__main__":
    main()
