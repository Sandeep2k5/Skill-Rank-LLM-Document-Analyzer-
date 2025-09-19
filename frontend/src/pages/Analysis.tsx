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
      try {
        setLoading(true);
        setError(null);
        // Load document details
        const docs = await getDocuments();
        const foundDoc = docs.find(doc => doc.id === id);
        if (foundDoc) {
          setDocument(foundDoc);
          // Load analysis results
          const analysisResult = await getDocumentAnalysis(id);
          setAnalysis(analysisResult);
        } else {
          setError('Document not found');
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setError('Failed to load document data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
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
        <div className="container mx-auto px-4 py-16 text-center">
          <p>Loading document analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !document || !analysis) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-destructive">{error || 'Failed to load document analysis'}</p>
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
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
              <p className="text-muted-foreground">{document.name}</p>
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
                        {analysis.documentType.type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(analysis.documentType.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Completeness Score</h4>
                    <div className="flex items-center gap-3">
                      <Progress value={analysis.completeness} className="flex-1" />
                      <span className={`font-bold ${getCompletenessColor(analysis.completeness)}`}>
                        {analysis.completeness}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Missing Fields */}
            {analysis.missingFields.length > 0 && (
              <Card className="border-border/50 bg-gradient-card backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-warning" />
                    Missing Fields ({analysis.missingFields.length})
                  </CardTitle>
                  <CardDescription>
                    Critical information missing from your document
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.missingFields.map((field, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card/30"
                      >
                        <AlertCircle className={`h-4 w-4 mt-0.5 ${field.critical ? 'text-destructive' : 'text-warning'}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium capitalize">{field.field.replace('_', ' ')}</span>
                            <Badge variant={field.critical ? 'destructive' : 'secondary'} className="text-xs">
                              {field.critical ? 'Critical' : 'Optional'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{field.description}</p>
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
                  {analysis.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card/30"
                    >
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{rec.title}</h4>
                          <Badge variant={getPriorityColor(rec.priority)} className="text-xs">
                            {rec.priority} priority
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
                  <p className="font-medium">{document.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Size</label>
                  <p className="font-medium">{(document.size / 1024).toFixed(1)} KB</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Upload Date</label>
                  <p className="font-medium">
                    {new Date(document.uploadDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge className="mt-1" variant={document.status === 'completed' ? 'default' : 'secondary'}>
                    {document.status}
                  </Badge>
                </div>
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

            {/* Extract Preview */}
            <Card className="border-border/50 bg-gradient-card backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Text Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {analysis.extractedText.substring(0, 200)}...
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analysis;
