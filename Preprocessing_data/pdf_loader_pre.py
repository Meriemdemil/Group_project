import fitz
import pytesseract
from pdf2image import convert_from_path
import re
import spacy
from langchain.schema import Document
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

nlp = spacy.load("en_core_web_trf")

class CustomPDFLoader:
    def __init__(self, pdf_path, ocr_lang="eng"):
        """
        Initialize the PDF loader.

        Args:
            pdf_path (str): Path to the PDF file.
            ocr_lang (str): Language for OCR (default is English).
        """
        self.pdf_path = pdf_path
        self.ocr_lang = ocr_lang

    def extract_text_from_pdf(self):
        """
        Extract text and images using OCR from a PDF file.
    
        Returns:
            str: Extracted text from the PDF.
        """
        try:
            doc = fitz.open(self.pdf_path)
            extracted_text = []
    
            for page_num in range(len(doc)):
                # Extract text from the page
                text = doc[page_num].get_text("text")
                extracted_text.append(text)
    
                # Extract text from images using OCR
                images = convert_from_path(self.pdf_path, first_page=page_num + 1, last_page=page_num + 1)
                for img in images:
                    img_text = pytesseract.image_to_string(img, lang=self.ocr_lang)
                    extracted_text.append(img_text)
    
                # Extract table data (if applicable)
                table_text = doc[page_num].get_text("blocks")
                if table_text:
                    extracted_text.append("\n".join([block[4] for block in table_text if block[6] == 0]))
    
            return "\n".join(extracted_text)
        except Exception as e:
            logging.error(f"Error extracting text from PDF: {e}")
            return ""
        
    def extract_images_from_pdf(self):
            """
            Extract images from a PDF file and save them.
        
            Returns:
                list: List of file paths to the extracted images.
            """
            try:
                doc = fitz.open(self.pdf_path)
                image_paths = []
        
                for page_num in range(len(doc)):
                    for img_index, img in enumerate(doc[page_num].get_images(full=True)):
                        xref = img[0]
                        base_image = doc.extract_image(xref)
                        image_bytes = base_image["image"]
                        image_ext = base_image["ext"]
                        image_path = f"page_{page_num + 1}_img_{img_index + 1}.{image_ext}"
                        with open(image_path, "wb") as f:
                            f.write(image_bytes)
                        image_paths.append(image_path)
        
                return image_paths
            except Exception as e:
                logging.error(f"Error extracting images from PDF: {e}")
                return []

    

    def clean_text(self, text):
        """
        Clean raw text from PDF by removing artifacts like page numbers,
        headers, footers, bullet points, and fixing spacing and punctuation issues.
        """
        try:
            # Remove common structural noise
            text = re.sub(r"\b(Page|Slide|Lecture)\s*\d+\b", "", text, flags=re.IGNORECASE)

            # Remove table of contents-like lines (e.g., "1. Data Preprocessing")
            text = re.sub(r"^\d+\.\s+[A-Za-z\s]+$", "", text, flags=re.MULTILINE)

            # Remove headers and footers (customize if needed)
            text = re.sub(r"Data\s*Mining\s*Data\s*:\s*Part\s*\d+", "", text, flags=re.IGNORECASE)

            # Remove unwanted bullets and stray formatting characters
            text = re.sub(r"[•●▪○◦▶■♦◇✓✦]", " ", text)
            text = re.sub(r"\b[eo]\b", "", text)  # Stray letters like 'e' or 'o' used as bullets
            # Remove common structural noise
            text = re.sub(r"\b(Page|Slide|Lecture)\s*\d+\b", "", text, flags=re.IGNORECASE)
            text = re.sub(r"[•●○◦▶■♦◇✓✦]", " ", text)  # Remove bullet points
            text = re.sub(r"\s+", " ", text).strip()  # Remove extra spaces
            text = re.sub(r"\n+", "\n", text)  # Remove excessive newlines


            # Fix issues where words are jammed together (e.g., "DataPreprocessing" → "Data. Preprocessing")
            text = re.sub(r"([a-z])([A-Z])", r"\1. \2", text)

            # Remove multiple spaces, newlines, and clean whitespace
            text = re.sub(r"\s{2,}", " ", text)
            text = re.sub(r"\n{2,}", "\n", text)
            text = re.sub(r"\s+\n", "\n", text)
            text = re.sub(r"\n\s+", "\n", text)
            text = re.sub(r"\s+", " ", text)

            # Strip trailing/leading non-text characters on each line
            text = "\n".join(re.sub(r"^\W+|\W+$", "", line) for line in text.splitlines())

            return text.strip()

        except Exception as e:
            logging.error(f"Error cleaning text: {e}")
            return text


    def remove_names(self, text):
        """
        Remove personal names using Named Entity Recognition (NER) and regex.
    
        Args:
            text (str): Text to process.
    
        Returns:
            str: Text with personal names removed.
        """
        try:
            # Use SpaCy NER to remove names
            doc = nlp(text)
            cleaned_text = " ".join([token.text for token in doc if token.ent_type_ != "PERSON"])
    
            # Fallback: Use regex to remove common name patterns (e.g., "John Doe", "Mohammed Brahimi")
            name_pattern = r"\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)+\b"
            cleaned_text = re.sub(name_pattern, "", cleaned_text)
    
            return cleaned_text.strip()
        except Exception as e:
            logging.error(f"Error removing names: {e}")
            return text
        
    def load(self):
        """
        Load, clean, and return LangChain Document objects.

        Returns:
            list: List of LangChain Document objects.
        """
        try:
            logging.info("Starting PDF loading process...")
            extracted_text = self.extract_text_from_pdf()
            cleaned_text = self.clean_text(extracted_text)
            final_text = self.remove_names(cleaned_text)

            logging.info("PDF loading process completed successfully.")
            return [Document(page_content=final_text)]
        except Exception as e:
            logging.error(f"Error loading PDF: {e}")
            return []