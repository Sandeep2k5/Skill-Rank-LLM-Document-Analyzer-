import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUpload } from '@/components/ui/file-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Upload, FileText, Brain, Target } from 'lucide-react';
import { uploadDocument, getDocumentAnalysis, type Document, type AnalysisResult } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const DocumentAnalyzer: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one PDF document to analyze.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisResult(null);
      setError(null);
      
      // Upload the first file
      toast({
        title: "Processing",
        description: "Uploading document...",
      });

      const response = await uploadDocument(files[0]);
      
      if (!response || !response.document_id) {
        throw new Error('Failed to upload document');
      }

      toast({
        title: "Document uploaded",
        description: "Starting AI analysis...",
      });

      // Analyze the document
      console.log('Document upload response:', response);
      const result = await getDocumentAnalysis(response.document_id.toString());
      console.log('Analysis result:', result);
      
      if (!result) {
        throw new Error('Failed to analyze document');
      }

      toast({
        title: "Analysis complete",
        description: `Document identified as ${result.classification.document_type} with ${Math.round(result.classification.confidence_score * 100)}% confidence.`,
      });

      // Navigate to the analysis page with the document ID
      navigate(`/analysis/${response.document_id}`);
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      toast({
        title: "Analysis failed",
        description: "There was an error analyzing your document. Please try again.",
        variant: "destructive",
      });
      setAnalysisResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <Card className="border-border/50 bg-gradient-card backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Upload Documents</CardTitle>
          <CardDescription>
            Upload PDF documents for AI-powered analysis and completeness checking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center space-y-4">
              <p className="text-destructive">{error}</p>
              <Button
                onClick={() => {
                  setError(null);
                  setFiles([]);
                }}
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <FileUpload
                files={files}
                onFilesChange={setFiles}
                maxFiles={5}
              />
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={handleAnalyze}
                  disabled={files.length === 0 || isAnalyzing}
                  variant="hero"
                  size="lg"
                  className="min-w-40"
                >
                  {isAnalyzing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      <span>Analyze Documents</span>
                    </div>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Analysis Progress */}
      {isAnalyzing && !error && (
        <Card className="border-border/50 bg-gradient-card backdrop-blur-sm animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Analyzing Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                <span>AI is analyzing document content and structure...</span>
              </div>
              <Progress value={50} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-6 animate-fade-in">
          {/* Document Type and Completeness Score */}
          <Card className="border-border/50 bg-gradient-card backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold">Document Type</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {analysisResult.classification.document_type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(analysisResult.classification.confidence_score * 100)}% confidence
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Completeness Score</h4>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={analysisResult.analysis.completeness_score} 
                      className="flex-1"
                    />
                    <span className={`font-medium ${
                      analysisResult.analysis.completeness_score >= 80 ? 'text-success' :
                      analysisResult.analysis.completeness_score >= 60 ? 'text-warning' :
                      'text-destructive'
                    }`}>
                      {analysisResult.analysis.completeness_score}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Critical Issues */}
          {analysisResult.analysis.critical_issues.length > 0 && (
            <Card className="border-border/50 bg-gradient-card backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Critical Issues ({analysisResult.analysis.critical_issues.length})
                </CardTitle>
                <CardDescription>
                  High-priority issues that require immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.analysis.critical_issues.map((issue, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg border border-destructive/20 bg-destructive/10"
                    >
                      <AlertCircle className="h-4 w-4 mt-0.5 text-destructive" />
                      <div className="flex-1">
                        <p className="text-sm">{issue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Missing Fields */}
          {analysisResult.analysis.missing_fields.length > 0 && (
            <Card className="border-border/50 bg-gradient-card backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  Missing Fields ({analysisResult.analysis.missing_fields.length})
                </CardTitle>
                <CardDescription>
                  Required fields that are missing from your document
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.analysis.missing_fields.map((field, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card/30"
                    >
                      <AlertCircle className="h-4 w-4 mt-0.5 text-warning" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{field.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Incomplete Fields */}
          {analysisResult.analysis.incomplete_fields.length > 0 && (
            <Card className="border-border/50 bg-gradient-card backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  Incomplete Fields ({analysisResult.analysis.incomplete_fields.length})
                </CardTitle>
                <CardDescription>
                  Fields that are present but need improvement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.analysis.incomplete_fields.map((field, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card/30"
                    >
                      <AlertCircle className="h-4 w-4 mt-0.5 text-warning" />
                      <div className="flex-1">
                        <span className="font-medium">{field}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {analysisResult.analysis.recommendations.length > 0 && (
            <Card className="border-border/50 bg-gradient-card backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-info" />
                  Improvement Recommendations
                </CardTitle>
                <CardDescription>
                  AI-generated suggestions to complete and improve your document
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResult.analysis.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card/30"
                    >
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">{rec}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk Factors */}
          {analysisResult.analysis.risk_factors.length > 0 && (
            <Card className="border-border/50 bg-gradient-card backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  Risk Factors
                </CardTitle>
                <CardDescription>
                  Potential risks identified in the document
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResult.analysis.risk_factors.map((risk, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 rounded-lg border border-warning/20 bg-warning/10"
                    >
                      <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm">{risk}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compliance Notes */}
          {analysisResult.analysis.compliance_notes.length > 0 && (
            <Card className="border-border/50 bg-gradient-card backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-info" />
                  Compliance Notes
                </CardTitle>
                <CardDescription>
                  Legal compliance observations and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResult.analysis.compliance_notes.map((note, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 rounded-lg border border-info/20 bg-info/10"
                    >
                      <CheckCircle2 className="h-5 w-5 text-info mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm">{note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};