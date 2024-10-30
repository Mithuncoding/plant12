import React, { useState, useCallback } from 'react';
import { GeminiService } from '../../services/geminiService';
import { FaSeedling, FaChartLine, FaExclamationTriangle, 
         FaList, FaCheckSquare, FaBug, FaTint, FaLeaf } from 'react-icons/fa';
import './WeatherAnalysis.css';
import html2pdf from 'html2pdf.js';

const WeatherAnalysis = ({ weatherData }) => {
  const [cropType, setCropType] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleAnalysis = async (e) => {
    e.preventDefault();
    if (!cropType.trim() || !weatherData) return;

    try {
      setLoading(true);
      setError(null);
      const analysisData = await GeminiService.getPlantAnalysis(cropType.trim(), weatherData);
      setAnalysis(analysisData);
    } catch (err) {
      setError(err.message || 'Failed to analyze crop conditions');
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to render object or string content
  const renderContent = (content) => {
    if (typeof content === 'string') return content;
    if (typeof content === 'object' && content !== null) {
      return Object.entries(content).map(([key, value], index) => (
        <div key={index} className="content-item">
          <strong>{key}:</strong> {value}
        </div>
      ));
    }
    return '';
  };

  const generatePDF = useCallback(async () => {
    if (!analysis) return;
    
    setIsGeneratingPDF(true);
    try {
      const pdfContent = document.createElement('div');
      pdfContent.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #2c3e50; text-align: center; margin-bottom: 30px;">
            🌱 Crop Weather Analysis Report
          </h1>
          
          <div style="margin-bottom: 20px;">
            <h2>Analysis for ${cropType}</h2>
            <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <div style="margin-bottom: 30px;">
            <h3>Weather Conditions</h3>
            <p><strong>Temperature:</strong> ${weatherData.current.temp_c}°C</p>
            <p><strong>Humidity:</strong> ${weatherData.current.humidity}%</p>
            <p><strong>Wind Speed:</strong> ${weatherData.current.wind_kph} km/h</p>
            <p><strong>Condition:</strong> ${weatherData.current.condition.text}</p>
          </div>

          ${Object.entries(analysis).map(([key, value]) => `
            <div style="margin-bottom: 30px;">
              <h3>${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</h3>
              <p style="color: #27ae60; padding: 10px; background: rgba(39, 174, 96, 0.1); border-radius: 8px;">
                ${typeof value === 'object' ? Object.entries(value).map(([k, v]) => `<strong>${k}:</strong> ${v}`).join('<br/>') : value}
              </p>
            </div>
          `).join('')}
        </div>
      `;

      const opt = {
        margin: 1,
        filename: `${cropType}_Weather_Analysis.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(pdfContent).save();
      return opt.filename;
    } catch (error) {
      console.error('PDF Generation Error:', error);
      setError('Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [analysis, cropType, weatherData]);

  const sharePDF = useCallback(async () => {
    if (!analysis) return;
    
    setIsSharing(true);
    try {
      // Generate and download PDF
      await generatePDF();
      
      // Create message
      const message = `
🌱 *Crop Weather Analysis Report*
Crop: ${cropType}
Temperature: ${weatherData.current.temp_c}°C
Humidity: ${weatherData.current.humidity}%
Weather: ${weatherData.current.condition.text}

Key Findings:
- Suitability: ${analysis.suitability}
- Growth Stage: ${analysis.growthStage}
- Care Instructions: ${analysis.care}

Download the full PDF report for detailed analysis.
      `.trim();

      // Show guidance to user
      alert('PDF has been downloaded. You can now attach it in WhatsApp after sharing the summary.');
      
      // Open WhatsApp
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Error sharing PDF:', error);
      setError('Unable to share the PDF report');
    } finally {
      setIsSharing(false);
    }
  }, [analysis, cropType, weatherData, generatePDF]);

  if (!weatherData) {
    return (
      <div className="weather-analysis">
        <h2>Crop Weather Analysis</h2>
        <p className="info-message">Please search for a location first to analyze crop conditions.</p>
      </div>
    );
  }

  return (
    <div className="weather-analysis">
      <h2>Crop Weather Analysis</h2>
      
      <form onSubmit={handleAnalysis} className="analysis-form">
        <div className="input-group">
          <input
            type="text"
            value={cropType}
            onChange={(e) => setCropType(e.target.value)}
            placeholder="Enter crop or plant name (e.g., Tomato)"
            className="crop-input"
            disabled={loading}
          />
          <button 
            type="submit" 
            className="analyze-btn" 
            disabled={loading || !cropType.trim()}
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </form>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Analyzing growing conditions...</p>
        </div>
      )}

      {analysis && (
        <>
          <div className="analysis-grid">
            <div className="analysis-card suitability">
              <h3><FaSeedling /> Suitability</h3>
              <div className="card-content">{renderContent(analysis.suitability)}</div>
            </div>
            
            <div className="analysis-card growth-stage">
              <h3><FaChartLine /> Growth Stage</h3>
              <div className="card-content">{renderContent(analysis.growthStage)}</div>
            </div>
            
            <div className="analysis-card risks">
              <h3><FaExclamationTriangle /> Risks</h3>
              <div className="card-content">{renderContent(analysis.risks)}</div>
            </div>
            
            <div className="analysis-card care">
              <h3><FaList /> Care Instructions</h3>
              <div className="card-content">{renderContent(analysis.care)}</div>
            </div>
            
            <div className="analysis-card milestones">
              <h3><FaCheckSquare /> Milestones</h3>
              <div className="card-content">{renderContent(analysis.milestones)}</div>
            </div>
            
            <div className="analysis-card pest-management">
              <h3><FaBug /> Pest Management</h3>
              <div className="card-content">{renderContent(analysis.pestManagement)}</div>
            </div>
            
            <div className="analysis-card irrigation">
              <h3><FaTint /> Irrigation</h3>
              <div className="card-content">{renderContent(analysis.irrigation)}</div>
            </div>
            
            <div className="analysis-card soil">
              <h3><FaLeaf /> Soil Management</h3>
              <div className="card-content">{renderContent(analysis.soilManagement)}</div>
            </div>
          </div>
          
          <div className="action-buttons">
            <button 
              onClick={generatePDF}
              className="pdf-button"
              disabled={isGeneratingPDF || !analysis}
            >
              {isGeneratingPDF ? '📄 Generating...' : '📄 Generate PDF'}
            </button>
            <button 
              onClick={sharePDF}
              className="share-button"
              disabled={isSharing || !analysis}
            >
              {isSharing ? '📤 Sharing...' : '📤 Share Report'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default WeatherAnalysis; 