export interface Employee {
  nama: string;
  nip?: string;
  jabatan: string;
  unit: string;
  kodeBa?: string;
  pendidikan: string;
  kelompokUsia: string;
  usia: number;
  masaJabatan: string;
  masaJabatanNum: number;
  gender: string;
  unitKolomN?: string;
}

export interface FTKItem {
  unit: string;
  pagu: string | number;
  ftk: string | number;
  pct: string;
  gap: string | number;
  pctNum: number;
}

export interface FnpItem {
  no?: number;
  nip: string;
  nama: string;
  jabatan: string;
  jabatanLama?: string;
  jabatanSaatIni?: string;
  unit: string;
  jenjang: string;
  jenjangProyeksi?: string;
  jabatanProyeksi: string;
  nilai: string;
  status: string;
  tanggal: string;
}

export interface HistoryItem {
  urutan?: number;
  jabatan: string;
  unit: string;
  startDate: string;
  endDate: string;
}

export interface KalijabatItem {
  no: number;
  nama: string;
  unit: string;
  jabatan: string;
  kali: number;
  history: string[];
}

export interface AnomaliItem {
  no: number;
  nip: string;
  nama: string;
  peg: string;
  pog: string;
  jabatan: string;
  isFiltered: boolean;
}

export interface GradePivotRaw {
  nip: string;
  nama: string;
  jabatan: string;
  gradePegawai: string; // Column D (Index 3)
  posisiGrade: string;  // Column E (Index 4)
  filterAnomaly: string; // Column F (Index 5)
  kategoriH: string;    // Column H (Index 7)
  kategoriTab: string;  // Column L (Index 11) - Generalis / Fungsional / Struktural
  gradeLevel: string;   // Column M (Index 12)
  countVal: string;     // Column B (Index 1)
}

export interface BoxTalentItem {
  no?: number;
  nip: string;
  nama: string;
  unit: string;
  jabatan: string;
  boxNo: string;
  boxName: string;
  profesi: string;
}

export interface MonitoringFjItem {
  no?: number;
  jabatan: string;
  jenjang: string;
  unit: string;
  ftk: string | number;
  realisasi: string | number;
  gap: string | number;
}

export type PageId =
  | 'dashboard'
  | 'mobility'
  | 'ftk'
  | 'fnp'
  | 'grade'
  | 'kalijabat'
  | 'kalijabata'
  | 'kalijabatpu'
  | 'kalijabatmdnpu'
  | 'pegpog'
  | 'setting'
  | 'dashboard-tjk'
  | 'ftk-tjk'
  | 'monitoringfj-tjk'
  | 'assesment-tjk'
  | 'lamajabat-tjk'
  | 'kalijabat-tjk'
  | 'box-tjk'
  | 'dashboard-mtr'
  | 'ftk-mtr'
  | 'monitoringfj-mtr'
  | 'assesment-mtr'
  | 'lamajabat-mtr'
  | 'kalijabat-mtr'
  | 'box-mtr'
  | 'dashboard-ktb'
  | 'ftk-ktb'
  | 'monitoringfj-ktb'
  | 'assesment-ktb'
  | 'lamajabat-ktb'
  | 'kalijabat-ktb'
  | 'box-ktb'
  | 'dashboard-psw'
  | 'ftk-psw'
  | 'monitoringfj-psw'
  | 'assesment-psw'
  | 'lamajabat-psw'
  | 'kalijabat-psw'
  | 'box-psw'
  | 'dashboard-up2k'
  | 'ftk-up2k'
  | 'assesment-up2k'
  | 'lamajabat-up2k'
  | 'kalijabat-up2k'
  | 'box-up2k'
  | 'dashboard-up2d'
  | 'ftk-up2d'
  | 'assesment-up2d'
  | 'lamajabat-up2d'
  | 'kalijabat-up2d'
  | 'box-up2d';

export type UserRole =
  | 'admin'
  | 'managertjk'
  | 'managermtr'
  | 'managerktb'
  | 'managerpsw'
  | 'managerup2k'
  | 'managerup2d'
  | 'user';
