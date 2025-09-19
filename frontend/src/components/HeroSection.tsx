import React from 'react';
import { Brain, FileCheck, Zap, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const HeroSection: React.FC = () => {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced LLM technology identifies document types and content',
    },
    {
      icon: FileCheck,
      title: 'Completeness Check',
      description: 'Automatically detect missing critical fields and information',
    },
    {
      icon: Target,
      title: 'Smart Recommendations',
      description: 'Get actionable suggestions to improve document quality',
    },
    {
      icon: Zap,
      title: 'Instant Results',
      description: 'Upload and analyze documents in seconds, not hours',
    },
  ];

  return (
    <div className="relative py-16 px-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-hero opacity-60" />
      
      <div className="relative container mx-auto text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Document Intelligence</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Intelligent Document
              <br />
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Analysis Platform
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Upload your business documents and let AI identify types, detect missing fields, 
              and provide intelligent recommendations for completion.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="border-border/50 bg-gradient-card backdrop-blur-sm hover:scale-105 transition-all duration-300"
              >
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 md:gap-16 pt-8 border-t border-border/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">95%</div>
              <div className="text-sm text-muted-foreground">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">3s</div>
              <div className="text-sm text-muted-foreground">Average Analysis</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">10k+</div>
              <div className="text-sm text-muted-foreground">Documents Processed</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};