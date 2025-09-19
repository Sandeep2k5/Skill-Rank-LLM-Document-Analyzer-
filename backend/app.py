import os
import sqlite3
import json
import fitz  # PyMuPDF
from flask import Flask, request, jsonify, g
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from flask_cors import CORS
import google.generativeai as genai # <-- Switched from OpenAI

load_dotenv()

# --- CONFIGURATION ---
UPLOAD_FOLDER = 'uploads'
DATABASE = 'documents.db'
ALLOWED_EXTENSIONS = {'pdf'}

# This line is now changed to securely get the Google API key.
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")

# --- FLASK APP SETUP ---
app = Flask(__name__)
CORS(app)

# Add a check to ensure the API key was loaded
if not GOOGLE_API_KEY:
    raise ValueError("No GOOGLE_API_KEY set in the environment or .env file")

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure the upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# --- DATABASE SETUP ---
def get_db():
    """Opens a new database connection if there is none yet for the current application context."""
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE, detect_types=sqlite3.PARSE_DECLTYPES)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_connection(exception):
    """Closes the database again at the end of the request."""
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    """Initializes the database schema."""
    with app.app_context():
        db = get_db()
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()

# Command to initialize DB: flask --app app init-db
@app.cli.command('init-db')
def init_db_command():
    """Clear existing data and create new tables."""
    init_db()
    print('Initialized the database.')


# --- HELPER FUNCTIONS ---
def allowed_file(filename):
    """Checks if a file's extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(filepath):
    """Extracts text content from a PDF file."""
    try:
        doc = fitz.open(filepath)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    except Exception as e:
        print(f"Error extracting text from {filepath}: {e}")
        return None

# --- LLM INTEGRATION (GOOGLE GEMINI) ---
# Configure the Gemini client with the API key
genai.configure(api_key=GOOGLE_API_KEY)

# Field requirements for different document types
REQUIRED_FIELDS = {
    "Contract": ["party_1", "party_2", "signature", "date", "payment_terms"],
    "Invoice": ["invoice_number", "amount", "due_date", "tax", "bill_to", "bill_from"]
}

# Set up the generation configuration for JSON output
json_generation_config = genai.GenerationConfig(response_mime_type="application/json")

def classify_document(text):
    """Uses Google Gemini to classify the document type."""
    try:
        # Using a modern, fast, and capable Gemini model
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        
        prompt = f"""
        Analyze the following document text and classify its type.
        The possible types are "Contract", "Invoice", "Report", or "Other".
        Return your response as a JSON object with two keys: "document_type" (string) and "confidence_score" (float between 0.0 and 1.0).

        Document Text:
        ---
        {text[:8000]}
        ---
        """
        response = model.generate_content(prompt, generation_config=json_generation_config)
        result = json.loads(response.text)
        return result
    except Exception as e:
        print(f"Error in Gemini classification: {e}")
        return {"document_type": "Error", "confidence_score": 0.0}

def analyze_missing_fields(text, doc_type):
    """Uses Google Gemini to find missing fields based on document type."""
    if doc_type not in REQUIRED_FIELDS:
        return {"missing_fields": [], "recommendations": ["Document type does not have a defined set of required fields."]}

    required = REQUIRED_FIELDS[doc_type]
    try:
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        
        prompt = f"""
        You are an expert document analyst. Analyze the text from a document identified as a "{doc_type}".
        The required fields for this document type are: {', '.join(required)}.

        Your task is to identify which of these required fields are missing from the text and provide actionable recommendations.

        Return your response as a JSON object with two keys:
        1. "missing_fields": A list of strings, where each string is a missing field name.
        2. "recommendations": A list of strings, with specific, actionable suggestions for completing the document.

        Document Text:
        ---
        {text[:8000]}
        ---
        """
        response = model.generate_content(prompt, generation_config=json_generation_config)
        result = json.loads(response.text)
        return result
    except Exception as e:
        print(f"Error in Gemini missing fields analysis: {e}")
        return {"missing_fields": ["Analysis Error"], "recommendations": ["Could not perform analysis due to an API error."]}

# --- API ROUTES (No changes needed below this line) ---
@app.route('/upload', methods=['POST'])
def upload_and_analyze_document():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        text_content = extract_text_from_pdf(filepath)
        if text_content is None:
            return jsonify({"error": "Could not extract text from PDF"}), 500

        db = get_db()
        cursor = db.cursor()

        cursor.execute(
            'INSERT INTO documents (filename, content) VALUES (?, ?)',
            (filename, text_content)
        )
        doc_id = cursor.lastrowid
        db.commit()

        classification_result = classify_document(text_content)
        doc_type = classification_result.get("document_type", "Other")
        confidence = classification_result.get("confidence_score", 0.0)

        analysis_result = analyze_missing_fields(text_content, doc_type)
        missing_fields = analysis_result.get("missing_fields", [])
        recommendations = analysis_result.get("recommendations", [])

        cursor.execute(
            'INSERT INTO analysis_results (doc_id, doc_type, confidence, missing_fields, recommendations) VALUES (?, ?, ?, ?, ?)',
            (doc_id, doc_type, confidence, json.dumps(missing_fields), json.dumps(recommendations))
        )
        db.commit()

        return jsonify({
            "message": "File uploaded and analyzed successfully",
            "document_id": doc_id,
            "filename": filename,
            "classification": classification_result,
            "analysis": analysis_result
        }), 201
    else:
        return jsonify({"error": "File type not allowed"}), 400

@app.route('/analysis/<int:doc_id>', methods=['GET'])
def get_analysis_result(doc_id):
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        'SELECT d.filename, r.doc_type, r.confidence, r.missing_fields, r.recommendations '
        'FROM documents d JOIN analysis_results r ON d.id = r.doc_id WHERE d.id = ?',
        (doc_id,)
    )
    result = cursor.fetchone()

    if result is None:
        return jsonify({"error": "Analysis not found for the given document ID"}), 404

    return jsonify({
        "document_id": doc_id,
        "filename": result['filename'],
        "classification": {
            "document_type": result['doc_type'],
            "confidence_score": result['confidence']
        },
        "analysis": {
            "missing_fields": json.loads(result['missing_fields']),
            "recommendations": json.loads(result['recommendations'])
        }
    }), 200

if __name__ == '__main__':
    app.run(debug=True)

