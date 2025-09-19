import React from 'react';
import { Brain, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">DocAnalyzer AI</h1>
            <p className="text-xs text-muted-foreground">Intelligent Document Analysis</p>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <Button variant="ghost" size="sm">
            <FileText className="h-4 w-4" />
            Documents
          </Button>
          <Button variant="ghost" size="sm">
            Analytics
          </Button>
          <Button variant="ghost" size="sm">
            Help
          </Button>
        </nav>
        
        <Button variant="outline" size="sm">
          Settings
        </Button>
      </div>
    </header>
  );
};