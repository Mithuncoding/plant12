import React, { useState } from 'react';
import { GeminiService } from '../../services/geminiService';
import { FaSeedling, FaChartLine, FaExclamationTriangle, 
         FaList, FaCheckSquare, FaBug, FaTint, FaLeaf } from 'react-icons/fa';
import './WeatherAnalysis.css';

const WeatherAnalysis = ({ weatherData }) => {
  const [cropType, setCropType] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      )}
    </div>
  );
};

export default WeatherAnalysis; 