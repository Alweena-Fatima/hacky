import pytesseract
import cv2
import numpy as np
import spacy
import re
from datetime import datetime

# Tesseract path (update this if needed)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Load face detector
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

# Load spaCy NER model once (better performance)
NER = spacy.load("en_core_web_sm")

def preprocess_image(img):
    """Enhanced image preprocessing for better OCR results"""
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Apply different preprocessing techniques
    processed_images = []
    
    # Original grayscale
    processed_images.append(gray)
    
    # Gaussian blur + threshold
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    _, thresh1 = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    processed_images.append(thresh1)
    
    # Adaptive threshold
    adaptive_thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                          cv2.THRESH_BINARY, 11, 2)
    processed_images.append(adaptive_thresh)
    
    # Morphological operations to clean text
    kernel = np.ones((2, 2), np.uint8)
    morph = cv2.morphologyEx(thresh1, cv2.MORPH_CLOSE, kernel)
    processed_images.append(morph)
    
    # Contrast enhancement
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced = clahe.apply(gray)
    processed_images.append(enhanced)
    
    return processed_images

def extract_text_multiple_configs(img):
    """Extract text using multiple OCR configurations"""
    configs = [
        "--psm 3 --oem 3",  # Default
        "--psm 4 --oem 3",  # Single column
        "--psm 6 --oem 3",  # Single uniform block
        "--psm 7 --oem 3",  # Single text line
        "--psm 8 --oem 3",  # Single word
        "--psm 11 --oem 3", # Sparse text
        "--psm 13 --oem 3"  # Raw line
    ]
    
    all_text = []
    processed_images = preprocess_image(img)
    
    for proc_img in processed_images:
        for config in configs:
            try:
                text = pytesseract.image_to_string(proc_img, lang='eng', config=config)
                if text.strip():
                    all_text.append(text)
            except:
                continue
    
    return all_text

def extract_name_enhanced(text_list):
    """Enhanced name extraction using multiple approaches"""
    all_names = []
    
    for text in text_list:
        # Method 1: spaCy NER
        try:
            doc = NER(text)
            for ent in doc.ents:
                if ent.label_ == "PERSON":
                    names = ent.text.strip().split()
                    all_names.extend(names)
        except:
            pass
        
        # Method 2: Pattern matching for Indian names
        # Look for capitalized words that could be names
        name_patterns = [
            r"Name[:\s]*([A-Z][a-z]+(?: [A-Z][a-z]+)*)",
            r"([A-Z][A-Z\s]{10,})",  # All caps names
            r"\b([A-Z][a-z]{2,}(?: [A-Z][a-z]{2,}){1,3})\b"  # Proper case names
        ]
        
        for pattern in name_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    match = match[0]
                words = match.split()
                # Filter out common non-name words
                filtered_words = [w for w in words if w.lower() not in 
                                ['male', 'female', 'name', 'dob', 'government', 'india', 'card', 'aadhaar']]
                all_names.extend(filtered_words)
    
    # Remove duplicates and common false positives
    unique_names = list(set(all_names))
    return [name for name in unique_names if len(name) > 2]

def extract_gender_enhanced(text_list):
    """Enhanced gender extraction"""
    for text in text_list:
        # Multiple gender patterns
        gender_patterns = [
            r"\b(MALE|FEMALE|Male|Female|male|female)\b",
            r"Gender[:\s]*(MALE|FEMALE|Male|Female|male|female)",
            r"Sex[:\s]*(MALE|FEMALE|Male|Female|male|female)",
            r"M/F[:\s]*(M|F|Male|Female)"
        ]
        
        for pattern in gender_patterns:
            match = re.search(pattern, text)
            if match:
                gender = match.group(1).upper()
                if gender in ['M', 'MALE']:
                    return 'MALE'
                elif gender in ['F', 'FEMALE']:
                    return 'FEMALE'
    return None

def extract_dob_enhanced(text_list):
    """Enhanced DOB extraction with multiple date formats including YYYY/MM/DD"""
    
    def is_valid_date_parts(day, month, year):
        """Validate date components"""
        try:
            day, month, year = int(day), int(month), int(year)
            if year < 1900 or year > 2100:
                return False
            if month < 1 or month > 12:
                return False
            if day < 1 or day > 31:
                return False
            # Basic month-day validation
            if month in [4, 6, 9, 11] and day > 30:
                return False
            if month == 2 and day > 29:
                return False
            return True
        except:
            return False
    
    def parse_date_intelligently(part1, part2, part3):
        """Intelligently determine date format based on values"""
        p1, p2, p3 = int(part1), int(part2), int(part3)
        
        # Determine which part is the year (4 digits or reasonable year range)
        if len(part1) == 4 and 1900 <= p1 <= 2100:
            # Format: YYYY/??/??
            year = part1
            # Determine MM/DD vs DD/MM
            if p2 > 12:  # p2 must be day
                month, day = part3, part2
            elif p3 > 12:  # p3 must be day
                month, day = part2, part3
            elif p2 <= 12 and p3 <= 12:  # Both could be month or day
                # Default to YYYY/MM/DD format
                month, day = part2, part3
            else:
                return None
                
        elif len(part3) == 4 and 1900 <= p3 <= 2100:
            # Format: ??/??/YYYY
            year = part3
            # Determine DD/MM vs MM/DD
            if p1 > 12:  # p1 must be day
                day, month = part1, part2
            elif p2 > 12:  # p2 must be day
                day, month = part2, part1
            elif p1 <= 12 and p2 <= 12:  # Both could be month or day
                # Default to DD/MM/YYYY format (common in India)
                day, month = part1, part2
            else:
                return None
                
        elif len(part2) == 4 and 1900 <= p2 <= 2100:
            # Format: ??/YYYY/?? (less common)
            year = part2
            if p1 > 12:  # p1 must be day
                day, month = part1, part3
            elif p3 > 12:  # p3 must be day
                day, month = part3, part1
            else:
                day, month = part1, part3
        else:
            return None
            
        return day, month, year
    
    # Date patterns - order matters for priority
    date_patterns = [
        # Labeled patterns (highest priority)
        r"Date of Birth[:\s]*(\d{4})[/\-\.](\d{1,2})[/\-\.](\d{1,2})",  # Date of Birth: YYYY/MM/DD
        r"DOB[:\s]*(\d{4})[/\-\.](\d{1,2})[/\-\.](\d{1,2})",  # DOB: YYYY/MM/DD
        r"Date of Birth[:\s]*(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{4})",  # Date of Birth: DD/MM/YYYY
        r"DOB[:\s]*(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{4})",  # DOB: DD/MM/YYYY
        
        # Unlabeled patterns
        r"\b(\d{4})[/\-\.](\d{1,2})[/\-\.](\d{1,2})\b",  # YYYY/MM/DD
        r"\b(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{4})\b",  # DD/MM/YYYY
        r"\b(\d{1,2})[/\-\.](\d{4})[/\-\.](\d{1,2})\b",  # DD/YYYY/MM (rare)
        
        # 2-digit year patterns
        r"\b(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{2})\b",  # DD/MM/YY
        
        # Year only patterns
        r"Year[:\s]*(\d{4})",
        r"Born[:\s]*(\d{4})",
        r"\b(19[0-9]{2}|20[0-2][0-9])\b"  # Standalone year
    ]
    
    for text in text_list:
        # Clean text for better matching
        cleaned_text = re.sub(r'\s+', ' ', text).strip()
        
        for i, pattern in enumerate(date_patterns):
            matches = re.findall(pattern, cleaned_text, re.IGNORECASE)
            
            if matches:
                for match in matches:
                    if isinstance(match, tuple) and len(match) == 3:
                        part1, part2, part3 = match
                        
                        # Handle 2-digit year case
                        if i == 7:  # 2-digit year pattern
                            day, month, year = part1, part2, part3
                            year = "19" + year if int(year) > 50 else "20" + year
                        else:
                            # Use intelligent parsing
                            result = parse_date_intelligently(part1, part2, part3)
                            if not result:
                                continue
                            day, month, year = result
                        
                        # Validate the parsed date
                        if is_valid_date_parts(day, month, year):
                            return f"{str(day).zfill(2)}/{str(month).zfill(2)}/{year}"
                    
                    elif isinstance(match, str) and len(match) == 4:
                        # Year only match
                        year = int(match)
                        if 1900 <= year <= datetime.now().year:
                            return match
    
    return None

def extract_aadhaar_enhanced(text_list):
    """Enhanced Aadhaar number extraction"""
    aadhaar_patterns = [
        r"\b(\d{4}\s\d{4}\s\d{4})\b",  # Standard format with spaces
        r"\b(\d{4}-\d{4}-\d{4})\b",    # With hyphens
        r"\b(\d{12})\b",               # Without separators
        r"Aadhaar[:\s]*(\d{4}\s?\d{4}\s?\d{4})",  # With label
        r"(\d{4}\s?\d{4}\s?\d{4})"     # Flexible spacing
    ]
    
    for text in text_list:
        for pattern in aadhaar_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                # Clean the match
                clean_match = re.sub(r'[^\d]', '', match)
                if len(clean_match) == 12:
                    # Format as standard Aadhaar
                    return f"{clean_match[:4]} {clean_match[4:8]} {clean_match[8:12]}"
    
    return None

def front_data(img):
    """Enhanced main function for Aadhaar data extraction"""
    regex_name = []
    regex_gender = None
    regex_dob = None
    regex_aadhaar_number = None
    face_img = None
    
    # 🧠 Face detection (unchanged)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
    if len(faces) > 0:
        x, y, w, h = faces[0]
        face_img = img[y:y+h, x:x+w]
    
    # 🧠 Enhanced OCR with multiple preprocessing and configurations
    print("Extracting text using multiple approaches...")
    all_text = extract_text_multiple_configs(img)
    
    # Debug: Print extracted text
    print(f"Extracted {len(all_text)} text variations")
    
    # 🧠 Enhanced data extraction
    regex_name = extract_name_enhanced(all_text)
    regex_gender = extract_gender_enhanced(all_text)
    regex_dob = extract_dob_enhanced(all_text)
    regex_aadhaar_number = extract_aadhaar_enhanced(all_text)
    
    # Debug output
    print(f"Name: {regex_name}")
    print(f"Gender: {regex_gender}")
    print(f"DOB: {regex_dob}")
    print(f"Aadhaar: {regex_aadhaar_number}")
    
    return (regex_name, regex_gender, regex_dob, regex_aadhaar_number, face_img)

# Optional: Function to validate extracted data
def validate_aadhaar_data(name, gender, dob, aadhaar):
    """Validate extracted Aadhaar data"""
    validation_results = {
        'name_valid': bool(name and len(name) > 0),
        'gender_valid': gender in ['MALE', 'FEMALE'] if gender else False,
        'dob_valid': bool(dob),
        'aadhaar_valid': bool(aadhaar and len(re.sub(r'[^\d]', '', aadhaar)) == 12)
    }
    
    return validation_results

# Test function for debugging date extraction
def test_date_extraction(test_text):
    """Test date extraction on sample text"""
    print(f"Testing date extraction on: {test_text}")
    result = extract_dob_enhanced([test_text])
    print(f"Result: {result}")
    return result

# Example usage:
# img = cv2.imread('aadhaar_card.jpg')
# name, gender, dob, aadhaar, face = front_data(img)
# validation = validate_aadhaar_data(name, gender, dob, aadhaar)

# Test with your example:
# test_date_extraction("Date of Birth: 1995/17/2006")
# test_date_extraction("DOB: 2006/02/17")
# test_date_extraction("17/02/2006")