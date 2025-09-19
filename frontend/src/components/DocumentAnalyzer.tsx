import React, { useState } from 'react';
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
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

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
      
      // Upload the first file (in a real app, you might handle multiple files)
      const response = await uploadDocument(files[0]);
      const documentId = response.document_id;
      
      toast({
        title: "Document uploaded",
        description: "Starting AI analysis...",
      });

      // Analyze the document
      const result = await getDocumentAnalysis(documentId.toString());
      setAnalysisResult(result);
      
      toast({
        title: "Analysis complete",
        description: `Document identified as ${result.classification.document_type} with ${result.classification.confidence_score * 100}% confidence.`,
      });
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "There was an error analyzing your document. Please try again.",
        variant: "destructive",
      });
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
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5" />
                  Analyze Documents
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Progress */}
      {isAnalyzing && (
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
                AI is analyzing document content and structure...
              </div>
              <Progress value={isAnalyzing ? 50 : 100} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-6 animate-fade-in">
          {/* Document Type */}
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
              </div>
            </CardContent>
          </Card>

          {/* Missing Fields */}
          {analysisResult.analysis.missing_fields.length > 0 && (
            <Card className="border-border/50 bg-gradient-card backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  Missing Fields ({analysisResult.analysis.missing_fields.length})
                </CardTitle>
                <CardDescription>
                  The following required fields are missing from your document
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
        </div>
      )}
    </div>
  );
};