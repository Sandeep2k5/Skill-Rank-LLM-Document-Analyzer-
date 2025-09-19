import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Download, 
  Share, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  Brain,
  Target 
} from 'lucide-react';
import { getDocuments, getDocumentAnalysis, type Document, type AnalysisResult } from '@/lib/api';

const Analysis: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        setDocument(null);
        setAnalysis(null);
        
        console.log('Loading analysis for document ID:', id);
        const analysisResult = await getDocumentAnalysis(id);
        console.log('Analysis result:', analysisResult);
        
        if (!analysisResult) {
          throw new Error('No analysis data received');
        }

        // Validate required fields
        if (!analysisResult.document_id || !analysisResult.filename || !analysisResult.classification || !analysisResult.analysis) {
          console.error('Invalid analysis result structure:', analysisResult);
          throw new Error('Invalid analysis data received');
        }

        // Set both document and analysis from the analysis result
        const documentData = {
          document_id: analysisResult.document_id,
          filename: analysisResult.filename,
          classification: analysisResult.classification,
          analysis: analysisResult.analysis,
          message: ''
        };
        
        setDocument(documentData);
        setAnalysis(analysisResult);

        console.log('Successfully loaded document:', documentData);
      } catch (error: any) {
        console.error('Failed to load data:', error);
        const errorMessage = error?.message || 'An error occurred while loading the document';
        const userMessage = errorMessage.includes('Failed to fetch') 
          ? 'Could not connect to the server. Please ensure the backend is running.'
          : errorMessage;
        setError(userMessage);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getCompletenessColor = (completeness: number) => {
    if (completeness >= 80) return 'text-success';
    if (completeness >= 60) return 'text-warning';
    return 'text-destructive';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <Card className="border-border/50 bg-gradient-card backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                Loading Analysis
              </CardTitle>
              <CardDescription>
                Retrieving document analysis results...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-8 bg-muted/30 rounded animate-pulse" />
                <div className="h-8 bg-muted/30 rounded animate-pulse w-3/4" />
                <div className="h-8 bg-muted/30 rounded animate-pulse w-1/2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !document || !analysis) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card className="border-border/50 bg-gradient-card backdrop-blur-sm border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Error Loading Document
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive">{error || 'Failed to load document analysis'}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                This could happen if the document doesn't exist or was deleted. You can try:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground">
                <li>Checking if the document ID is correct</li>
                <li>Refreshing the page</li>
                <li>Uploading the document again</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Document Analysis</h1>
              <p className="text-muted-foreground">{document.filename}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
                Export Report
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Analysis Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview */}
            <Card className="border-border/50 bg-gradient-card backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Analysis Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Document Type</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {analysis.classification.document_type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(analysis.classification.confidence_score * 100)}% confidence
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Completeness Score</h4>
                    <div className="flex items-center gap-3">
                      <Progress value={analysis.analysis.completeness_score} className="flex-1" />
                      <span className={`font-bold ${getCompletenessColor(analysis.analysis.completeness_score)}`}>
                        {analysis.analysis.completeness_score}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Missing Fields */}
            {analysis.analysis.missing_fields.length > 0 && (
              <Card className="border-border/50 bg-gradient-card backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-warning" />
                    Missing Fields ({analysis.analysis.missing_fields.length})
                  </CardTitle>
                  <CardDescription>
                    Critical information missing from your document
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.analysis.missing_fields.map((field, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card/30"
                      >
                        <AlertCircle className="h-4 w-4 mt-0.5 text-warning" />
                        <div className="flex-1">
                          <span className="font-medium capitalize">{field.replace('_', ' ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            <Card className="border-border/50 bg-gradient-card backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-info" />
                  Improvement Recommendations
                </CardTitle>
                <CardDescription>
                  AI-generated suggestions to enhance your document
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.analysis.recommendations.map((recommendation, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card/30"
                    >
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">{recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Incomplete Fields */}
            {analysis.analysis.incomplete_fields.length > 0 && (
              <Card className="border-border/50 bg-gradient-card backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-warning" />
                    Incomplete Fields ({analysis.analysis.incomplete_fields.length})
                  </CardTitle>
                  <CardDescription>
                    Fields that need more information or clarification
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysis.analysis.incomplete_fields.map((field, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card/30"
                      >
                        <AlertCircle className="h-4 w-4 mt-0.5 text-warning" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">{field}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Risk Factors */}
            {analysis.analysis.risk_factors.length > 0 && (
              <Card className="border-border/50 bg-gradient-card backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    Risk Factors ({analysis.analysis.risk_factors.length})
                  </CardTitle>
                  <CardDescription>
                    Potential risks identified in the document
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysis.analysis.risk_factors.map((risk, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card/30"
                      >
                        <AlertCircle className="h-4 w-4 mt-0.5 text-destructive" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">{risk}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Compliance Notes */}
            {analysis.analysis.compliance_notes.length > 0 && (
              <Card className="border-border/50 bg-gradient-card backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-info" />
                    Compliance Notes ({analysis.analysis.compliance_notes.length})
                  </CardTitle>
                  <CardDescription>
                    Important compliance considerations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysis.analysis.compliance_notes.map((note, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card/30"
                      >
                        <FileText className="h-4 w-4 mt-0.5 text-info" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">{note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Critical Issues */}
            {analysis.analysis.critical_issues.length > 0 && (
              <Card className="border-border/50 bg-gradient-card backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    Critical Issues ({analysis.analysis.critical_issues.length})
                  </CardTitle>
                  <CardDescription>
                    Issues requiring immediate attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysis.analysis.critical_issues.map((issue, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card/30"
                      >
                        <AlertCircle className="h-4 w-4 mt-0.5 text-destructive" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">{issue}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Document Info */}
            <Card className="border-border/50 bg-gradient-card backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">File Name</label>
                  <p className="font-medium">{document.filename}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Document ID</label>
                  <p className="font-medium">{document.document_id}</p>
                </div>
                {document.message && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Message</label>
                    <p className="font-medium">{document.message}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-border/50 bg-gradient-card backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4" />
                  Download PDF Report
                </Button>
                <Button className="w-full" variant="outline">
                  Re-analyze Document
                </Button>
                <Button className="w-full" variant="outline">
                  View Raw Text
                </Button>
              </CardContent>
            </Card>


          </div>
        </div>
      </main>
    </div>
  );
};

export default Analysis;
