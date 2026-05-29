# BatchNexus Control Tower

![BatchNexus](https://img.shields.io/badge/Status-Hackathon_Ready-success?style=for-the-badge) ![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js) ![AI Copilot](https://img.shields.io/badge/AI_Powered-Groq_Llama_3-blue?style=for-the-badge)

BatchNexus adalah platform Enterprise-grade untuk manajemen rantai pasok (Supply Chain Management) komprehensif, dibangun khusus untuk studi kasus operasional manufaktur (seperti Sima Arôme). Platform ini menjembatani gap antara penerimaan material, kontrol kualitas (QC), penjadwalan produksi (PPIC), hingga pengiriman logistik (Dispatch), dengan dukungan asisten AI terintegrasi.

## 🌟 Fitur Utama (End-to-End Workflow)

BatchNexus telah dilengkapi dengan alur operasional 100% fungsional (bukan sekadar UI Mockup):

1. **Inbound Intake:** Penerimaan bahan baku dengan dukungan AI Document Extraction.
2. **QC Station:** Modul Quality Control komprehensif untuk meluluskan/menolak material, lengkap dengan checklist dan perhitungan skor kualitas (AI Scoring).
3. **PPIC Board (Kanban):** Papan kontrol interaktif (Drag-and-Drop) untuk penjadwalan produksi batch. Termasuk fitur **AI Copilot Apply** untuk otomatisasi pemindahan antrean prioritas.
4. **Lot Traceability:** Pelacakan genealogy batch material dari hulu ke hilir.
5. **Smart Warehouse:** Manajemen rak/gudang pintar dengan algoritma slotting otomatis berdasarkan kompatibilitas bahan kimia (Hazard checking).
6. **Sample Dispatch:** Modul pengiriman sampel lot yang telah rilis ke klien lokal maupun ekspor.

## 🛠 Tech Stack

- **Frontend:** Next.js 16 (App Router), React, Tailwind CSS
- **Backend/Database:** Buildpad Data-as-a-Service (DaaS)
- **Artificial Intelligence:** Groq Llama-3 (Document Intake, QC Scoring, Summary Reports)
- **Design System:** Material Design 3 (M3) dengan dukungan Dark Mode

## 🚀 Cara Menjalankan di Lokal

1. **Clone repository ini**
   ```bash
   git clone https://github.com/Arkanzahir/batchnexus.git
   cd batchnexus
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set Environment Variables**
   Pastikan file `.env.local` memiliki kredensial API DaaS Buildpad dan Groq API Key.
   ```env
   NEXT_PUBLIC_BUILDPAD_DAAS_URL=https://daas.buildpad.io/v1
   GROQ_API_KEY=gsk_your_api_key_here
   ```

4. **Jalankan Development Server**
   ```bash
   pnpm dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000`.

## 📈 Alur Demo Hackathon

1. Buka **Inbound Intake**, tunjukkan proses OCR dokumen dari supplier.
2. Buka **QC Station**, pilih material dan berikan persetujuan hingga *Lot Number* terbentuk.
3. Masuk ke **PPIC Board**, tunjukkan pembuatan Batch Baru dan fitur AI memindahkan *card* ke tahapan *Ready*.
4. Buka **Warehouse**, demonstrasikan rak pintar (*Smart Slotting*).
5. Buka **Dispatch**, buat jadwal pengiriman baru untuk Lot yang sudah jadi.

---
*Dibuat untuk kebutuhan CyberHack.*
