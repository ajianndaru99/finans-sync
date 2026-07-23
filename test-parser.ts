import { GenericBankParser } from './app/lib/utils/bankParser';

const parser = new GenericBankParser();

const testCases = [
  {
    name: 'BCA Debit',
    sender: 'notifikasi@klikbca.com',
    html: '<p>Transfer keluar: Rp 500.000,00 ke Budi</p>',
  },
  {
    name: 'Mandiri Credit',
    sender: 'notifikasi@bankmandiri.co.id',
    html: '<p>Penerimaan sebesar Rp 1.500.000 dari Alice</p>',
  },
  {
    name: 'Jago Credit',
    sender: 'no-reply@jago.com',
    html: '<p>Kamu telah menerima uang Rp 200.000 untuk patungan</p>',
  },
  {
    name: 'Jago Debit',
    sender: 'no-reply@jago.com',
    html: '<p>Kamu baru saja mengirim uang Rp 50.000 ke Jajan</p>',
  },
  {
    name: 'BPD DIY Credit',
    sender: 'no-reply@bpddiy.co.id',
    html: '<p>Ada uang masuk Rp 100.000 dengan keterangan: Uang jajan</p>',
  },
  {
    name: 'BTN Debit',
    sender: 'notifikasi@btn.co.id',
    html: '<p>Transaksi debet Rp 50.000 keterangan: Tarik Tunai</p>',
  },
  {
    name: 'FLIP Credit',
    sender: 'no-reply@flip.id',
    html: '<p>Hore! Berhasil menerima Rp 150.000 dari temanmu.</p>',
  },
  {
    name: 'ShopeePay Credit',
    sender: 'info@shopee.co.id',
    html: '<p>Top up ShopeePay sebesar Rp 200.000 berhasil diisi.</p>',
  },
  {
    name: 'DANA Debit',
    sender: 'care@dana.id',
    html: '<p>Pembayaran ke Tokopedia sebesar Rp 75.000 berhasil.</p>',
  },
  {
    name: 'GoPay Credit',
    sender: 'no-reply@gojek.com',
    html: '<p>Isi saldo GoPay Rp 100.000 berhasil.</p>',
  },
  {
    name: 'OVO Debit',
    sender: 'no-reply@ovo.id',
    html: '<p>Pembayaran Rp 40.000 di merchant Kopi Kenangan berhasil.</p>',
  },
  {
    name: 'SeaBank Credit',
    sender: 'no-reply@seabank.co.id',
    html: '<p>Uang masuk Rp 500.000 dari PT Maju Mundur.</p>',
  },
  {
    name: 'AstraPay Debit',
    sender: 'info@astrapay.com',
    html: '<p>Pembayaran sebesar Rp 150.000 di merchant bengkel AHASS.</p>',
  },
  {
    name: 'GitHub "Jebakan" (Bukan Notifikasi Bank)',
    sender: 'noreply@github.com',
    html: '<p>A third-party OAuth application has been added... rp3 db</p>',
  },
  {
    name: 'Email Pribadi Testing (HARUS DITOLAK SEKARANG)',
    sender: 'pribadi@gmail.com',
    html: 'Ini email testing bpd diy ya: Ada uang masuk Rp 500.000 dengan keterangan: Hadiah Ulang Tahun',
  }
];

console.log('--- MENGUJI BANK PARSER ---\n');

testCases.forEach((tc) => {
  try {
    const result = parser.parse(tc.html, tc.sender);
    console.log(`[${tc.name}]`);
    console.log(`  Email: ${tc.sender}`);
    console.log(`  Teks: ${tc.html}`);
    console.log(`  Hasil Parser:`, result);
    console.log('--------------------------------------------------');
  } catch (error: any) {
    console.log(`[${tc.name}] ERROR:`, error.message);
  }
});
