-- schema.sql

-- Drop tables if they already exist to ensure a clean setup.
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS analysis_results;

-- Create the 'documents' table to store uploaded PDF content.
CREATE TABLE documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  content TEXT NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create the 'analysis_results' table to store the output from the LLM.
CREATE TABLE analysis_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doc_id INTEGER NOT NULL,
  doc_type TEXT NOT NULL,
  confidence REAL NOT NULL,
  missing_fields TEXT, -- Stored as a JSON string
  recommendations TEXT, -- Stored as a JSON string
  analyzed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doc_id) REFERENCES documents (id)
);