import json
import nltk
import re

# Download required NLTK data files (if not already downloaded)
nltk.download('punkt')
nltk.download('averaged_perceptron_tagger')
nltk.download('maxent_ne_chunker')
nltk.download('words')
nltk.download('punkt_tab')
nltk.download('averaged_perceptron_tagger_eng')
nltk.download('maxent_ne_chunker_tab')

from nltk import word_tokenize, pos_tag, ne_chunk

# Input and output file paths
input_file = 'combined_books.txt'
output_file = 'categorized_words.json'

# Initialize dictionaries (using sets for uniqueness)
categories = {
    "nouns": set(),
    "proper_nouns": set(),
    "verbs": set(),
    "adjectives": set(),
    "adverbs": set(),
    "characters": set()  # extracted PERSON entities
}

# Read the combined text file
with open(input_file, 'r', encoding='utf-8') as f:
    text = f.read()

# Tokenize the text into words
tokens = word_tokenize(text)

# Remove tokens that are just punctuation (optional cleanup)
# This regex keeps tokens that have at least one alphanumeric character.
tokens = [token for token in tokens if re.search(r'\w', token)]

# Get part-of-speech tags
tagged_tokens = pos_tag(tokens)

# Iterate over each token and organize them by their part-of-speech
for word, tag in tagged_tokens:
    # Lowercase the word for consistency (except proper names, perhaps)
    lw = word.lower()

    # Common Noun: NN (singular), NNS (plural)
    if tag in ('NN', 'NNS'):
        categories["nouns"].add(lw)
    # Proper Nouns: NNP (singular), NNPS (plural)
    if tag in ('NNP', 'NNPS'):
        categories["proper_nouns"].add(word)  # preserve original case
    # Verbs: any tag that starts with VB
    if tag.startswith('VB'):
        categories["verbs"].add(lw)
    # Adjectives: any tag that starts with JJ
    if tag.startswith('JJ'):
        categories["adjectives"].add(lw)
    # Adverbs: any tag that starts with RB (includes RB, RBR, RBS, WRB)
    if tag.startswith('RB'):
        categories["adverbs"].add(lw)

# Use Named Entity Recognition to extract PERSON names ("characters")
# Note: ne_chunk expects POS-tagged tokens
ne_tree = ne_chunk(tagged_tokens, binary=False)
for subtree in ne_tree:
    if hasattr(subtree, 'label') and subtree.label() == 'PERSON':
        # Join the parts of the name (e.g., "Elizabeth" or "Elizabeth Bennet")
        name = " ".join([token for token, pos in subtree.leaves()])
        categories["characters"].add(name)

# Convert each set to a sorted list for JSON serialization
for key in categories:
    categories[key] = sorted(list(categories[key]))

# Save the organized words into a JSON file
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(categories, f, indent=4)

print(f"Categorized words have been saved to '{output_file}'.")
