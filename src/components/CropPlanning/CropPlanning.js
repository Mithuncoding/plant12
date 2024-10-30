import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { cropData } from '../../data/cropPlanningData';
import './CropPlanning.css';
import { GeminiService } from '../../services/geminiService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const CropPlanning = () => {
  const [selectedTaluk, setSelectedTaluk] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [proposedAcres, setProposedAcres] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [supplyDemandHistory, setSupplyDemandHistory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const calculateLocalAnalysis = () => {
    const cropInfo = cropData[selectedTaluk]?.crops[selectedCrop];
    if (!cropInfo) return null;

    const currentAcreage = cropInfo.currentAcreage;
    const demandAcreage = cropInfo.demandAcreage;
    const proposedTotal = currentAcreage + Number(proposedAcres);
    const viabilityScore = ((demandAcreage - currentAcreage) / demandAcreage) * 100;
    
    return {
      ...cropInfo,
      proposedTotal,
      viabilityScore: Math.max(0, viabilityScore),
      recommendation: getRecommendation(viabilityScore),
      priceHistory: cropInfo.priceHistory,
      demandTrend: cropInfo.demandTrend
    };
  };

  const fetchSupplyDemandData = async () => {
    try {
      return await GeminiService.getQuickMarketAnalysis(selectedCrop);
    } catch (error) {
      console.error('Error fetching supply-demand history:', error);
      return null;
    }
  };

  const analyzeCropViability = async () => {
    setIsLoading(true);
    
    const localAnalysis = calculateLocalAnalysis();
    setAnalysis(localAnalysis);

    const supplyDemand = await fetchSupplyDemandData();
    setSupplyDemandHistory(supplyDemand);
    
    setIsLoading(false);
  };

  const getRecommendation = (score) => {
    if (score >= 70) return "Highly Recommended ✅";
    if (score >= 40) return "Proceed with Caution ⚠️";
    if (score >= 20) return "High Risk - Consider Alternatives ⛔";
    return "Not Recommended - Market Saturated 🚫";
  };

  const chartOptions = {
    responsive: true,
    animation: {
      duration: 400 // Reduce animation duration
    },
    plugins: {
      legend: {
        position: 'top',
      },
    },
    // Disable hover animations for better performance
    hover: {
      animationDuration: 0
    },
    // Optimize responsiveness
    maintainAspectRatio: false,
    // Reduce the number of ticks for better performance
    scales: {
      y: {
        ticks: {
          maxTicksLimit: 8
        }
      },
      x: {
        ticks: {
          maxTicksLimit: 10
        }
      }
    }
  };

  const renderSupplyDemandChart = () => {
    if (!supplyDemandHistory) return null;

    return (
      <div className="chart">
        <h3>Supply-Demand Balance</h3>
        <Bar
          data={{
            labels: ['Previous Season', 'Current Season', 'Next Season (Projected)'],
            datasets: [
              {
                label: 'Market Demand',
                data: supplyDemandHistory.map(s => s.demand),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                order: 1
              },
              {
                label: 'Actual Supply',
                data: supplyDemandHistory.map(s => s.supply),
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                order: 2
              }
            ]
          }}
          options={{
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Acres'
                }
              }
            },
            plugins: {
              tooltip: {
                callbacks: {
                  afterBody: (tooltipItems) => {
                    const dataIndex = tooltipItems[0].dataIndex;
                    const balance = supplyDemandHistory[dataIndex].demand - 
                                  supplyDemandHistory[dataIndex].supply;
                    return `Balance: ${Math.abs(balance)} acres ${balance > 0 ? 'shortage' : 'surplus'}`;
                  }
                }
              }
            }
          }}
        />
      </div>
    );
  };

  const renderChartWithLoading = (chartComponent) => (
    <div className="chart">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loader">Loading...</div>
        </div>
      )}
      {chartComponent}
    </div>
  );

  return (
    <div className="crop-planning-container">
      <h2>Crop Planning Assistant</h2>
      
      <div className="planning-form">
        <div className="form-group">
          <label>Select Taluk</label>
          <select 
            value={selectedTaluk} 
            onChange={(e) => setSelectedTaluk(e.target.value)}
          >
            <option value="">Select a taluk</option>
            {Object.keys(cropData).map(taluk => (
              <option key={taluk} value={taluk}>{taluk}</option>
            ))}
          </select>
        </div>

        {selectedTaluk && (
          <div className="form-group">
            <label>Select Crop</label>
            <select 
              value={selectedCrop} 
              onChange={(e) => setSelectedCrop(e.target.value)}
            >
              <option value="">Select a crop</option>
              {Object.keys(cropData[selectedTaluk].crops).map(crop => (
                <option key={crop} value={crop}>{crop}</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Proposed Acres</label>
          <input
            type="number"
            value={proposedAcres}
            onChange={(e) => setProposedAcres(e.target.value)}
            placeholder="Enter acres"
          />
        </div>

        <button 
          className="analyze-btn"
          onClick={analyzeCropViability}
          disabled={!selectedTaluk || !selectedCrop || !proposedAcres}
        >
          Analyze Viability
        </button>
      </div>

      {analysis && (
        <div className="analysis-results">
          <div className="viability-score">
            <h3>Viability Score</h3>
            <div className={`score-value ${analysis.viabilityScore >= 50 ? 'good' : 'bad'}`}>
              {Math.round(analysis.viabilityScore)}%
            </div>
            <div className="recommendation">{analysis.recommendation}</div>
          </div>

          <div className="market-stats">
            <div className="stat-item">
              <label>Current Acreage</label>
              <span>{analysis.currentAcreage.toLocaleString()} acres</span>
            </div>
            <div className="stat-item">
              <label>Market Demand</label>
              <span>{analysis.demandAcreage.toLocaleString()} acres</span>
            </div>
            <div className="stat-item">
              <label>Proposed Total</label>
              <span>{analysis.proposedTotal.toLocaleString()} acres</span>
            </div>
          </div>

          <div className="charts-container">
            {renderChartWithLoading(
              <div className="chart">
                <h3>Price History</h3>
                <Line 
                  data={{
                    labels: analysis.priceHistory.map(p => p.month),
                    datasets: [{
                      label: 'Price per Quintal (₹)',
                      data: analysis.priceHistory.map(p => p.price),
                      borderColor: 'rgb(75, 192, 192)',
                      tension: 0.1
                    }]
                  }}
                  options={chartOptions}
                />
              </div>
            )}

            {renderChartWithLoading(
              <div className="chart">
                <h3>Demand vs Supply</h3>
                <Bar
                  data={{
                    labels: ['Current', 'With Your Proposal', 'Market Demand'],
                    datasets: [{
                      label: 'Acres',
                      data: [
                        analysis.currentAcreage,
                        analysis.proposedTotal,
                        analysis.demandAcreage
                      ],
                      backgroundColor: [
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(255, 159, 64, 0.5)',
                        'rgba(54, 162, 235, 0.5)'
                      ]
                    }]
                  }}
                  options={chartOptions}
                />
              </div>
            )}

            {renderChartWithLoading(renderSupplyDemandChart())}
          </div>
        </div>
      )}
    </div>
  );
};

export default CropPlanning; 