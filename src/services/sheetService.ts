import * as XLSX from 'xlsx';
import { Employee, FTKItem, FnpItem, HistoryItem, KalijabatItem, AnomaliItem, GradePivotRaw, BoxTalentItem, MonitoringFjItem } from '../types';

export const SHEET_ID = '1YIp30Qn6lugeDEDUvf3ZwPQTtVcYk7LJisUBfHtaFI8';

export async function hashPassword(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function fetchSheetJSON(sheetName: string): Promise<any[][]> {
  // If sheetName is 'data pegawai', the Google Sheets sheet UI filter often restricts gviz to ~90 rows (Metro only).
  // Using export?format=csv exports all 547 rows regardless of active UI filters.
  if (sheetName === 'data pegawai') {
    try {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
      const res = await fetch(csvUrl);
      if (res.ok) {
        const text = await res.text();
        const wb = XLSX.read(text, { type: 'string' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        if (rows && rows.length > 100) {
          return rows;
        }
      }
    } catch (err) {
      console.warn('Fallback csv export failed for data pegawai, trying gviz...', err);
    }
  }

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&headers=0&sheet=${encodeURIComponent(sheetName)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const text = await res.text();
    const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);/);
    if (match && match[1]) {
      const json = JSON.parse(match[1]);
      const rows: any[][] = [];
      const numCols = json.table.cols.length;

      json.table.rows.forEach((r: any) => {
        const rowData: any[] = [];
        for (let i = 0; i < numCols; i++) {
          const cell = r.c ? r.c[i] : null;
          rowData.push(cell ? (cell.f !== undefined && cell.f !== null ? cell.f : (cell.v !== undefined && cell.v !== null ? cell.v : '')) : '');
        }
        rows.push(rowData);
      });
      return rows;
    }
  } catch (err) {
    console.error(`Gagal mengambil data dari sheet: ${sheetName}`, err);
  }
  return [];
}

export function getColIdx(headers: any[], keyword: string, fallback: number): number {
  if (!headers) return fallback;
  const search = keyword.toLowerCase();
  for (let i = 0; i < headers.length; i++) {
    if (String(headers[i]).toLowerCase().includes(search)) return i;
  }
  return fallback;
}

export function parsePegawai(raw: any[][]): Employee[] {
  if (!raw || raw.length < 2) return [];
  const headers = raw[0];
  const rows = raw.slice(1);

  const idxNama = getColIdx(headers, 'nama', 1);
  const idxNip = getColIdx(headers, 'nip', 0);
  const idxJabatan = getColIdx(headers, 'jabatan', 3);
  const idxPend = getColIdx(headers, 'pendidikan', 5);
  const idxKelUsia = getColIdx(headers, 'kelompok usia', 6);
  const idxUnit = getColIdx(headers, 'kode ba', 11);
  const COL_L = 11;
  const COL_N = 13;
  const COL_P = 15;
  const COL_AL = 37;
  const COL_AQ = 42;

  const list: Employee[] = [];

  rows.forEach(r => {
    const nama = String(r[idxNama] || '').trim();
    if (!nama) return;

    const nip = String(r[idxNip] || r[1] || '').trim();
    const unit = String(r[idxUnit] || r[COL_L] || 'Unknown').trim();
    const jabatan = String(r[idxJabatan] || '-').trim();
    const pendidikan = String(r[idxPend] || 'Unknown').trim();
    const kelompokUsia = String(r[idxKelUsia] || 'Unknown').trim();
    const gender = String(r[COL_P] || '').trim();
    const usia = parseInt(r[COL_AL]) || 0;
    const unitKolomN = String(r[COL_N] || '').trim();

    let masaStr = '';
    const masaRaw = r[COL_AQ];
    if (masaRaw !== null && masaRaw !== undefined && masaRaw !== '') {
      masaStr = String(masaRaw).trim();
    }
    const masaNum = parseFloat(masaStr.replace(',', '.')) || 0;

    list.push({
      nama,
      nip,
      jabatan,
      unit,
      pendidikan,
      kelompokUsia,
      usia,
      masaJabatan: masaStr,
      masaJabatanNum: masaNum,
      gender,
      unitKolomN,
    });
  });

  return list;
}

export function parseFTK(raw: any[][]): FTKItem[] {
  if (!raw || raw.length < 2) return [];
  const items: FTKItem[] = [];

  for (let i = 1; i < raw.length; i++) {
    const row = raw[i];
    if (!row) continue;
    const unit = String(row[0] || '').trim();
    if (!unit) continue;

    const pagu = row[1] !== undefined ? row[1] : '-';
    const ftk = row[2] !== undefined ? row[2] : '-';
    const pct = row[3] !== undefined ? String(row[3]) : '-';
    const gap = row[4] !== undefined ? row[4] : '-';

    let pctNum = parseFloat(String(pct).replace('%', '').replace(',', '.'));
    if (isNaN(pctNum)) pctNum = 0;
    if (!String(pct).includes('%') && pctNum <= 1.5) {
      pctNum = pctNum * 100;
    }

    items.push({
      unit,
      pagu,
      ftk,
      pct,
      gap,
      pctNum: Math.round(pctNum * 10) / 10,
    });
  }

  return items;
}

export function parseTalentReady(raw: any[][]): FnpItem[] {
  if (!raw || raw.length < 2) return [];
  const items: FnpItem[] = [];

  for (let i = 1; i < raw.length; i++) {
    const row = raw[i];
    if (!row || !row[1]) continue;

    items.push({
      no: i,
      nama: String(row[1] || '-').trim(),
      nip: String(row[2] || '-').trim(),
      jabatanLama: String(row[3] || '-').trim(),
      jabatanSaatIni: String(row[4] || '-').trim(),
      jabatan: String(row[4] || '-').trim(),
      unit: String(row[5] || '-').trim(),
      jenjang: String(row[7] || '-').trim(),
      jenjangProyeksi: String(row[7] || '-').trim(),
      jabatanProyeksi: String(row[8] || '-').trim(),
      nilai: String(row[9] || '-').trim(),
      status: String(row[10] || '-').trim(),
      tanggal: String(row[11] || '-').trim(),
    });
  }

  return items;
}

export function parseKalijabat(raw: any[][]): KalijabatItem[] {
  if (!raw || raw.length < 2) return [];
  const items: KalijabatItem[] = [];
  const rows = raw.slice(1);
  const idxNama = 2;
  const idxUnit = 1;
  const idxJabatan = 3;
  const idxKali = 4;
  const historyStartIdx = 5;

  rows.forEach((r, idx) => {
    const nama = String(r[idxNama] || '').trim();
    if (!nama) return;

    const history: string[] = [];
    for (let i = historyStartIdx; i < r.length; i++) {
      const val = String(r[i] || '').trim();
      if (val && val.toLowerCase() !== 'null' && val !== '-') {
        history.push(val);
      }
    }

    items.push({
      no: idx + 1,
      nama,
      unit: String(r[idxUnit] || '-').trim(),
      jabatan: String(r[idxJabatan] || '-').trim(),
      kali: parseInt(r[idxKali]) || 0,
      history,
    });
  });

  return items;
}

function normalizeEmpName(str: string): string {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/[,.](st|mt|se|ir|mm|s\.t|s\.e|m\.t|m\.m|s\.kom|m\.kom)\b/gi, '')
    .replace(/[^a-z0-9 ]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatExcelDate(val: any): string {
  if (val === undefined || val === null) return '-';
  const str = String(val).trim();
  if (!str || str === 'null' || str === 'undefined' || str === '-') return '-';

  // Numeric Excel serial date (e.g. 44196, 44926)
  if (/^\d{5}(\.\d+)?$/.test(str)) {
    const num = parseFloat(str);
    const date = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
  }

  // Format ISO or YYYY-MM-DD to DD-MM-YYYY if needed
  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(str)) {
    const parts = str.split(/[-/.]/);
    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${day}-${month}-${year}`;
  }

  return str;
}

export function parseHistoryFromRjab(
  rawRjab: any[][],
  employeeName: string,
  historyTitles: string[],
  fallbackRjabs: any[][][] = [],
  defaultUnit: string = '-'
): HistoryItem[] {
  if ((!rawRjab || rawRjab.length === 0) && fallbackRjabs.length === 0) return [];
  if (!historyTitles || historyTitles.length === 0) return [];

  const allSheets = [rawRjab, ...fallbackRjabs].filter(s => Array.isArray(s) && s.length > 0);
  const normTarget = normalizeEmpName(employeeName);

  const detailData: HistoryItem[] = [];

  historyTitles.forEach((jabatan, index) => {
    const rawJabatan = String(jabatan || '').trim();
    if (!rawJabatan) return;

    // Remove trailing position ID like '-30218752' or ' 30218752'
    const idMatch = rawJabatan.match(/[-_ ]+(\d{6,10})$/);
    const posId = idMatch ? idMatch[1] : '';
    const cleanTitle = rawJabatan.replace(/[-_ ]+\d{6,10}$/, '').trim().toLowerCase();

    let unit = '-';
    let startDate = '-';
    let endDate = '-';
    let matched: any[] | undefined = undefined;

    for (const sheet of allSheets) {
      if (!sheet || sheet.length === 0) continue;

      let idxNama = -1;
      let idxJabatan = -1;
      let idxUnit = -1;
      let idxStart = -1;
      let idxEnd = -1;

      const headerRow = sheet[0] || [];
      headerRow.forEach((col: any, idx: number) => {
        const cStr = String(col || '').toLowerCase().trim();
        if ((cStr.includes('personnel number') || cStr.includes('nama pegawai') || cStr === 'nama') && idxNama === -1) idxNama = idx;
        if ((cStr.includes('nama panjang posisi') || cStr.includes('simkp') || cStr.includes('sebutan jabatan') || cStr.includes('nama jabatan') || cStr === 'position') && idxJabatan === -1) idxJabatan = idx;
        if ((cStr.includes('personnel subarea') || cStr.includes('business area') || cStr.includes('nama unit') || cStr.includes('unit')) && idxUnit === -1) idxUnit = idx;
        if ((cStr.includes('start') || cStr.includes('awal') || idx === 10) && idxStart === -1) idxStart = idx;
        if ((cStr.includes('end') || cStr.includes('akhir') || idx === 11) && idxEnd === -1) idxEnd = idx;
      });

      if (idxNama === -1) idxNama = 1;
      if (idxJabatan === -1) idxJabatan = 9;
      if (idxUnit === -1) idxUnit = 6;
      if (idxStart === -1) idxStart = 10;
      if (idxEnd === -1) idxEnd = 11;

      // Filter rows belonging strictly to the employee name column
      const exactMatches = normTarget ? sheet.filter(r => {
        if (!Array.isArray(r)) return false;
        const cellName = String(r[idxNama] !== undefined && r[idxNama] !== null ? r[idxNama] : (r[1] || r[2] || '')).trim();
        const normCell = normalizeEmpName(cellName);
        return normCell === normTarget;
      }) : [];

      const rjabRows = exactMatches.length > 0 ? exactMatches : (normTarget ? sheet.filter(r => {
        if (!Array.isArray(r)) return false;
        const cellName = String(r[idxNama] !== undefined && r[idxNama] !== null ? r[idxNama] : (r[1] || r[2] || '')).trim();
        const normCell = normalizeEmpName(cellName);
        if (!normCell) return false;
        const wordsCell = normCell.split(' ').sort().join(' ');
        const wordsTarget = normTarget.split(' ').sort().join(' ');
        return wordsCell === wordsTarget;
      }) : []);

      if (rjabRows.length > 0) {
        // Try matching jabatan within employee's rows
        matched = rjabRows.find(r => {
          return r.some(c => {
            const val = String(c || '').trim().toLowerCase();
            if (!val) return false;
            if (val === rawJabatan.toLowerCase()) return true;
            if (cleanTitle && val === cleanTitle) return true;
            if (posId && val.includes(posId)) return true;
            if (cleanTitle && cleanTitle.length > 4 && val.includes(cleanTitle)) return true;
            if (cleanTitle && cleanTitle.length > 4 && cleanTitle.includes(val) && val.length > 8) return true;
            return false;
          });
        });

        // Fallback to row index if title search doesn't find a direct match
        if (!matched && rjabRows[index]) {
          matched = rjabRows[index];
        }
      }

      // If still not matched, try searching whole sheet for posId (position ID like 30144288)
      if (!matched && posId && posId.length >= 6) {
        matched = sheet.find(r => Array.isArray(r) && r.some(c => String(c || '').includes(posId)));
      }

      if (matched) {
        const colJabatan = String(matched[9] !== undefined && matched[9] !== null && String(matched[9]).trim() !== '' ? matched[9] : (matched[8] || matched[idxJabatan] || rawJabatan)).trim();
        let colUnit = String(matched[6] !== undefined && matched[6] !== null && String(matched[6]).trim() !== '' && String(matched[6]).trim() !== String(matched[4]).trim() ? matched[6] : (matched[5] || matched[7] || matched[idxUnit] || '')).trim();
        const colStart = matched[idxStart] !== undefined && matched[idxStart] !== null && String(matched[idxStart]).trim() !== '' ? matched[idxStart] : matched[10];
        const colEnd = matched[idxEnd] !== undefined && matched[idxEnd] !== null && String(matched[idxEnd]).trim() !== '' ? matched[idxEnd] : matched[11];

        unit = colUnit && colUnit !== 'null' && colUnit !== 'undefined' && colUnit !== '-' ? colUnit : defaultUnit;
        startDate = formatExcelDate(colStart);
        endDate = formatExcelDate(colEnd);

        detailData.push({
          namaPegawai: employeeName,
          jabatan: colJabatan && colJabatan !== 'null' ? colJabatan : rawJabatan,
          unit: unit !== '-' && unit !== 'null' ? unit : defaultUnit,
          startDate: startDate || '-',
          endDate: endDate || '-',
        });
        break;
      }
    }
  });

  const parseDate = (d: string): number => {
    if (!d || d === '-' || d === 'null' || d === 'undefined') return 0;
    const s = String(d).trim();
    if (!s || s === '-') return 0;

    // Numeric Excel serial date (e.g. 44196, 44926)
    if (/^\d{5}(\.\d+)?$/.test(s)) {
      const num = parseFloat(s);
      const date = new Date(Math.round((num - 25569) * 86400 * 1000));
      return isNaN(date.getTime()) ? 0 : date.getTime();
    }

    const months: { [key: string]: number } = {
      jan: 1, januari: 1, feb: 2, februari: 2, mar: 3, maret: 3, apr: 4, april: 4,
      mei: 5, jun: 6, juni: 6, jul: 7, juli: 7, agu: 8, agustus: 8, sep: 9, september: 9,
      okt: 10, oktober: 10, nov: 11, november: 11, des: 12, desember: 12
    };

    const clean = s.toLowerCase();
    for (const [mName, mNum] of Object.entries(months)) {
      if (clean.includes(mName)) {
        const yearMatch = clean.match(/\b(19\d\d|20\d\d)\b/);
        if (yearMatch) {
          const year = parseInt(yearMatch[1]);
          const dayMatch = clean.match(/\b([0-2]?\d|3[01])\b/);
          const day = dayMatch ? parseInt(dayMatch[1]) : 1;
          return new Date(year, mNum - 1, day).getTime();
        }
      }
    }

    const p = s.split(/[-/. ]+/);

    if (p.length === 3) {
      if (/^\d{4}$/.test(p[2])) {
        const year = parseInt(p[2]);
        const month = parseInt(p[1]) || 1;
        const day = parseInt(p[0]) || 1;
        return new Date(year, month - 1, day).getTime();
      }
      if (/^\d{4}$/.test(p[0])) {
        const year = parseInt(p[0]);
        const month = parseInt(p[1]) || 1;
        const day = parseInt(p[2]) || 1;
        return new Date(year, month - 1, day).getTime();
      }
    }

    if (p.length === 2) {
      if (/^\d{4}$/.test(p[1])) {
        const year = parseInt(p[1]);
        const month = parseInt(p[0]) || 1;
        return new Date(year, month - 1, 1).getTime();
      }
      if (/^\d{4}$/.test(p[0])) {
        const year = parseInt(p[0]);
        const month = parseInt(p[1]) || 1;
        return new Date(year, month - 1, 1).getTime();
      }
    }

    const yearMatch = s.match(/\b(19\d\d|20\d\d)\b/);
    if (yearMatch) {
      return new Date(parseInt(yearMatch[1]), 0, 1).getTime();
    }

    const parsed = Date.parse(s);
    return isNaN(parsed) ? 0 : parsed;
  };

  detailData.sort((a, b) => {
    const timeA = parseDate(a.startDate);
    const timeB = parseDate(b.startDate);
    if (timeA > 0 && timeB > 0) {
      return timeB - timeA; // Descending by start date
    }
    if (timeA > 0) return -1;
    if (timeB > 0) return 1;
    return 0;
  });

  return detailData.map((d, index) => ({
    ...d,
    urutan: index + 1,
  }));
}

export function parseHistoryDirectFromRjab(
  rawRjab: any[][],
  employeeName: string,
  fallbackRjabs: any[][][] = []
): HistoryItem[] {
  if ((!rawRjab || rawRjab.length === 0) && fallbackRjabs.length === 0) return [];
  const normTarget = normalizeEmpName(employeeName);
  if (!normTarget) return [];

  const allSheets = [rawRjab, ...fallbackRjabs].filter(s => Array.isArray(s) && s.length > 0);

  let targetRows: any[] = [];
  let targetSheet: any[][] | null = null;

  for (const sheet of allSheets) {
    if (!sheet || sheet.length === 0) continue;

    let idxNama = -1;
    let idxJabatan = -1;
    let idxUnit = -1;
    let idxStart = -1;
    let idxEnd = -1;

    const headerRow = sheet[0] || [];
    headerRow.forEach((col: any, idx: number) => {
      const cStr = String(col || '').toLowerCase().trim();
      if ((cStr.includes('personnel number') || cStr.includes('nama pegawai') || cStr === 'nama') && idxNama === -1) idxNama = idx;
      if ((cStr.includes('nama panjang posisi') || cStr.includes('simkp') || cStr.includes('sebutan jabatan') || cStr.includes('nama jabatan') || cStr === 'position') && idxJabatan === -1) idxJabatan = idx;
      if ((cStr.includes('personnel subarea') || cStr.includes('business area') || cStr.includes('nama unit') || cStr.includes('unit')) && idxUnit === -1) idxUnit = idx;
      if ((cStr.includes('start') || cStr.includes('awal') || idx === 10) && idxStart === -1) idxStart = idx;
      if ((cStr.includes('end') || cStr.includes('akhir') || idx === 11) && idxEnd === -1) idxEnd = idx;
    });

    if (idxNama === -1) idxNama = 1;
    if (idxJabatan === -1) idxJabatan = 9;
    if (idxUnit === -1) idxUnit = 6;
    if (idxStart === -1) idxStart = 10;
    if (idxEnd === -1) idxEnd = 11;

    const exactMatches = sheet.filter(r => {
      if (!Array.isArray(r)) return false;
      const cellName = String(r[idxNama] !== undefined && r[idxNama] !== null ? r[idxNama] : (r[1] || r[2] || '')).trim();
      const normCell = normalizeEmpName(cellName);
      return normCell === normTarget;
    });

    if (exactMatches.length > 0) {
      targetRows = exactMatches;
      targetSheet = sheet;
      break;
    }

    const wordMatches = sheet.filter(r => {
      if (!Array.isArray(r)) return false;
      const cellName = String(r[idxNama] !== undefined && r[idxNama] !== null ? r[idxNama] : (r[1] || r[2] || '')).trim();
      const normCell = normalizeEmpName(cellName);
      if (!normCell) return false;
      const wordsCell = normCell.split(' ').sort().join(' ');
      const wordsTarget = normTarget.split(' ').sort().join(' ');
      return wordsCell === wordsTarget;
    });

    if (wordMatches.length > 0) {
      targetRows = wordMatches;
      targetSheet = sheet;
      break;
    }
  }

  if (targetRows.length === 0 || !targetSheet) return [];

  // Determine dynamic column indices for targetSheet
  let idxNama = -1;
  let idxJabatan = -1;
  let idxUnit = -1;
  let idxStart = -1;
  let idxEnd = -1;

  const headerRow = targetSheet[0] || [];
  headerRow.forEach((col: any, idx: number) => {
    const cStr = String(col || '').toLowerCase().trim();
    if ((cStr.includes('personnel number') || cStr.includes('nama pegawai') || cStr === 'nama') && idxNama === -1) idxNama = idx;
    if ((cStr.includes('nama panjang posisi') || cStr.includes('simkp') || cStr.includes('sebutan jabatan') || cStr.includes('nama jabatan') || cStr === 'position') && idxJabatan === -1) idxJabatan = idx;
    if ((cStr.includes('personnel subarea') || cStr.includes('business area') || cStr.includes('nama unit') || cStr.includes('unit')) && idxUnit === -1) idxUnit = idx;
    if ((cStr.includes('start') || cStr.includes('awal') || idx === 10) && idxStart === -1) idxStart = idx;
    if ((cStr.includes('end') || cStr.includes('akhir') || idx === 11) && idxEnd === -1) idxEnd = idx;
  });

  if (idxNama === -1) idxNama = 1;
  if (idxJabatan === -1) idxJabatan = 9;
  if (idxUnit === -1) idxUnit = 6;
  if (idxStart === -1) idxStart = 10;
  if (idxEnd === -1) idxEnd = 11;

  const detailData: HistoryItem[] = [];

  targetRows.forEach(r => {
    let rawJabatan = String(r[9] !== undefined && r[9] !== null && String(r[9]).trim() !== '' ? r[9] : (r[8] || r[idxJabatan] || '')).trim();
    let rawUnitVal = String(r[6] !== undefined && r[6] !== null && String(r[6]).trim() !== '' && String(r[6]).trim() !== String(r[4]).trim() ? r[6] : (r[5] || r[7] || r[idxUnit] || '')).trim();

    const rawStartVal = r[idxStart] !== undefined && r[idxStart] !== null && String(r[idxStart]).trim() !== '' ? r[idxStart] : r[10];
    const rawEndVal = r[idxEnd] !== undefined && r[idxEnd] !== null && String(r[idxEnd]).trim() !== '' ? r[idxEnd] : r[11];

    // Skip header or non-position rows
    if (!rawJabatan || rawJabatan.toLowerCase().includes('personnel number') || rawJabatan.toLowerCase().includes('nama panjang posisi') || rawJabatan.toLowerCase().includes('sebutan jabatan')) {
      return;
    }

    detailData.push({
      namaPegawai: employeeName,
      jabatan: rawJabatan,
      unit: rawUnitVal && rawUnitVal !== 'null' && rawUnitVal !== 'undefined' ? rawUnitVal : '-',
      startDate: formatExcelDate(rawStartVal),
      endDate: formatExcelDate(rawEndVal),
    });
  });

  const parseDate = (d: string) => {
    if (!d || d === '-' || d === 'null' || d === 'undefined') return 0;
    const s = String(d).trim();
    const p = s.split(/[-/.]/);
    if (p.length === 3) {
      if (p[2].length === 4) return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0])).getTime();
      if (p[0].length === 4) return new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2])).getTime();
    }
    const parsed = Date.parse(s);
    return isNaN(parsed) ? 0 : parsed;
  };

  detailData.sort((a, b) => parseDate(b.startDate) - parseDate(a.startDate));

  return detailData.map((d, index) => ({
    ...d,
    urutan: index + 1,
  }));
}

export function parseAnomali(raw: any[][]): AnomaliItem[] {
  if (!raw || raw.length < 2) return [];
  const headers = raw[0];
  const rows = raw.slice(1);
  const idxNip = getColIdx(headers, 'nip', 0);
  const idxNama = getColIdx(headers, 'nama', 1);
  const idxJabatan = getColIdx(headers, 'jabatan', 2);
  const idxPeg = 3;
  const idxPog = 4;
  const idxFilter = 5;

  const items: AnomaliItem[] = [];
  let count = 0;

  rows.forEach(r => {
    const isFiltered = String(r[idxFilter] || '').trim().toLowerCase() === 'true';
    if (isFiltered) {
      count++;
      items.push({
        no: count,
        nip: String(r[idxNip] || '-'),
        nama: String(r[idxNama] || '-'),
        peg: String(r[idxPeg] || '-'),
        pog: String(r[idxPog] || '-'),
        jabatan: String(r[idxJabatan] || '-'),
        isFiltered: true,
      });
    }
  });

  return items;
}

export function parseGradeRaw(raw: any[][]): GradePivotRaw[] {
  if (!raw || raw.length < 2) return [];
  const rows = raw.slice(1);
  const list: GradePivotRaw[] = [];

  rows.forEach(r => {
    list.push({
      nip: String(r[0] || ''),
      nama: String(r[1] || ''),
      jabatan: String(r[2] || ''),
      gradePegawai: String(r[3] || '(Kosong)').trim(),
      posisiGrade: String(r[4] || '(Kosong)').trim(),
      filterAnomaly: String(r[5] || ''),
      kategoriH: String(r[7] || '').trim(),
      kategoriTab: String(r[11] || '').trim(),
      gradeLevel: String(r[12] || '(Kosong)').trim(),
      countVal: String(r[1] || '').trim(),
    });
  });

  return list;
}

export function parseBoxTalent(raw: any[][]): BoxTalentItem[] {
  if (!raw || raw.length < 2) return [];
  const rows = raw.slice(1);
  const items: BoxTalentItem[] = [];

  rows.forEach((r, idx) => {
    const nip = String(r[2] || '').trim();
    const nama = String(r[3] || '').trim();
    if (!nip && !nama) return;

    items.push({
      no: idx + 1,
      profesi: String(r[0] || '-').trim(),
      nip: nip || '-',
      nama: nama || '-',
      unit: String(r[5] || r[4] || '-').trim(),
      jabatan: String(r[9] || '-').trim(),
      boxNo: String(r[15] || '-').trim(),
      boxName: String(r[16] || '-').trim(),
    });
  });

  return items;
}

export function parsePaguFjTJ(raw: any[][]): MonitoringFjItem[] {
  if (!raw || raw.length === 0) return [];
  const items: MonitoringFjItem[] = [];
  let count = 0;

  raw.forEach(r => {
    if (!r) return;
    const jabatan = r[1] ? String(r[1]).trim() : '';
    const jenjang = r[2] ? String(r[2]).trim() : '';
    const unit = r[3] ? String(r[3]).trim() : '';
    const ftk = r[4] !== null && r[4] !== undefined ? String(r[4]).trim() : '0';
    const realisasi = r[5] !== null && r[5] !== undefined ? String(r[5]).trim() : '0';
    const gap = r[6] !== null && r[6] !== undefined ? String(r[6]).trim() : '0';

    if (!jabatan || jabatan.toLowerCase().includes('sebutan jabatan') || unit.toLowerCase() === 'nama unit') {
      return;
    }

    count++;
    items.push({
      no: count,
      jabatan: jabatan || '-',
      jenjang: jenjang || '-',
      unit: unit || '-',
      ftk: ftk === '' ? '0' : ftk,
      realisasi: realisasi === '' ? '0' : realisasi,
      gap: gap === '' ? '0' : gap,
    });
  });

  return items;
}

export function exportToExcel(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: (string | number)[][]
) {
  try {
    const data = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
    return true;
  } catch (err) {
    console.error('Export Excel failed:', err);
    return false;
  }
}
