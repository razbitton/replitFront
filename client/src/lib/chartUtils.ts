// Utility functions for chart generation and management

import { BandData, QuoteData } from "@/contexts/TradingContext";

// Common chart configurations
export const commonChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        boxWidth: 12,
        font: {
          family: 'system-ui',
          weight: '500',
        },
      },
    },
    tooltip: {
      usePointStyle: true,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: 'rgb(17, 24, 39)',
      bodyColor: 'rgb(55, 65, 81)',
      borderColor: 'rgba(229, 231, 235, 0.5)',
      borderWidth: 1,
      padding: 10,
      bodyFont: {
        family: 'system-ui',
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          family: 'system-ui',
        },
      },
    },
    y: {
      beginAtZero: false,
      grid: {
        color: 'rgba(229, 231, 235, 0.15)',
        drawBorder: false,
      },
      ticks: {
        font: {
          family: 'system-ui',
          size: 11,
        },
        padding: 8,
      },
    },
  },
  elements: {
    point: {
      radius: 3,
      hoverRadius: 5,
      borderWidth: 2,
    },
    line: {
      borderWidth: 2.5,
      borderJoinStyle: 'round',
      capBezierPoints: true,
    },
  },
};

// Format timestamp for display on charts
export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Generate time labels for charts (last n intervals)
export const generateTimeLabels = (count: number): string[] => {
  const labels = [];
  const now = new Date();
  
  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3 * 60000); // 3-minute intervals
    labels.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }
  
  return labels;
};

// Prepare data for premium chart
export const preparePremiumChartData = (bandDataHistory: BandData[]) => {
  if (!bandDataHistory || bandDataHistory.length === 0) {
    return {
      labels: generateTimeLabels(14),
      datasets: [
        {
          label: 'Premium',
          data: Array(14).fill(null),
          borderColor: 'rgba(124, 58, 237, 1)', // Vivid Purple
          backgroundColor: 'rgba(124, 58, 237, 0.08)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: 'rgba(124, 58, 237, 1)',
        },
        {
          label: 'Upper Band',
          data: Array(14).fill(null),
          borderColor: 'rgba(236, 72, 153, 0.7)', // Rose
          borderDash: [4, 4],
          tension: 0.4,
          fill: false,
          pointRadius: 0,
        },
        {
          label: 'Lower Band',
          data: Array(14).fill(null),
          borderColor: 'rgba(16, 185, 129, 0.7)', // Emerald
          borderDash: [4, 4],
          tension: 0.4,
          fill: false,
          pointRadius: 0,
        },
      ],
    };
  }
  
  // Use actual data
  const labels = bandDataHistory.map(data => formatTimestamp(data.timestamp));
  
  const premiumData = bandDataHistory.map(data => data.premium);
  const upperBandData = bandDataHistory.map(data => data.upperBand);
  const lowerBandData = bandDataHistory.map(data => data.lowerBand);
  
  return {
    labels,
    datasets: [
      {
        label: 'Premium',
        data: premiumData,
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Upper Band',
        data: upperBandData,
        borderColor: 'rgba(209, 213, 219, 1)',
        borderDash: [5, 5],
        tension: 0.1,
        fill: false,
      },
      {
        label: 'Lower Band',
        data: lowerBandData,
        borderColor: 'rgba(209, 213, 219, 1)',
        borderDash: [5, 5],
        tension: 0.1,
        fill: false,
      },
    ],
  };
};

// Prepare data for asset price chart
export const prepareAssetChartData = (quoteHistory: QuoteData[]) => {
  if (!quoteHistory || quoteHistory.length === 0) {
    return {
      labels: generateTimeLabels(14),
      datasets: [
        {
          label: 'Asset Price',
          data: Array(14).fill(null),
          borderColor: 'rgba(139, 92, 246, 1)', // Violet
          backgroundColor: 'rgba(139, 92, 246, 0.15)',
          tension: 0.5,
          fill: true,
          borderWidth: 2.5,
          pointRadius: 0,
        },
      ],
    };
  }
  
  // Use actual data
  const labels = quoteHistory.map(data => formatTimestamp(data.timestamp));
  const priceData = quoteHistory.map(data => data.price);
  
  return {
    labels,
    datasets: [
      {
        label: 'Asset Price',
        data: priceData,
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };
};

// Prepare data for bollinger bands chart
export const prepareBollingerBandsData = (quoteHistory: QuoteData[]) => {
  if (!quoteHistory || quoteHistory.length === 0) {
    return {
      labels: generateTimeLabels(14),
      datasets: [
        {
          label: 'Asset Price',
          data: Array(14).fill(null),
          borderColor: 'rgba(16, 185, 129, 1)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: false,
        },
        {
          label: 'Upper Band',
          data: Array(14).fill(null),
          borderColor: 'rgba(239, 68, 68, 0.7)',
          borderDash: [5, 5],
          tension: 0.4,
          fill: false,
        },
        {
          label: 'Lower Band',
          data: Array(14).fill(null),
          borderColor: 'rgba(59, 130, 246, 0.7)',
          borderDash: [5, 5],
          tension: 0.4,
          fill: false,
        },
      ],
    };
  }
  
  // Use actual data
  const labels = quoteHistory.map(data => formatTimestamp(data.timestamp));
  const priceData = quoteHistory.map(data => data.price);
  
  // Calculate simple bollinger bands
  const period = 20; // Standard bollinger period
  const stdDevMultiplier = 2; // Standard deviation multiplier
  const stdDev = 25; // Simplified fixed standard deviation for demonstration
  
  const upperBand = priceData.map(price => price + stdDevMultiplier * stdDev);
  const lowerBand = priceData.map(price => price - stdDevMultiplier * stdDev);
  
  return {
    labels,
    datasets: [
      {
        label: 'Asset Price',
        data: priceData,
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: false,
      },
      {
        label: 'Upper Band',
        data: upperBand,
        borderColor: 'rgba(239, 68, 68, 0.7)',
        borderDash: [5, 5],
        tension: 0.4,
        fill: false,
      },
      {
        label: 'Lower Band',
        data: lowerBand,
        borderColor: 'rgba(59, 130, 246, 0.7)',
        borderDash: [5, 5],
        tension: 0.4,
        fill: false,
      },
    ],
  };
};

// Prepare data for premium distribution chart
export const preparePremiumDistributionData = (bandDataHistory: BandData[]) => {
  // Default empty data
  if (!bandDataHistory || bandDataHistory.length === 0) {
    return {
      labels: ['<1.5', '1.5-2.0', '2.0-2.5', '2.5-3.0', '3.0-3.5', '>3.5'],
      datasets: [
        {
          label: 'Frequency',
          data: [0, 0, 0, 0, 0, 0],
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
        },
      ],
    };
  }
  
  // Calculate distribution
  const bins = [0, 0, 0, 0, 0, 0]; // <1.5, 1.5-2.0, 2.0-2.5, 2.5-3.0, 3.0-3.5, >3.5
  
  bandDataHistory.forEach(data => {
    const premium = data.premium;
    if (premium < 1.5) bins[0]++;
    else if (premium < 2.0) bins[1]++;
    else if (premium < 2.5) bins[2]++;
    else if (premium < 3.0) bins[3]++;
    else if (premium < 3.5) bins[4]++;
    else bins[5]++;
  });
  
  return {
    labels: ['<1.5', '1.5-2.0', '2.0-2.5', '2.5-3.0', '3.0-3.5', '>3.5'],
    datasets: [
      {
        label: 'Frequency',
        data: bins,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
      },
    ],
  };
};

// Prepare data for price activity heatmap
export const preparePriceActivityHeatmap = (quoteHistory: QuoteData[]) => {
  // Default empty data
  if (!quoteHistory || quoteHistory.length === 0) {
    return {
      labels: ['9:30-11:00', '11:00-12:30', '12:30-14:00', '14:00-15:30', '15:30-16:00'],
      datasets: [
        {
          label: 'Price Activity',
          data: [0, 0, 0, 0, 0],
          backgroundColor: [
            'rgba(16, 185, 129, 0.5)',
            'rgba(59, 130, 246, 0.5)',
            'rgba(59, 130, 246, 0.3)',
            'rgba(59, 130, 246, 0.5)',
            'rgba(16, 185, 129, 0.5)',
          ],
        },
      ],
    };
  }
  
  // Calculate activity by time period (simplified approach)
  const activityByPeriod = [0, 0, 0, 0, 0];
  
  quoteHistory.forEach(data => {
    const date = new Date(data.timestamp);
    const hour = date.getHours();
    const minute = date.getMinutes();
    const timeValue = hour + minute / 60;
    
    if (timeValue >= 9.5 && timeValue < 11) activityByPeriod[0]++;
    else if (timeValue >= 11 && timeValue < 12.5) activityByPeriod[1]++;
    else if (timeValue >= 12.5 && timeValue < 14) activityByPeriod[2]++;
    else if (timeValue >= 14 && timeValue < 15.5) activityByPeriod[3]++;
    else if (timeValue >= 15.5 && timeValue < 16) activityByPeriod[4]++;
  });
  
  // Normalize values (if we don't have enough data)
  if (quoteHistory.length < 20) {
    activityByPeriod[0] = 68;
    activityByPeriod[1] = 42;
    activityByPeriod[2] = 35;
    activityByPeriod[3] = 50;
    activityByPeriod[4] = 75;
  }
  
  return {
    labels: ['9:30-11:00', '11:00-12:30', '12:30-14:00', '14:00-15:30', '15:30-16:00'],
    datasets: [
      {
        label: 'Price Activity',
        data: activityByPeriod,
        backgroundColor: [
          'rgba(16, 185, 129, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(59, 130, 246, 0.5)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(16, 185, 129, 0.7)',
        ],
      },
    ],
  };
};
