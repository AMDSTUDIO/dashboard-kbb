import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { PieChart, BarChart3, TrendingUp } from 'lucide-react';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title
);

export default function ChartsSection({ stats }) {
  if (!stats) return null;

  // Donut Chart Data: PNS vs PPPK & Gender
  const doughnutData = {
    labels: ['PNS Laki-laki', 'PNS Perempuan', 'PPPK Laki-laki', 'PPPK Perempuan'],
    datasets: [
      {
        data: [
          Math.round((stats.totalPNS || 0) * (stats.totalMale / (stats.totalPegawai || 1))),
          Math.round((stats.totalPNS || 0) * (stats.totalFemale / (stats.totalPegawai || 1))),
          Math.round((stats.totalPPPK || 0) * (stats.totalMale / (stats.totalPegawai || 1))),
          Math.round((stats.totalPPPK || 0) * (stats.totalFemale / (stats.totalPegawai || 1)))
        ],
        backgroundColor: [
          '#0284c7', // PNS Male
          '#38bdf8', // PNS Female
          '#9333ea', // PPPK Male
          '#c084fc'  // PPPK Female
        ],
        borderColor: '#1e293b',
        borderWidth: 3,
        hoverOffset: 6
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 },
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#38bdf8',
        bodyColor: '#f8fafc',
        borderColor: 'rgba(56, 189, 248, 0.3)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6
      }
    },
    cutout: '70%'
  };

  // Top 10 OPD Bar Chart
  const topOpds = (stats.opdList || []).slice(0, 10);
  const barData = {
    labels: topOpds.map(o => o.name.length > 25 ? o.name.substring(0, 25) + '...' : o.name),
    datasets: [
      {
        label: 'PNS',
        data: topOpds.map(o => o.pns),
        backgroundColor: '#0284c7',
        borderRadius: 4
      },
      {
        label: 'PPPK',
        data: topOpds.map(o => o.pppk),
        backgroundColor: '#a855f7',
        borderRadius: 4
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 },
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#38bdf8',
        bodyColor: '#f8fafc',
        borderColor: 'rgba(56, 189, 248, 0.3)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94a3b8' }
      },
      y: {
        grid: { display: false },
        ticks: { color: '#f8fafc', font: { size: 11 } }
      }
    }
  };

  // Timeline Proyeksi Chart (2026 - 2033)
  const currentYear = new Date().getFullYear();
  const timelineYears = Array.from({ length: 8 }, (_, i) => currentYear + i);

  const timelinePensiunData = timelineYears.map(yr => stats.retirementYearMap[yr] || 0);
  const timelinePromotionData = timelineYears.map(yr => stats.promotionYearMap[yr] || 0);

  const lineData = {
    labels: timelineYears.map(y => `Tahun ${y}`),
    datasets: [
      {
        label: 'Proyeksi Pensiun (BUP)',
        data: timelinePensiunData,
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#f43f5e',
        pointRadius: 5
      },
      {
        label: 'Proyeksi Naik Jenjang (Rule 4 Thn)',
        data: timelinePromotionData,
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#38bdf8',
        pointRadius: 5
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 },
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#38bdf8',
        bodyColor: '#f8fafc',
        borderColor: 'rgba(56, 189, 248, 0.3)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94a3b8' }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94a3b8' }
      }
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
      
      {/* Chart 1: Donut Status & Gender */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <PieChart style={{ color: '#38bdf8', width: '20px', height: '20px' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            Distribusi Status ASN & Gender
          </h3>
        </div>
        <div style={{ height: '260px', position: 'relative' }}>
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>

      {/* Chart 2: Top OPD Bar Chart */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <BarChart3 style={{ color: '#a855f7', width: '20px', height: '20px' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            Distribusi Pegawai per OPD (Top 10)
          </h3>
        </div>
        <div style={{ height: '260px', position: 'relative' }}>
          <Bar data={barData} options={barOptions} />
        </div>
      </div>

      {/* Chart 3: Timeline Proyeksi Line Chart */}
      <div className="glass-card" style={{ padding: '20px', gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <TrendingUp style={{ color: '#f59e0b', width: '20px', height: '20px' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            Timeline Proyeksi Pensiun & Naik Jenjang (2026 - 2033)
          </h3>
        </div>
        <div style={{ height: '280px', position: 'relative' }}>
          <Line data={lineData} options={lineOptions} />
        </div>
      </div>

    </div>
  );
}
