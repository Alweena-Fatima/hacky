from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np
import cv2
from datetime import datetime
from extractor import front_data
import base64

app = Flask(__name__)
CORS(app)

def convert_to_cv2_image(file_storage):
    image_bytes = file_storage.read()
    npimg = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    return img

def calculate_age(dob_str):
    try:
        dob = datetime.strptime(dob_str, "%d/%m/%Y")
        today = datetime.today()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    except:
        return None

@app.route('/extract', methods=['POST'])
def extract_front_info():
    try:
        file = request.files['file']
        image = convert_to_cv2_image(file)

        name, gender, dob, aadhaar, face_img = front_data(image)
        age = calculate_age(dob) if dob else None

        face_base64 = None
        if face_img is not None:
            _, buffer = cv2.imencode('.jpg', face_img)
            face_base64 = base64.b64encode(buffer).decode('utf-8')

        return jsonify({
            "name": " ".join(name) if name else None,
            "dob": dob,
            "age": f"{age} years" if age else "Not available",
            "photo": f"data:image/jpeg;base64,{face_base64}" if face_base64 else None
        })
    except Exception as e:
        print("❌ Server error:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
