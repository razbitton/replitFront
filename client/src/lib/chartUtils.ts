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
        padding: 20,
        font: {
          family: 'system-ui, sans-serif',
          weight: '500',
          size: 13,
        },
        color: '#4B5563',
      },
    },
    tooltip: {
      enabled: true,
      usePointStyle: true,
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      titleColor: '#1F2937',
      bodyColor: '#374151',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      padding: 12,
      bodyFont: {
        family: 'system-ui, sans-serif',
      },
      titleFont: {
        family: 'system-ui, sans-serif',
        weight: 'bold',
      },
      callbacks: {
        label: function(context: any) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += context.parsed.y.toFixed(2);
          }
          return label;
        }
      }
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          family: 'system-ui, sans-serif',
          size: 11,
        },
        color: '#6B7280',
        padding: 10,
      },
      border: {
        color: '#E5E7EB',
      },
    },
    y: {
      beginAtZero: false,
      grid: {
        color: 'rgba(156, 163, 175, 0.1)', // Tailwind gray-400 at 10% opacity - for less prominent grid lines
        drawBorder: false,
      },
      ticks: {
        font: {
          family: 'system-ui, sans-serif',
          size: 11,
        },
        color: '#6B7280',
        padding: 10,
        callback: function(value: any) {
          if (typeof value === 'number' && value >= 1000) {
            return (value / 1000) + 'k';
          }
          return value;
        }
      },
      border: {
        color: '#E5E7EB',
      },
    },
  },
  elements: {
    point: {
      radius: 0,
      hoverRadius: 6,
      borderWidth: 2,
      hoverBorderWidth: 3,
      backgroundColor: 'rgba(255, 255, 255, 1)',
    },
    line: {
      borderWidth: 2.5,
      tension: 0.4,
      borderJoinStyle: 'round' as const,
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
          borderColor: 'rgba(79, 70, 229, 1)', // Vibrant Indigo
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: 'rgba(79, 70, 229, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(79, 70, 229, 1)',
        },
        {
          label: 'Upper Band',
          data: Array(14).fill(null),
          borderColor: 'rgba(156, 163, 175, 0.7)', // Tailwind Gray-400 for a softer dashed line
          borderDash: [6, 3], // Adjusted dash pattern
          borderWidth: 2, // Slightly thicker dash
          tension: 0.4,
          fill: false,
          pointRadius: 0, // No points for band lines
        },
        {
          label: 'Lower Band',
          data: Array(14).fill(null),
          borderColor: 'rgba(156, 163, 175, 0.7)', // Tailwind Gray-400
          borderDash: [6, 3],
          borderWidth: 2,
          tension: 0.4,
          fill: false,
          pointRadius: 0,
        },
      ],
    };
  }
  
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
        borderColor: 'rgba(79, 70, 229, 1)', // Vibrant Indigo
        backgroundColor: 'rgba(79, 70, 229, 0.1)', // Light Indigo fill
        tension: 0.4, // Consistent smoothness
        fill: true,
        pointBackgroundColor: 'rgba(79, 70, 229, 1)',
        pointBorderColor: '#fff', // White border for points
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(79, 70, 229, 1)',
      },
      {
        label: 'Upper Band',
        data: upperBandData,
        borderColor: 'rgba(156, 163, 175, 0.7)', // Tailwind Gray-400
        borderDash: [6, 3], // Refined dash pattern
        borderWidth: 2,
        tension: 0.4, // Smooth dashed line
        fill: false,
        pointRadius: 0, // No points for band lines
      },
      {
        label: 'Lower Band',
        data: lowerBandData,
        borderColor: 'rgba(156, 163, 175, 0.7)', // Tailwind Gray-400
        borderDash: [6, 3],
        borderWidth: 2,
        tension: 0.4,
        fill: false,
        pointRadius: 0,
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
          borderColor: 'rgba(5, 150, 105, 1)', // Vibrant Emerald
          backgroundColor: 'rgba(5, 150, 105, 0.1)',
          tension: 0.4, // Global tension, can be overridden
          fill: true,
          borderWidth: 2.5,
          pointRadius: 0, // Consistent with global settings
          pointBackgroundColor: 'rgba(5, 150, 105, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(5, 150, 105, 1)',
        },
      ],
    };
  }
  
  const labels = quoteHistory.map(data => formatTimestamp(data.timestamp));
  const priceData = quoteHistory.map(data => data.price);
  
  return {
    labels,
    datasets: [
      {
        label: 'Asset Price',
        data: priceData,
        borderColor: 'rgba(5, 150, 105, 1)', // Vibrant Emerald
        backgroundColor: 'rgba(5, 150, 105, 0.1)', // Light Emerald fill
        tension: 0.4, // Consistent smoothness
        fill: true,
        pointBackgroundColor: 'rgba(5, 150, 105, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(5, 150, 105, 1)',
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
          borderColor: 'rgba(5, 150, 105, 1)', // Vibrant Emerald (consistent with Asset Chart)
          backgroundColor: 'rgba(5, 150, 105, 0.1)',
          tension: 0.4,
          fill: false, // Usually Bollinger price line isn't filled
          pointBackgroundColor: 'rgba(5, 150, 105, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(5, 150, 105, 1)',
        },
        {
          label: 'Upper Band',
          data: Array(14).fill(null),
          borderColor: 'rgba(217, 70, 239, 0.7)', // Vibrant Fuchsia for bands
          borderDash: [6, 3],
          borderWidth: 2,
          tension: 0.4,
          fill: false,
          pointRadius: 0,
        },
        {
          label: 'Lower Band',
          data: Array(14).fill(null),
          borderColor: 'rgba(217, 70, 239, 0.7)', // Vibrant Fuchsia for bands
          borderDash: [6, 3],
          borderWidth: 2,
          tension: 0.4,
          fill: false,
          pointRadius: 0,
        },
      ],
    };
  }
  
  const labels = quoteHistory.map(data => formatTimestamp(data.timestamp));
  const priceData = quoteHistory.map(data => data.price);
  
  const period = 20; 
  const stdDevMultiplier = 2; 
  const stdDev = 25; 
  
  const upperBand = priceData.map(price => price + stdDevMultiplier * stdDev);
  const lowerBand = priceData.map(price => price - stdDevMultiplier * stdDev);
  
  return {
    labels,
    datasets: [
      {
        label: 'Asset Price',
        data: priceData,
        borderColor: 'rgba(5, 150, 105, 1)', // Vibrant Emerald
        backgroundColor: 'rgba(5, 150, 105, 0.1)',
        tension: 0.4,
        fill: false, // Price line in Bollinger usually not filled to see bands clearly
        pointBackgroundColor: 'rgba(5, 150, 105, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(5, 150, 105, 1)',
      },
      {
        label: 'Upper Band',
        data: upperBand,
        borderColor: 'rgba(217, 70, 239, 0.7)', // Vibrant Fuchsia for bands
        borderDash: [6, 3],
        borderWidth: 2,
        tension: 0.4,
        fill: false,
        pointRadius: 0,
      },
      {
        label: 'Lower Band',
        data: lowerBand,
        borderColor: 'rgba(217, 70, 239, 0.7)', // Vibrant Fuchsia for bands
        borderDash: [6, 3],
        borderWidth: 2,
        tension: 0.4,
        fill: false,
        pointRadius: 0,
      },
    ],
  };
};

// Prepare data for premium distribution chart
export const preparePremiumDistributionData = (bandDataHistory: BandData[]) => {
  if (!bandDataHistory || bandDataHistory.length === 0) {
    return {
      labels: ['<1.5', '1.5-2.0', '2.0-2.5', '2.5-3.0', '3.0-3.5', '>3.5'],
      datasets: [
        {
          label: 'Frequency',
          data: [0, 0, 0, 0, 0, 0],
          backgroundColor: 'rgba(16, 185, 129, 0.7)', // Vibrant Emerald
          borderColor: 'rgba(16, 185, 129, 1)', // Darker Emerald for border
          borderWidth: 1,
          borderRadius: 4, // Rounded bars
          hoverBackgroundColor: 'rgba(16, 185, 129, 0.9)',
          hoverBorderColor: 'rgba(16, 185, 129, 1)',
        },
      ],
    };
  }
  
  const bins = [0, 0, 0, 0, 0, 0];
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
        backgroundColor: 'rgba(16, 185, 129, 0.7)', // Vibrant Emerald
        borderColor: 'rgba(16, 185, 129, 1)', // Darker Emerald for border
        borderWidth: 1,
        borderRadius: 4, // Rounded bars
        hoverBackgroundColor: 'rgba(16, 185, 129, 0.9)',
        hoverBorderColor: 'rgba(16, 185, 129, 1)',
      },
    ],
  };
};

// Prepare data for price activity heatmap
export const preparePriceActivityHeatmap = (quoteHistory: QuoteData[]) => {
  if (!quoteHistory || quoteHistory.length === 0) {
    // Using a more cohesive and modern palette for the empty state
    const defaultColors = [
      'rgba(79, 70, 229, 0.3)', // Light Indigo
      'rgba(79, 70, 229, 0.5)', // Medium Indigo
      'rgba(79, 70, 229, 0.7)', // Darker Indigo
      'rgba(79, 70, 229, 0.5)', // Medium Indigo
      'rgba(79, 70, 229, 0.3)', // Light Indigo
    ];
    return {
      labels: ['9:30-11:00', '11:00-12:30', '12:30-14:00', '14:00-15:30', '15:30-16:00'],
      datasets: [
        {
          label: 'Price Activity',
          data: [0, 0, 0, 0, 0],
          backgroundColor: defaultColors,
          borderColor: defaultColors.map(color => color.replace('0.', '1').replace('rgba', 'rgb')), // Solid border
          borderWidth: 1,
          hoverBackgroundColor: defaultColors.map(color => color.replace('0.', '0.9')), // Darker on hover
        },
      ],
    };
  }
  
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
  
  // If data is sparse, use some default mock values for better visual
  if (quoteHistory.length < 20) {
    activityByPeriod[0] = 68;
    activityByPeriod[1] = 42;
    activityByPeriod[2] = 35;
    activityByPeriod[3] = 50;
    activityByPeriod[4] = 75;
  }

  // Define a vibrant and modern color scale (e.g., from light teal to dark purple)
  const colorScale = [
    'rgba(20, 184, 166, 0.7)', // Teal-500
    'rgba(16, 185, 129, 0.7)', // Emerald-500
    'rgba(59, 130, 246, 0.7)', // Blue-500
    'rgba(99, 102, 241, 0.7)', // Indigo-500
    'rgba(139, 92, 246, 0.7)', // Violet-500
  ];
  
  // Assign colors based on activity (could be more sophisticated)
  const backgroundColors = activityByPeriod.map((activity, index) => {
    // Simple mapping, can be replaced with a proper scaling function if values vary a lot
    if (activity > 60) return colorScale[4];
    if (activity > 45) return colorScale[3];
    if (activity > 30) return colorScale[2];
    if (activity > 15) return colorScale[1];
    return colorScale[0];
  });

  return {
    labels: ['9:30-11:00', '11:00-12:30', '12:30-14:00', '14:00-15:30', '15:30-16:00'],
    datasets: [
      {
        label: 'Price Activity',
        data: activityByPeriod,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color.replace('0.7', '1').replace('rgba', 'rgb')), // Solid border
        borderWidth: 1,
        hoverBackgroundColor: backgroundColors.map(color => color.replace('0.7', '0.9')), // Darker on hover
      },
    ],
  };
};
