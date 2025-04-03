# import os
# import fitz  
# from PIL import Image
# import io
# import json
# import base64


# def extract_text_from_pdf(pdf_path):
#     doc = fitz.open(pdf_path)
#     text = ""
#     for page_num in range(len(doc)):
#         page = doc.load_page(page_num)
#         text += page.get_text()
#     return text

# def extract_images_from_pdf(pdf_path):
#     doc = fitz.open(pdf_path)
#     images = []
#     for page_num in range(len(doc)):
#         page = doc.load_page(page_num)
#         image_list = page.get_images(full=True)
#         for img_index, img in enumerate(image_list):
#             xref = img[0]
#             base_image = doc.extract_image(xref)
#             image_bytes = base_image["image"]
#             image = Image.open(io.BytesIO(image_bytes))
#             images.append(image)
#     return images

# def preprocess_text(text):
    
#     text = text.lower()
#     text = text.replace('\n', ' ')
#     return text

# def preprocess_images(images):
#     preprocessed_images = []
#     for image in images:
     
#         image = image.convert("L") 
#         preprocessed_images.append(image)
#     return preprocessed_images

# def process_pdf(pdf_path):
#     text = extract_text_from_pdf(pdf_path)
#     images = extract_images_from_pdf(pdf_path)
    
#     preprocessed_text = preprocess_text(text)
#     preprocessed_images = preprocess_images(images)
    
#     return preprocessed_text, preprocessed_images

# def process_all_pdfs(directory):
#     results = {}
#     for root, _, files in os.walk(directory):
#         for file in files:
#             if file.endswith(".pdf"):
#                 pdf_path = os.path.join(root, file)
#                 preprocessed_text, preprocessed_images = process_pdf(pdf_path)
#                 results[file] = {
#                     "text": preprocessed_text,
#                     "images": [base64.b64encode(image.tobytes()).decode('utf-8') for image in preprocessed_images]

#                 }
#     return results

# def save_results_to_json(results, output_file):
#     with open(output_file, 'w') as f:
#         json.dump(results, f)


# directory = "../DATA/3rd_year/Data_mining"
# output_file = "data_minig.json"
# results = process_all_pdfs(directory)
# save_results_to_json(results, output_file)

import pdf_loader_pre

path = r"../DATA/3rd_year/Data_mining/Data - Part 1.pdf"

CustomPDFLoader = pdf_loader_pre.CustomPDFLoader(path)
data = CustomPDFLoader.load()

print(data)