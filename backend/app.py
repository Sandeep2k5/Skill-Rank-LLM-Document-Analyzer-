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
    "Contract": [
        "party_names", "effective_date", "contract_term", "payment_terms", 
        "scope_of_work", "termination_clause", "governing_law", "signatures",
        "confidentiality", "liability"
    ],
    "Invoice": [
        "invoice_number", "amount", "due_date", "tax", "bill_to", "bill_from",
        "payment_terms", "itemized_list", "subtotal", "total"
    ]
}

# Field descriptions for better context
FIELD_DESCRIPTIONS = {
    "Contract": {
        "party_names": "Names of all parties involved in the contract",
        "effective_date": "Start date of the contract",
        "contract_term": "Duration or term of the contract",
        "payment_terms": "Terms and conditions of payment",
        "scope_of_work": "Detailed description of services or deliverables",
        "termination_clause": "Conditions for contract termination",
        "governing_law": "Jurisdiction and applicable laws",
        "signatures": "Signatures of all parties",
        "confidentiality": "Confidentiality and non-disclosure terms",
        "liability": "Liability and indemnification clauses"
    },
    "Invoice": {
        "invoice_number": "Unique identifier for the invoice",
        "amount": "Total amount to be paid",
        "due_date": "Payment deadline",
        "tax": "Tax amounts and rates",
        "bill_to": "Client billing information",
        "bill_from": "Company/sender information",
        "payment_terms": "Payment conditions and terms",
        "itemized_list": "Detailed list of products/services",
        "subtotal": "Sum before taxes and adjustments",
        "total": "Final amount including all charges"
    }
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
    """Uses Google Gemini to find missing fields and analyze document completeness."""
    if doc_type not in REQUIRED_FIELDS:
        return {"missing_fields": [], "recommendations": ["Document type does not have a defined set of required fields."]}

    required = REQUIRED_FIELDS[doc_type]
    field_desc = FIELD_DESCRIPTIONS[doc_type]
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        
        prompt = f"""
        You are an expert document analyst specializing in {doc_type.lower()} analysis. 
        Analyze the following document text thoroughly and provide a detailed assessment.

        Required fields for a {doc_type}:
        {json.dumps(field_desc, indent=2)}

        Analyze the document for these aspects:
        1. Present/Missing Fields
        2. Quality and Completeness
        3. Legal Compliance
        4. Potential Risks
        5. Best Practices

        Return your response as a JSON object with these keys:
        1. "missing_fields": List of missing required fields
        2. "incomplete_fields": List of fields that are present but need improvement
        3. "recommendations": List of specific, actionable recommendations for each issue
        4. "risk_factors": List of potential risks or concerns identified
        5. "compliance_notes": List of compliance-related observations
        6. "completeness_score": Number between 0-100 indicating overall document quality
        7. "critical_issues": List of high-priority issues that need immediate attention

        Document Text:
        ---
        {text[:8000]}
        ---

        Provide detailed, professional analysis focusing on both technical completeness and practical business implications.
        """
        response = model.generate_content(prompt, generation_config=json_generation_config)
        result = json.loads(response.text)
        
        # Ensure all expected fields are present in the response
        required_keys = ["missing_fields", "incomplete_fields", "recommendations", 
                        "risk_factors", "compliance_notes", "completeness_score", 
                        "critical_issues"]
        for key in required_keys:
            if key not in result:
                result[key] = [] if key != "completeness_score" else 0
                
        return result
    except Exception as e:
        print(f"Error in Gemini missing fields analysis: {e}")
        return {"missing_fields": ["Analysis Error"], "recommendations": ["Could not perform analysis due to an API error."]}

# --- API ROUTES (No changes needed below this line) ---
@app.route('/documents', methods=['GET'])
def get_documents():
    """Get a list of all uploaded documents."""
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        'SELECT d.id as document_id, d.filename, r.doc_type, r.confidence '
        'FROM documents d LEFT JOIN analysis_results r ON d.id = r.doc_id '
        'ORDER BY d.id DESC'
    )
    documents = cursor.fetchall()
    
    return jsonify([{
        'document_id': doc['document_id'],
        'filename': doc['filename'],
        'classification': {
            'document_type': doc['doc_type'] if doc['doc_type'] else 'Unknown',
            'confidence_score': doc['confidence'] if doc['confidence'] else 0.0
        }
    } for doc in documents]), 200

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
            "analysis": {
                "missing_fields": analysis_result.get("missing_fields", []),
                "incomplete_fields": analysis_result.get("incomplete_fields", []),
                "recommendations": analysis_result.get("recommendations", []),
                "risk_factors": analysis_result.get("risk_factors", []),
                "compliance_notes": analysis_result.get("compliance_notes", []),
                "completeness_score": analysis_result.get("completeness_score", 0),
                "critical_issues": analysis_result.get("critical_issues", [])
            }
        }), 201
    else:
        return jsonify({"error": "File type not allowed"}), 400

@app.route('/analysis/<int:doc_id>', methods=['GET'])
def get_analysis_result(doc_id):
    db = get_db()
    cursor = db.cursor()
    try:
        # Get document metadata and content
        cursor.execute(
            'SELECT d.id, d.filename, d.content, r.doc_type, r.confidence '
            'FROM documents d '
            'LEFT JOIN analysis_results r ON d.id = r.doc_id '
            'WHERE d.id = ?',
            (doc_id,)
        )
        result = cursor.fetchone()
        
        if result is None:
            return jsonify({"error": "Document not found"}), 404

        # Get or re-analyze the document
        doc_type = result['doc_type'] or 'Unknown'
        analysis_result = analyze_missing_fields(result['content'], doc_type)

        # Add error handlers for missing fields
        if not isinstance(analysis_result, dict):
            analysis_result = {
                "missing_fields": [],
                "incomplete_fields": [],
                "recommendations": ["Analysis failed"],
                "risk_factors": [],
                "compliance_notes": [],
                "completeness_score": 0,
                "critical_issues": ["Failed to analyze document"]
            }

        response_data = {
            "document_id": result['id'],
            "filename": result['filename'],
            "classification": {
                "document_type": doc_type,
                "confidence_score": result['confidence'] or 0.0
            },
            "analysis": {
                "missing_fields": analysis_result.get("missing_fields", []),
                "incomplete_fields": analysis_result.get("incomplete_fields", []),
                "recommendations": analysis_result.get("recommendations", []),
                "risk_factors": analysis_result.get("risk_factors", []),
                "compliance_notes": analysis_result.get("compliance_notes", []),
                "completeness_score": analysis_result.get("completeness_score", 0),
                "critical_issues": analysis_result.get("critical_issues", [])
            }
        }
        
        print("Sending response:", json.dumps(response_data, indent=2))
        return jsonify(response_data), 200
    except Exception as e:
        print(f"Error in /analysis endpoint: {e}")
        return jsonify({"error": f"Failed to retrieve analysis: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)

