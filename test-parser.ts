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
