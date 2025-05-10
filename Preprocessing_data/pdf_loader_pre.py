import pdfplumber
import pytesseract
from PIL import Image
import io
import spacy
from langchain.schema import Document
import logging
import os

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

nlp = spacy.load("en_core_web_trf")

class CustomPDFLoader:
    def __init__(self, pdf_path, ocr_lang="eng"):
        self.pdf_path = pdf_path
        self.ocr_lang = ocr_lang

    def extract_text_with_ocr(self):
        try:
            with pdfplumber.open(self.pdf_path) as pdf:
                all_text = []
                for page_num, page in enumerate(pdf.pages, start=1):
                    text = page.extract_text()

                    if text:
                        logging.info(f"✅ Page {page_num}: extracted text length {len(text)}")
                    else:
                        logging.info(f"⚠️ Page {page_num} has no text. Running OCR...")
                        # Convert PDF page to image and run OCR
                        img = page.to_image(resolution=300).original
                        ocr_text = pytesseract.image_to_string(img, lang=self.ocr_lang)
                        text = ocr_text
                        logging.info(f"📝 Page {page_num} OCR text length {len(text)}")

                    all_text.append(text or "")  # Even if blank, append empty string
                full_text = "\n".join(all_text)
                logging.info(f"🚀 Total extracted raw text length: {len(full_text)}")
                return full_text
        except Exception as e:
            logging.error(f"Failed to process PDF with OCR: {e}")
            return ""

    def semantic_cleaning(self, raw_text):
        doc = nlp(raw_text)
        sentences = []

        irrelevant_entities = {"DATE", "CARDINAL", "ORDINAL"}
        irrelevant_keywords = ["page", "slide", "table of contents", "reference", "notes", "figure", "list of figures"]

        for sent in doc.sents:
            sent_text = sent.text.strip()

            if len(sent_text) < 10:
                continue

            # If sentence is mostly numbers or symbols, skip
            if sum(c.isalpha() for c in sent_text) < len(sent_text) * 0.4:
                continue

            if any(ent.label_ in irrelevant_entities for ent in sent.ents):
                continue

            if any(sent_text.lower().startswith(keyword) for keyword in irrelevant_keywords):
                continue

            sentences.append(sent_text)

        cleaned_text = "\n".join(sentences)
        logging.info(f"🧹 Cleaned text length: {len(cleaned_text)}")
        return cleaned_text

    def remove_person_names(self, text):
        doc = nlp(text)
        tokens = [token.text for token in doc if token.ent_type_ != "PERSON"]
        final_text = " ".join(tokens)
        logging.info(f"📝 Final text length after NER cleaning: {len(final_text)}")
        return final_text

    def load(self):
        try:
            logging.info("🔍 Extracting text using OCR/text extraction...")
            raw_text = self.extract_text_with_ocr()

            logging.info("🧹 Cleaning text semantically...")
            clean_text = self.semantic_cleaning(raw_text)

            logging.info("👤 Removing person names via transformer NER...")
            final_text = self.remove_person_names(clean_text)

            if len(final_text.strip()) == 0:
                logging.warning("⚠️ Warning: Final extracted text is EMPTY after all cleaning steps.")

            return [Document(page_content=final_text)]
        except Exception as e:
            logging.error(f"Failed to process PDF: {e}")
            return []

    def save_to_file(self, text):
        output_dir = "./output"
        os.makedirs(output_dir, exist_ok=True)
        filename = os.path.splitext(os.path.basename(self.pdf_path))[0] + "_extracted.txt"
        output_path = os.path.join(output_dir, filename)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(text)
        logging.info(f"✅ Saved extracted text to: {output_path}")
