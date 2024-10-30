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

  return (
    <div className="crop-insights-container">
      <div className="insights-header">
        <h1>🌾 Agricultural Market Intelligence</h1>
        <p>District-wise crop analysis and market predictions for Karnataka</p>
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