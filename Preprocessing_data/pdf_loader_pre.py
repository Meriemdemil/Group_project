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
                for page in pdf.pages:
                    # Extract text directly from the page
                    text = page.extract_text()

                    if not text:
                        # If no text, fallback to OCR
                        pix = page.to_image(resolution=300)
                        img = Image.open(io.BytesIO(pix.to_bytes()))
                        text = pytesseract.image_to_string(img, lang=self.ocr_lang)
                    
                    all_text.append(text)
                return "\n".join(all_text)
        except Exception as e:
            logging.error(f"Failed to process PDF with OCR: {e}")
            return ""

    def semantic_cleaning(self, raw_text):
        doc = nlp(raw_text)
        sentences = []
        
        # Define irrelevant entity labels
        irrelevant_entities = {"DATE", "CARDINAL", "ORDINAL"}

        # Define keywords indicating irrelevant content
        irrelevant_keywords = ["page", "slide", "table of contents", "reference", "notes", "figure", "list of figures"]

        for sent in doc.sentences:
            sent_text = sent.text.strip()

            # Skip short sentences
            if len(sent_text) < 10:
                continue

            # Check for unwanted entities
            if any(ent.type in irrelevant_entities for ent in sent.ents):
                continue

            # Check if the sentence starts with irrelevant keywords
            if any(sent_text.lower().startswith(keyword) for keyword in irrelevant_keywords):
                continue

            sentences.append(sent_text)
        
        return "\n".join(sentences)

    def remove_person_names(self, text):
        doc = nlp(text)
        return " ".join([token.text for token in doc if token.ent_type_ != "PERSON"])

    def load(self):
        try:
            logging.info("Extracting text using enhanced OCR...")

            raw_text = self.extract_text_with_ocr()
            logging.info("Cleaning text semantically...")

            clean_text = self.semantic_cleaning(raw_text)
            logging.info("Removing names via transformer NER...")

            final_text = self.remove_person_names(clean_text)
            return [Document(page_content=final_text)]
        except Exception as e:
            logging.error(f"Failed to process PDF: {e}")
            return []

    def save_to_file(self, text):
        output_dir = "./output"  # Customize your output directory
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        filename = os.path.splitext(os.path.basename(self.pdf_path))[0] + "_extracted.txt"
        output_path = os.path.join(output_dir, filename)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(text)
        logging.info(f"Saved extracted text to: {output_path}")

