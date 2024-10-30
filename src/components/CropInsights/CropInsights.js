import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { GeminiService } from '../../services/geminiService';
import { karnatakaDistricts } from '../../data/karnatakaData';
import './CropInsights.css';
import html2pdf from 'html2pdf.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Define chartOptions outside the component to prevent recreation on each render
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 400,
    easing: 'easeOutQuart'
  },
  plugins: {
    legend: {
      display: true,
      position: 'top',
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        maxTicksLimit: 5
      }
    }
  }
};

const CropInsights = () => {
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeMarket = async () => {
    if (!selectedCrop || !selectedDistrict) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await GeminiService.getDistrictCropAnalysis(selectedCrop, selectedDistrict);
      if (result) {
        console.log('Analysis result:', result);
        setAnalysis(result);
      } else {
        setError('Unable to fetch analysis data');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setError('An error occurred while analyzing the data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup charts on unmount
  useEffect(() => {
    return () => {
      // Destroy all chart instances
      ChartJS.instances = {};
    };
  }, []);

  const renderCharts = useMemo(() => {
    if (!analysis) return null;

    return (
      <>
        <div className="insights-grid">
          <div className="chart-card">
            <h3>Price History</h3>
            <Line 
              data={{
                labels: analysis.priceHistory.map(p => p.month),
                datasets: [{
                  label: 'Price per Quintal (₹)',
                  data: analysis.priceHistory.map(p => p.price),
                  borderColor: 'rgb(75, 192, 192)',
                  tension: 0.1,
                  fill: false
                }]
              }}
              options={chartOptions}
            />
          </div>

          <div className="chart-card">
            <h3>District Comparison</h3>
            <Bar
              data={{
                labels: analysis.districtComparison.map(d => d.district),
                datasets: [{
                  label: 'Production (Tonnes)',
                  data: analysis.districtComparison.map(d => d.production),
                  backgroundColor: '#3498db',
                  barThickness: 40
                }]
              }}
              options={chartOptions}
            />
          </div>

          <div className="chart-card">
            <h3>Seasonal Success Rate</h3>
            <Pie
              data={{
                labels: ['Kharif', 'Rabi', 'Summer'],
                datasets: [{
                  data: [
                    analysis.seasonalAnalysis.kharif,
                    analysis.seasonalAnalysis.rabi,
                    analysis.seasonalAnalysis.summer
                  ],
                  backgroundColor: ['#2ecc71', '#e74c3c', '#f1c40f']
                }]
              }}
              options={{
                ...chartOptions,
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="district-insights-card">
          <h3>District Statistics</h3>
          <div className="key-stats">
            <div className="stat-item">
              <span className="stat-label">Major Growing Areas</span>
              <span className="stat-value">{analysis.districtStats.majorAreas.join(', ')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Soil Types</span>
              <span className="stat-value">{analysis.districtStats.soilTypes.join(', ')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Average Rainfall</span>
              <span className="stat-value">{analysis.districtStats.avgRainfall} mm/year</span>
            </div>
          </div>
        </div>

        <div className="market-insights">
          <div className="insight-item">
            <h4>🌊 Water Requirements</h4>
            <p>{analysis.waterRequirements}</p>
          </div>
          <div className="insight-item">
            <h4>🌡️ Climate Suitability</h4>
            <p>{analysis.climateSuitability}</p>
          </div>
          <div className="insight-item">
            <h4>💹 Market Potential</h4>
            <p>{analysis.marketPotential}</p>
          </div>
        </div>

        <div className="recommendations-card">
          <div className="recommendation-score">
            <h3>Viability Score</h3>
            <div className={`score ${analysis.viabilityScore >= 70 ? 'high' : analysis.viabilityScore >= 40 ? 'medium' : 'low'}`}>
              {Math.round(analysis.viabilityScore)}%
            </div>
            <div className="score-label">Overall Viability</div>
          </div>

          <div className="recommendations-list">
            {analysis.recommendations.map((rec, index) => (
              <div key={index} className="recommendation-item">
                <span className="recommendation-icon">
                  {rec.type === 'positive' ? '✅' : rec.type === 'warning' ? '⚠️' : '❌'}
                </span>
                <div className="recommendation-content">
                  <h4>{rec.title}</h4>
                  <p>{rec.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }, [analysis]);

  const generatePDF = useCallback(async () => {
    if (!analysis) return;

    // Create a new div for PDF content
    const pdfContent = document.createElement('div');
    pdfContent.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: #2c3e50; text-align: center; margin-bottom: 30px;">
          🌾 Agricultural Market Intelligence Report
        </h1>
        
        <div style="margin-bottom: 20px;">
          <h2>Crop Analysis for ${selectedCrop} in ${selectedDistrict}</h2>
          <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h3>District Statistics</h3>
          <p><strong>Major Growing Areas:</strong> ${analysis.districtStats.majorAreas.join(', ')}</p>
          <p><strong>Soil Types:</strong> ${analysis.districtStats.soilTypes.join(', ')}</p>
          <p><strong>Average Rainfall:</strong> ${analysis.districtStats.avgRainfall} mm/year</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h3>Crop Requirements</h3>
          <p><strong>Water Requirements:</strong> ${analysis.waterRequirements}</p>
          <p><strong>Climate Suitability:</strong> ${analysis.climateSuitability}</p>
          <p><strong>Market Potential:</strong> ${analysis.marketPotential}</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h3>Recommendations</h3>
          ${analysis.recommendations.map(rec => `
            <div style="margin-bottom: 10px;">
              <p><strong>${rec.title}</strong></p>
              <p>${rec.message}</p>
            </div>
          `).join('')}
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <p><strong>Overall Viability Score:</strong> ${Math.round(analysis.viabilityScore)}%</p>
        </div>
      </div>
    `;

    const opt = {
      margin: 1,
      filename: `${selectedCrop}_${selectedDistrict}_Report.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    try {
      const pdf = await html2pdf().set(opt).from(pdfContent).save();
      return opt.filename;
    } catch (error) {
      console.error('PDF generation failed:', error);
      setError('Failed to generate PDF');
    }
  }, [analysis, selectedCrop, selectedDistrict]);

  const sharePDF = useCallback(async () => {
    const pdfFileName = await generatePDF();
    
    if (!pdfFileName) return;

    // Check if Web Share API is supported
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Agricultural Market Intelligence Report',
          text: `Check out this crop analysis report for ${selectedCrop} in ${selectedDistrict}`,
          // Note: We can't directly share files via Web Share API in all browsers
          // Instead, we'll share a message with instructions
        });
      } catch (error) {
        console.error('Error sharing:', error);
        setError('Unable to share the report');
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      const whatsappUrl = `https://wa.me/?text=I've generated a crop analysis report for ${selectedCrop} in ${selectedDistrict}. Please check the downloaded PDF.`;
      window.open(whatsappUrl, '_blank');
    }
  }, [generatePDF, selectedCrop, selectedDistrict]);

  return (
    <div className="crop-insights-container">
      <div className="insights-header">
        <h1>🌾 Agricultural Market Intelligence</h1>
        <p>District-wise crop analysis and market predictions for Karnataka</p>
        <div className="action-buttons">
          <button 
            onClick={generatePDF}
            className="pdf-button"
            disabled={!analysis}
          >
            📄 Generate PDF
          </button>
          <button 
            onClick={sharePDF}
            className="share-button"
            disabled={!analysis}
          >
            📤 Share Report
          </button>
        </div>
      </div>

      <div className="analysis-form">
        <div className="input-group">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="district-select"
          >
            <option value="">Select District</option>
            {karnatakaDistricts.map(district => (
              <option key={district.id} value={district.name}>
                {district.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            placeholder="Enter crop name (e.g., Ragi, Jowar)"
            className="crop-input"
          />

          <button 
            onClick={analyzeMarket}
            className="analyze-button"
            disabled={loading || !selectedCrop || !selectedDistrict}
          >
            {loading ? 'Analyzing...' : 'Analyze Market'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="loader"></div>
        </div>
      )}

      {analysis && !loading && renderCharts}
    </div>
  );
};

export default CropInsights;