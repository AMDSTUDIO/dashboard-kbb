/**
 * Executive Kepegawaian Data Processor
 * Handles parsing, BUP 60/58 retirement logic, 4-year promotion projections,
 * PNS/PPPK classification, and statistic aggregations.
 */

export function parseBirthDateFromNIP(nip) {
  if (!nip || typeof nip !== 'string') return null;
  const cleanNip = nip.replace(/\D/g, '');
  if (cleanNip.length < 8) return null;
  
  const yyyy = parseInt(cleanNip.slice(0, 4), 10);
  const mm = parseInt(cleanNip.slice(4, 6), 10);
  const dd = parseInt(cleanNip.slice(6, 8), 10);
  
  if (isNaN(yyyy) || isNaN(mm) || isNaN(dd)) return null;
  if (yyyy < 1940 || yyyy > 2010 || mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  
  const formattedMM = String(mm).padStart(2, '0');
  const formattedDD = String(dd).padStart(2, '0');
  return {
    year: yyyy,
    month: mm,
    day: dd,
    formatted: `${yyyy}-${formattedMM}-${formattedDD}`,
    dateObj: new Date(yyyy, mm - 1, dd)
  };
}

export function parseTmtYear(tmtStr) {
  if (!tmtStr) return null;
  const str = String(tmtStr).trim();
  
  // Format DD/MM/YYYY
  const dmyMatch = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    return parseInt(dmyMatch[3], 10);
  }
  
  // Format YYYY-MM-DD
  const ymdMatch = str.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    return parseInt(ymdMatch[1], 10);
  }
  
  return null;
}

export function determineTargetPangkat(jabatanStr) {
  if (!jabatanStr) return '3/a';
  const lower = jabatanStr.toLowerCase();
  
  if (lower.includes('pemula')) {
    return '2/c';
  } else if (lower.includes('terampil')) {
    return '2/d';
  } else if (lower.includes('mahir') || lower.includes('ahli pertama') || lower.includes('pertama')) {
    return '3/b';
  } else if (lower.includes('penyelia') || lower.includes('ahli muda') || lower.includes('muda')) {
    return '3/d';
  } else if (lower.includes('ahli madya') || lower.includes('madya')) {
    return '4/c';
  } else if (lower.includes('ahli utama') || lower.includes('utama')) {
    return '4/e';
  }
  
  return '3/b';
}

export function processEmployeeRow(row, index) {
  // Support both array row or object row
  const nip = String(row[1] || row.NIP || row.nip || '').trim();
  const nama = String(row[2] || row.NAMA || row.nama || '').trim();
  const genderRaw = String(row[3] || row.JENIS_KELAMIN || row.gender || '').trim().toUpperCase();
  const gender = (genderRaw === 'M' || genderRaw === 'L') ? 'Laki-laki' : 'Perempuan';
  
  const golongan = String(row[4] || row.GOLONGAN || row.golongan || '').trim();
  const tmtPangkat = String(row[5] || row.TMT || row.tmt || '').trim();
  const pendTingkat = String(row[6] || row.PENDIDIKAN_TINGKAT || row.pendidikan || '').trim();
  const pendJurusan = String(row[7] || row.PENDIDIKAN_JURUSAN || row.jurusan || '').trim();
  const jabatan = String(row[8] || row.JABATAN || row.jabatan || '').trim();
  const jenisJabatan = String(row[9] || row.JENIS_JABATAN || row.status || '').trim();
  const opd = String(row[10] || row.OPD || row.opd || '').trim();
  const unitKerja = String(row[11] || row.UNIT_KERJA || row.unit_kerja || '').trim();
  const noHp = String(row[12] || row.NO_HP || row.hp || '').trim();
  const email = String(row[13] || row.EMAIL || row.email || '').trim();
  const alamat = String(row[14] || row.ALAMAT || row.alamat || '').trim();

  // Status PNS vs PPPK
  const golUpper = golongan.toUpperCase();
  const jenisUpper = jenisJabatan.toUpperCase();
  const jabUpper = jabatan.toUpperCase();
  
  const isPPPK = jenisUpper.includes('PPPK') || 
                 jabUpper.includes('PPPK') || 
                 Boolean(golUpper.match(/^(IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|V|VI|VII|VIII)$/));
  const statusAsn = isPPPK ? 'PPPK' : 'PNS';

  // BUP Calculation
  const isAhliMadya = jabUpper.includes('AHLI MADYA') || jabUpper.includes('MADYA') || jabUpper.includes('AHLI UTAMA');
  const bupYears = isAhliMadya ? 60 : 58;
  
  const birthInfo = parseBirthDateFromNIP(nip);
  const currentYear = new Date().getFullYear();
  
  let birthYear = birthInfo ? birthInfo.year : null;
  let retirementYear = birthYear ? birthYear + bupYears : null;
  let age = birthYear ? currentYear - birthYear : null;
  let yearsToRetire = retirementYear ? retirementYear - currentYear : null;
  
  let statusRetirement = 'Normal';
  if (retirementYear) {
    if (retirementYear <= currentYear) {
      statusRetirement = 'Siap Pensiun';
    } else if (retirementYear <= currentYear + 3) {
      statusRetirement = 'Pensiun Dekat (1-3 Thn)';
    } else {
      statusRetirement = 'Aktif (>3 Thn)';
    }
  }

  // Naik Jenjang (Rule 4 Tahun & Target Pangkat)
  const tmtYear = parseTmtYear(tmtPangkat);
  const eligibleYear = tmtYear ? tmtYear + 4 : null;
  const targetPangkat = determineTargetPangkat(jabatan);
  
  let isEligiblePromotion = eligibleYear ? eligibleYear <= currentYear : false;
  let promotionStatus = 'Belum Eligible';
  if (eligibleYear) {
    if (eligibleYear <= currentYear) {
      promotionStatus = 'Eligible (Sudah 4+ Thn)';
    } else if (eligibleYear === currentYear + 1) {
      promotionStatus = 'Eligible Tahun Depan';
    } else {
      promotionStatus = `Eligible Tahun ${eligibleYear}`;
    }
  }

  return {
    id: index + 1,
    nip,
    nama,
    gender,
    genderRaw,
    golongan,
    tmtPangkat,
    tmtYear,
    pendTingkat,
    pendJurusan,
    jabatan,
    jenisJabatan,
    opd,
    unitKerja,
    noHp,
    email,
    alamat,
    statusAsn,
    bupYears,
    isAhliMadya,
    birthInfo,
    birthYear,
    retirementYear,
    age,
    yearsToRetire,
    statusRetirement,
    eligibleYear,
    targetPangkat,
    isEligiblePromotion,
    promotionStatus
  };
}

export function processDataset(rawRows) {
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    return {
      employees: [],
      stats: getEmptyStats()
    };
  }

  // Skip header if first row has "NO" or "NIP"
  const startIndex = (String(rawRows[0][0]).toUpperCase().includes('NO') || String(rawRows[0][1]).toUpperCase().includes('NIP')) ? 1 : 0;
  
  const employees = [];
  
  for (let i = startIndex; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || (!row[1] && !row[2])) continue; // skip empty rows
    const emp = processEmployeeRow(row, employees.length);
    if (emp.nip || emp.nama) {
      employees.push(emp);
    }
  }

  const stats = aggregateStats(employees);

  return {
    employees,
    stats
  };
}

function aggregateStats(employees) {
  const totalPegawai = employees.length;
  let totalPNS = 0;
  let totalPPPK = 0;
  let totalMale = 0;
  let totalFemale = 0;
  let totalBup60 = 0;
  let totalBup58 = 0;
  let totalEligiblePromotion = 0;
  let totalRetiringIn3Years = 0;

  const jabatanMap = {};
  const opdMap = {};
  const retirementYearMap = {};
  const promotionYearMap = {};

  const currentYear = new Date().getFullYear();

  employees.forEach(emp => {
    if (emp.statusAsn === 'PNS') totalPNS++;
    if (emp.statusAsn === 'PPPK') totalPPPK++;
    if (emp.gender === 'Laki-laki') totalMale++;
    if (emp.gender === 'Perempuan') totalFemale++;
    
    if (emp.bupYears === 60) totalBup60++;
    if (emp.bupYears === 58) totalBup58++;

    if (emp.isEligiblePromotion) totalEligiblePromotion++;
    if (emp.retirementYear && emp.retirementYear >= currentYear && emp.retirementYear <= currentYear + 3) {
      totalRetiringIn3Years++;
    }

    // Aggregate Jabatan
    const jabName = emp.jabatan || 'Lainnya';
    if (!jabatanMap[jabName]) {
      jabatanMap[jabName] = {
        name: jabName,
        total: 0,
        male: 0,
        female: 0,
        pns: 0,
        pppk: 0,
        isAhliMadya: emp.isAhliMadya,
        bupYears: emp.bupYears
      };
    }
    jabatanMap[jabName].total++;
    if (emp.gender === 'Laki-laki') jabatanMap[jabName].male++;
    if (emp.gender === 'Perempuan') jabatanMap[jabName].female++;
    if (emp.statusAsn === 'PNS') jabatanMap[jabName].pns++;
    if (emp.statusAsn === 'PPPK') jabatanMap[jabName].pppk++;

    // Aggregate OPD
    const opdName = emp.opd || 'Lainnya / Tidak Terdefinisi';
    if (!opdMap[opdName]) {
      opdMap[opdName] = { name: opdName, total: 0, pns: 0, pppk: 0 };
    }
    opdMap[opdName].total++;
    if (emp.statusAsn === 'PNS') opdMap[opdName].pns++;
    if (emp.statusAsn === 'PPPK') opdMap[opdName].pppk++;

    // Aggregate Retirement Year
    if (emp.retirementYear) {
      retirementYearMap[emp.retirementYear] = (retirementYearMap[emp.retirementYear] || 0) + 1;
    }

    // Aggregate Promotion Year
    if (emp.eligibleYear) {
      promotionYearMap[emp.eligibleYear] = (promotionYearMap[emp.eligibleYear] || 0) + 1;
    }
  });

  const jabatanList = Object.values(jabatanMap).sort((a, b) => b.total - a.total);
  const opdList = Object.values(opdMap).sort((a, b) => b.total - a.total);

  return {
    totalPegawai,
    totalPNS,
    totalPPPK,
    totalMale,
    totalFemale,
    totalBup60,
    totalBup58,
    totalEligiblePromotion,
    totalRetiringIn3Years,
    jabatanList,
    opdList,
    retirementYearMap,
    promotionYearMap
  };
}

function getEmptyStats() {
  return {
    totalPegawai: 0,
    totalPNS: 0,
    totalPPPK: 0,
    totalMale: 0,
    totalFemale: 0,
    totalBup60: 0,
    totalBup58: 0,
    totalEligiblePromotion: 0,
    totalRetiringIn3Years: 0,
    jabatanList: [],
    opdList: [],
    retirementYearMap: {},
    promotionYearMap: {}
  };
}
