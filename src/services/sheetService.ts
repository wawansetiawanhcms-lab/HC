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

export function parseHistoryFromRjab(
  rawRjab: any[][],
  employeeName: string,
  historyTitles: string[]
): HistoryItem[] {
  if (!rawRjab || rawRjab.length === 0 || !historyTitles || historyTitles.length === 0) return [];

  const rjabRows = rawRjab.filter(r =>
    r.some(c => String(c).toLowerCase().includes(employeeName.toLowerCase()))
  );

  const detailData: HistoryItem[] = [];

  historyTitles.forEach(jabatan => {
    let unit = '-';
    let startDate = '-';
    let endDate = '-';

    const matched =
      rjabRows.find(r => r.some(c => String(c).trim() === jabatan.trim())) ||
      rjabRows.find(r => r.some(c => String(c).toLowerCase().includes(jabatan.toLowerCase())));

    if (matched) {
      unit = String(matched[6] || '-');
      startDate = String(matched[10] || '-');
      endDate = String(matched[11] || '-');
    }

    detailData.push({ jabatan, unit, startDate, endDate });
  });

  const parseDate = (d: string) => {
    if (!d || d === '-') return 0;
    const p = String(d).trim().split(/[-/]/);
    if (p.length === 3) {
      if (p[2].length === 4) return new Date(`${p[2]}-${p[1]}-${p[0]}T00:00:00`).getTime();
      if (p[0].length === 4) return new Date(`${p[0]}-${p[1]}-${p[2]}T00:00:00`).getTime();
    }
    const parsed = Date.parse(d);
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
