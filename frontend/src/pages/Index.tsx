import React from 'react';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { DocumentAnalyzer } from '@/components/DocumentAnalyzer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <div className="container mx-auto px-4 py-16">
          <DocumentAnalyzer />
        </div>
      </main>
    </div>
  );
};

export default Index;
