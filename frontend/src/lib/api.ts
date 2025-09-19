// API configuration
const API_BASE_URL = 'http://localhost:5000';

export interface Document {
  document_id: number;
  filename: string;
  classification: {
    document_type: string;
    confidence_score: number;
  };
  analysis: {
    missing_fields: string[];
    incomplete_fields: string[];
    recommendations: string[];
    risk_factors: string[];
    compliance_notes: string[];
    completeness_score: number;
    critical_issues: string[];
  };
  message: string;
}

export interface AnalysisResult {
  document_id: number;
  filename: string;
  classification: {
    document_type: string;
    confidence_score: number;
  };
  analysis: {
    missing_fields: string[];
    incomplete_fields: string[];
    recommendations: string[];
    risk_factors: string[];
    compliance_notes: string[];
    completeness_score: number;
    critical_issues: string[];
  };
}

// API functions for document analysis
export const uploadDocument = async (file: File): Promise<Document> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload document');
  }

  return response.json();
};

export const getDocumentAnalysis = async (documentId: string): Promise<AnalysisResult> => {
  const response = await fetch(`${API_BASE_URL}/analysis/${documentId}`);
  
  if (!response.ok) {
    throw new Error('Failed to get document analysis');
  }

  return response.json();
};

export const getDocuments = async (): Promise<Document[]> => {
  const response = await fetch(`${API_BASE_URL}/documents`);
  
  if (!response.ok) {
    throw new Error('Failed to get document list');
  }

  return response.json();
};