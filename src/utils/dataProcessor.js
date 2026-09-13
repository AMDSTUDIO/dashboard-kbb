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

export function determineTargetPangkat(golonganStr, jabatanStr) {
  const gol = (golonganStr || '').toUpperCase().trim();
  const jab = (jabatanStr || '').toUpperCase().trim();

  // Next rank calculation by current Golongan (Roman numeral / standard notation)
  if (gol.includes('IV/E') || gol.includes('4/E')) return 'IV/e (Puncak)';
  if (gol.includes('IV/D') || gol.includes('4/D')) return 'IV/e';
  if (gol.includes('IV/C') || gol.includes('4/C')) return 'IV/d';
  if (gol.includes('IV/B') || gol.includes('4/B')) return 'IV/c';
  if (gol.includes('IV/A') || gol.includes('4/A')) return 'IV/b';

  if (gol.includes('III/D') || gol.includes('3/D')) return 'IV/a';
  if (gol.includes('III/C') || gol.includes('3/C')) return 'III/d';
  if (gol.includes('III/B') || gol.includes('3/B')) return 'III/c';
  if (gol.includes('III/A') || gol.includes('3/A')) return 'III/b';

  if (gol.includes('II/D') || gol.includes('2/D')) return 'III/a';
  if (gol.includes('II/C') || gol.includes('2/C')) return 'II/d';
  if (gol.includes('II/B') || gol.includes('2/B')) return 'II/c';
  if (gol.includes('II/A') || gol.includes('2/A')) return 'II/b';

  if (gol.includes('I/D') || gol.includes('1/D')) return 'II/a';
  if (gol.includes('I/C') || gol.includes('1/C')) return 'I/d';
  if (gol.includes('I/B') || gol.includes('1/B')) return 'I/c';
  if (gol.includes('I/A') || gol.includes('1/A')) return 'I/b';

  // Fallback by Jabatan string if Golongan string is unparsed
  if (jab.includes('PEMULA')) return 'II/b';
  if (jab.includes('TERAMPIL')) return 'II/d';
  if (jab.includes('MAHIR') || jab.includes('AHLI PERTAMA') || jab.includes('PERTAMA')) return 'III/b';
  if (jab.includes('PENYELIA') || jab.includes('AHLI MUDA') || jab.includes('MUDA')) return 'III/d';
  if (jab.includes('AHLI MADYA') || jab.includes('MADYA')) return 'IV/c';
  if (jab.includes('AHLI UTAMA') || jab.includes('UTAMA')) return 'IV/e';

  return 'III/b';
}

export function determineProyeksiType(golonganStr, targetPangkatStr) {
  const gol = (golonganStr || '').toUpperCase().trim();
  const target = (targetPangkatStr || '').toUpperCase().trim();

  // Check if rank transition jumps to next JF tier: II/a->II/b, II/d->III/a, III/b->III/c, III/d->IV/a, IV/c->IV/d
  if (
    (gol.includes('II/A') && target.includes('II/B')) ||
    (gol.includes('II/D') && target.includes('III/A')) ||
    (gol.includes('III/B') && target.includes('III/C')) ||
    (gol.includes('III/D') && target.includes('IV/A')) ||
    (gol.includes('IV/C') && target.includes('IV/D'))
  ) {
    return 'Naik Jenjang';
  }

  return 'Reguler';
}

export function determineKategoriJf(jabatanStr, golonganStr) {
  const jab = (jabatanStr || '').toUpperCase().trim();
  const gol = (golonganStr || '').toUpperCase().trim();

  if (jab.includes('PEMULA')) return { kategori: 'Keterampilan', jenjang: 'Pemula' };
  if (jab.includes('TERAMPIL')) return { kategori: 'Keterampilan', jenjang: 'Terampil' };
  if (jab.includes('MAHIR')) return { kategori: 'Keterampilan', jenjang: 'Mahir' };
  if (jab.includes('PENYELIA')) return { kategori: 'Keterampilan', jenjang: 'Penyelia' };

  if (jab.includes('AHLI PERTAMA') || jab.includes('PERTAMA')) return { kategori: 'Keahlian', jenjang: 'Ahli Pertama' };
  if (jab.includes('AHLI MUDA') || jab.includes('MUDA')) return { kategori: 'Keahlian', jenjang: 'Ahli Muda' };
  if (jab.includes('AHLI MADYA') || jab.includes('MADYA')) return { kategori: 'Keahlian', jenjang: 'Ahli Madya' };
  if (jab.includes('AHLI UTAMA') || jab.includes('UTAMA')) return { kategori: 'Keahlian', jenjang: 'Ahli Utama' };

  // Fallback by Golongan
  if (gol.includes('II/A')) return { kategori: 'Keterampilan', jenjang: 'Pemula' };
  if (gol.includes('II/')) return { kategori: 'Keterampilan', jenjang: 'Terampil' };
  if (gol.includes('III/A') || gol.includes('III/B')) return { kategori: 'Keahlian', jenjang: 'Ahli Pertama' };
  if (gol.includes('III/C') || gol.includes('III/D')) return { kategori: 'Keahlian', jenjang: 'Ahli Muda' };
  if (gol.includes('IV/A') || gol.includes('IV/B') || gol.includes('IV/C')) return { kategori: 'Keahlian', jenjang: 'Ahli Madya' };
  if (gol.includes('IV/D') || gol.includes('IV/E')) return { kategori: 'Keahlian', jenjang: 'Ahli Utama' };

  return { kategori: 'Umum', jenjang: 'Pelaksana' };
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

  // Naik Jenjang (Rule 4 Tahun & Target Pangkat & Proyeksi Type)
  const tmtYear = parseTmtYear(tmtPangkat);
  const eligibleYear = tmtYear ? tmtYear + 4 : null;
  const targetPangkat = determineTargetPangkat(golongan, jabatan);
  const proyeksiType = determineProyeksiType(golongan, targetPangkat);
  const jfInfo = determineKategoriJf(jabatan, golongan);
  const kategoriJf = jfInfo.kategori;
  const jenjangJf = jfInfo.jenjang;
  
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
    proyeksiType,
    kategoriJf,
    jenjangJf,
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
