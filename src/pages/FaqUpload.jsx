import { useState } from 'react';
import * as XLSX from 'xlsx';
import api from '../services/api';

export default function FaqUpload() {
  const [loading, setLoading] = useState(false);

  const handleFile = async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    setLoading(true);

    try {

      const buffer = await file.arrayBuffer();

      const workbook = XLSX.read(buffer);

      const sheet =
        workbook.Sheets[workbook.SheetNames[0]];

      const rows =
        XLSX.utils.sheet_to_json(sheet);

      const res = await api.post(
        '/api/faqs/import',
        { rows }
      );

      alert(
        `${res.data.imported} FAQs imported`
      );

    } catch (err) {
      alert('Upload failed');
    }

    setLoading(false);
  };

  return (
    <div>
      <h2>FAQ Upload</h2>

      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFile}
      />

      {loading && <p>Uploading...</p>}
    </div>
  );
}