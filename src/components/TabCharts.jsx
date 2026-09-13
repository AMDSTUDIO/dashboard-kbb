import React from 'react';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { Layers, Award, CalendarX, Database, PieChart, BarChart3, TrendingUp, Users } from 'lucide-react';

const commonTooltip = {
  backgroundColor: '#0f172a',
  titleColor: '#38bdf8',
  bodyColor: '#f8fafc',
  borderColor: 'rgba(56, 189, 248, 0.3)',
  borderWidth: 1,
  padding: 10
};

const commonLegend = {
  position: 'top',
  labels: {
    color: '#94a3b8',
    font: { family: 'Plus Jakarta Sans', size: 11, weight: 600 },
    usePointStyle: true,
    padding: 12
  }
};

/* =========================================================
   1. TAB REKAP JABATAN FUNGSIONAL CHARTS
   ========================================================= */
export function JabatanCharts({ stats }) {
  if (!stats) return null;

  const jfMap = stats.jfJenjangMap || {};
  
  // Chart 1: Kategori & Jenjang JF (Grouped Bar)
  const jenjangLabels = ['Pemula', 'Terampil', 'Mahir', 'Penyelia', 'Ahli Pertama', 'Ahli Muda', 'Ahli Madya', 'Ahli Utama'];
  const keterampilanData = [
    jfMap['Pemula'] || 0,
    jfMap['Terampil'] || 0,
    jfMap['Mahir'] || 0,
    jfMap['Penyelia'] || 0,
    0, 0, 0, 0
  ];
  const keahlianData = [
    0, 0, 0, 0,
    jfMap['Ahli Pertama'] || 0,
    jfMap['Ahli Muda'] || 0,
    jfMap['Ahli Madya'] || 0,
    jfMap['Ahli Utama'] || 0
  ];

  const categoryData = {
    labels: jenjangLabels,
    datasets: [
      {
        label: 'Kategori Keterampilan',
        data: keterampilanData,
        backgroundColor: '#38bdf8',
        borderRadius: 4
      },
      {
        label: 'Kategori Keahlian',
        data: keahlianData,
        backgroundColor: '#a855f7',
        borderRadius: 4
      }
    ]
  };

  const categoryOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: commonLegend, tooltip: commonTooltip },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#f8fafc' } }
    }
  };

  // Chart 2: Top 10 Formasi JF Terbanyak (Horizontal Bar)
  const top10Jf = (stats.jabatanList || []).slice(0, 10);
  const topJfData = {
    labels: top10Jf.map(j => j.name.length > 25 ? j.name.substring(0, 25) + '...' : j.name),
    datasets: [
      {
        label: 'Jumlah Pegawai',
        data: top10Jf.map(j => j.total),
        backgroundColor: '#10b981',
        borderRadius: 4
      }
    ]
  };

  const topJfOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { legend: { display: false }, tooltip: commonTooltip },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
      y: { grid: { display: false }, ticks: { color: '#f8fafc', font: { size: 10 } } }
    }
  };

  return (
    <div className="responsive-grid-2col" style={{ marginBottom: '24px' }}>
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Layers style={{ color: '#38bdf8', width: '18px', height: '18px' }} />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            Komposisi Kategori & Jenjang JF
          </h4>
        </div>
        <div style={{ height: '220px', width: '100%' }}>
          <Bar data={categoryData} options={categoryOptions} />
        </div>
      </div>

      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <BarChart3 style={{ color: '#10b981', width: '18px', height: '18px' }} />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            Top 10 Formasi Jabatan Fungsional Terbanyak
          </h4>
        </div>
        <div style={{ height: '220px', width: '100%' }}>
          <Bar data={topJfData} options={topJfOptions} />
        </div>
      </div>
    </div>
  );
}


/* =========================================================
   2. TAB PROYEKSI PENSIUN BUP CHARTS
   ========================================================= */
export function PensiunCharts({ stats }) {
  if (!stats) return null;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear + i);
  const trendData = years.map(yr => stats.retirementYearMap[yr] || 0);

  // Chart 1: Tren Proyeksi Pensiun (Line Chart)
  const lineData = {
    labels: years.map(y => `Thn ${y}`),
    datasets: [
      {
        label: 'Jumlah Pegawai BUP',
        data: trendData,
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.15)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#f43f5e',
        pointRadius: 4
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: commonTooltip },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#f8fafc' } }
    }
  };

  // Chart 2: Komposisi Jenis BUP (Donut Chart)
  const bupDonutData = {
    labels: ['BUP 58 Tahun (Pelaksana/JF)', 'BUP 60 Tahun (Madya/Pimpinan)'],
    datasets: [
      {
        data: [stats.totalBup58 || 0, stats.totalBup60 || 0],
        backgroundColor: ['#38bdf8', '#f43f5e'],
        borderColor: '#0f172a',
        borderWidth: 3
      }
    ]
  };

  const bupDonutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, usePointStyle: true } },
      tooltip: commonTooltip
    },
    cutout: '68%'
  };

  return (
    <div className="responsive-grid-2col" style={{ marginBottom: '24px' }}>
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <TrendingUp style={{ color: '#f43f5e', width: '18px', height: '18px' }} />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            Tren Proyeksi Pensiun ({currentYear} - {currentYear + 5})
          </h4>
        </div>
        <div style={{ height: '210px', width: '100%' }}>
          <Line data={lineData} options={lineOptions} />
        </div>
      </div>

      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <CalendarX style={{ color: '#38bdf8', width: '18px', height: '18px' }} />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            Komposisi BUP 58 vs BUP 60 Tahun
          </h4>
        </div>
        <div style={{ height: '210px', width: '100%' }}>
          <Doughnut data={bupDonutData} options={bupDonutOptions} />
        </div>
      </div>
    </div>
  );
}


/* =========================================================
   3. TAB PROYEKSI NAIK JENJANG CHARTS
   ========================================================= */
export function PromotionCharts({ stats }) {
  if (!stats) return null;

  const targetMap = stats.targetRankMap || {};
  const sortedRanks = ['II/b', 'II/c', 'II/d', 'III/a', 'III/b', 'III/c', 'III/d', 'IV/a', 'IV/b', 'IV/c', 'IV/d', 'IV/e'];
  const rankDataValues = sortedRanks.map(r => targetMap[r] || 0);

  // Chart 1: Sebaran Target Golongan Baru (Bar Chart)
  const rankData = {
    labels: sortedRanks,
    datasets: [
      {
        label: 'Jumlah Pegawai Target',
        data: rankDataValues,
        backgroundColor: '#f59e0b',
        borderRadius: 4
      }
    ]
  };

  const rankOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: commonTooltip },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#f8fafc' } }
    }
  };

  // Chart 2: Status Kelayakan (Donut Chart)
  const promoStatus = stats.promotionStatusMap || {};
  const statusDonutData = {
    labels: ['Sudah Eligible (TMT ≥ 4 Thn)', 'Eligible Tahun Depan', 'Belum Waktunya'],
    datasets: [
      {
        data: [
          promoStatus['Sudah Eligible (TMT ≥ 4 Thn)'] || 0,
          promoStatus['Eligible Tahun Depan'] || 0,
          promoStatus['Belum Waktunya'] || 0
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#64748b'],
        borderColor: '#0f172a',
        borderWidth: 3
      }
    ]
  };

  const statusDonutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, usePointStyle: true } },
      tooltip: commonTooltip
    },
    cutout: '68%'
  };

  return (
    <div className="responsive-grid-2col" style={{ marginBottom: '24px' }}>
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Award style={{ color: '#f59e0b', width: '18px', height: '18px' }} />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            Sebaran Target Golongan/Pangkat Baru
          </h4>
        </div>
        <div style={{ height: '210px', width: '100%' }}>
          <Bar data={rankData} options={rankOptions} />
        </div>
      </div>

      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <PieChart style={{ color: '#10b981', width: '18px', height: '18px' }} />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            Status Kelayakan Kenaikan Pangkat
          </h4>
        </div>
        <div style={{ height: '210px', width: '100%' }}>
          <Doughnut data={statusDonutData} options={statusDonutOptions} />
        </div>
      </div>
    </div>
  );
}


/* =========================================================
   4. TAB MASTER DATA PEGAWAI CHARTS
   ========================================================= */
export function MasterDataCharts({ stats }) {
  if (!stats) return null;

  const pendMap = stats.pendidikanMap || {};
  const pendLabels = ['SD / SMP', 'SMA / SMK', 'D-III', 'S1 / D-IV', 'S2', 'S3', 'Lainnya'];
  const pendValues = pendLabels.map(l => pendMap[l] || 0);

  // Chart 1: Distribusi Pendidikan (Column Bar)
  const pendData = {
    labels: pendLabels,
    datasets: [
      {
        label: 'Jumlah Pegawai',
        data: pendValues,
        backgroundColor: '#0284c7',
        borderRadius: 4
      }
    ]
  };

  const pendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: commonTooltip },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#f8fafc' } }
    }
  };

  // Chart 2: Status Kepegawaian PNS vs PPPK (Mini Donut)
  const asnDonutData = {
    labels: ['PNS', 'PPPK'],
    datasets: [
      {
        data: [stats.totalPNS || 0, stats.totalPPPK || 0],
        backgroundColor: ['#10b981', '#a855f7'],
        borderColor: '#0f172a',
        borderWidth: 3
      }
    ]
  };

  const asnDonutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, usePointStyle: true } },
      tooltip: commonTooltip
    },
    cutout: '70%'
  };

  return (
    <div className="responsive-grid-2col" style={{ marginBottom: '24px' }}>
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Database style={{ color: '#0284c7', width: '18px', height: '18px' }} />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            Distribusi Tingkat Pendidikan Terakhir
          </h4>
        </div>
        <div style={{ height: '200px', width: '100%' }}>
          <Bar data={pendData} options={pendOptions} />
        </div>
      </div>

      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Users style={{ color: '#a855f7', width: '18px', height: '18px' }} />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            Rasio Status Kepegawaian (PNS vs PPPK)
          </h4>
        </div>
        <div style={{ height: '200px', width: '100%' }}>
          <Doughnut data={asnDonutData} options={asnDonutOptions} />
        </div>
      </div>
    </div>
  );
}
