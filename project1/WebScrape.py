import requests
from bs4 import BeautifulSoup
import os
import time

# URL for the Gutenberg Science Fiction and Fantasy bookshelf (first page only)
base_url = 'https://www.gutenberg.org/ebooks/bookshelf/480'

# Path for the combined output file
combined_file = 'combined_books.txt'

def get_book_links(url):
    """
    Fetches book links from the given Project Gutenberg bookshelf page.
    Returns a list of full URLs for individual book pages.
    """
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    book_links = []

    # Look for links that follow the pattern for ebook pages
    for link in soup.find_all('a', href=True):
        href = link['href']
        # Filter for links like "/ebooks/12345" (ensure uniqueness)
        if href.startswith('/ebooks/') and href.count('/') == 2:
            full_link = 'https://www.gutenberg.org' + href
            if full_link not in book_links:
                book_links.append(full_link)

    return book_links

def clean_text(text):
    """
    Removes the Project Gutenberg header and footer markers,
    returning only the main content of the book.
    """
    start_marker = "*** START OF THE PROJECT GUTENBERG EBOOK"
    end_marker = "*** END OF THE PROJECT GUTENBERG EBOOK"

    inside_book = False
    cleaned_lines = []

    for line in text.splitlines():
        if start_marker in line:
            inside_book = True
            continue  # Skip the marker line itself
        if end_marker in line:
            inside_book = False
            break  # Stop processing after the end marker

        if inside_book:
            cleaned_lines.append(line)

    return "\n".join(cleaned_lines).strip()

def download_and_clean_text(book_url):
    """
    Downloads the 'Plain Text UTF-8' file from a given book page,
    cleans the text, and returns the cleaned content.
    """
    response = requests.get(book_url)
    soup = BeautifulSoup(response.content, 'html.parser')
    txt_url = None

    # Find the first link containing "Plain Text UTF-8"
    for link in soup.find_all('a', href=True):
        if "Plain Text UTF-8" in link.get_text():
            txt_url = 'https://www.gutenberg.org' + link['href']
            break

    if txt_url:
        txt_response = requests.get(txt_url)
        raw_text = txt_response.text
        cleaned = clean_text(raw_text)
        return cleaned
    else:
        print(f"No Plain Text UTF-8 version found for: {book_url}")
        return None

def main():
    print("Fetching book links from the first page...")
    book_links = get_book_links(base_url)
    print(f"Found {len(book_links)} book links on the first page.")

    combined_texts = []

    for index, book_link in enumerate(book_links, start=1):
        print(f"Processing book {index}: {book_link}")
        cleaned_text = download_and_clean_text(book_link)
        if cleaned_text:
            # Create a header to separate each book's text in the combined file
            header = f"\n{'='*80}\nBook URL: {book_link}\n{'='*80}\n"
            combined_texts.append(header + cleaned_text)
        time.sleep(1)  # Delay to be courteous to the server

    # Write the combined texts to a single file
    with open(combined_file, 'w', encoding='utf-8') as f:
        f.write("\n\n".join(combined_texts))
    print(f"Combined text saved to '{combined_file}'.")

if __name__ == '__main__':
    main()
