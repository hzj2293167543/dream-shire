import { csvData } from './datas/data';
import { CSVData } from './types';

export function useExportFile() {
  const exportFile = (file: File, fileName: string) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  function downloadCSV(data: CSVData = csvData, filename = 'data.csv') {
    const csvContent = 'data:text/csv;charset=utf-8,' + data.map((row) => row.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // 示例数据

  //   downloadCSV(data);
  return { exportFile, downloadCSV };
}
