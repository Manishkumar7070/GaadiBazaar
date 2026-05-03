import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const generateStartupSpecPDF = async () => {
  const doc = new jsPDF();
  const primaryColor = '#f97316'; // Orange-500
  const secondaryColor = '#0f172a'; // Slate-900

  // Header
  doc.setFillColor(secondaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor('#ffffff');
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('AS ONE DEALER', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('STARTUP FEATURE SPECIFICATION & USER GUIDE', 20, 32);

  let y = 55;

  const addSection = (title: string, content: string[]) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setTextColor(primaryColor);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, y);
    y += 10;
    
    doc.setTextColor('#334155');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    content.forEach(line => {
      const splitText = doc.splitTextToSize(`• ${line}`, 170);
      doc.text(splitText, 25, y);
      y += (splitText.length * 6);
    });
    y += 5;
  };

  addSection('1. Core Value Proposition', [
    'Direct-to-Dealer ecosystem removing Middleman friction.',
    'AI-powered valuation engine for instant, fair pricing.',
    'Transparent showroom mapping for verified physical inspections.',
    'Hyper-local search optimized for Indian metropolitan cities.'
  ]);

  addSection('2. The Hero Experience (Conversion Hub)', [
    'Dual-Action Workflow: Prominent "Buy a Car" and "Sell Your Car" funnels.',
    'Status Badge: Live real-time counter of verified listings in the user\'s city.',
    'Advanced Command Center: Multi-parameter search with Brand, Model, and Body Type intelligence.',
    'City-Specific Context: Dynamic UI adjustment based on geographical selection (Maharashtra, Delhi, etc.).'
  ]);

  addSection('3. Smart Search & Discovery', [
    'Intelligent Suggestions: Real-time dropdowns for brands and models.',
    'Body Type Filtering: Quick navigation for SUVs, Sedans, Hatchbacks, and Luxury segments.',
    'Priority Scoring: Listings sorted by dynamic metrics (views, leads, and sponsorship).',
    'Rich Metadata: Verification status, listing type (Premium/Sponsored), and verified mileage.'
  ]);

  addSection('4. Dealer & Showroom Ecosystem', [
    'Digital Showrooms: Individual pages for dealers to showcase inventory.',
    'Verified Badging: Trust indicators for top-performing dealerships.',
    'Lead Generation: Direct "Contact Dealer" hooks with lead tracking for admins.',
    'Shop Creation: Seamless onboarding for new dealers to list vehicles.'
  ]);

  addSection('5. Analytical Dashboard', [
    'Performance Metrics: tracking clicksCount, leadsCount, and viewsCount per vehicle.',
    'Inventory Insights: Breakdown of vehicle types (Cars vs Bikes) and fuel types.',
    'Priority Algorithm: Dynamic priorityScore for boosting premium inventory.',
    'Growth Tracking: Registration monitoring and city-wise density maps.'
  ]);

  // Footer on last page
  doc.setFontSize(8);
  doc.setTextColor('#94a3b8');
  doc.text('© 2026 AsOneDealer Technologies. Generated on ' + new Date().toLocaleDateString(), 20, 285);

  doc.save('AsOneDealer_Features_Full.pdf');
};
