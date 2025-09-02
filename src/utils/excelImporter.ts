import * as XLSX from 'xlsx';

export interface ImportedClient {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  ssn?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  gender?: string;
  ethnicity?: string;
  veteranStatus?: boolean;
  disabilityStatus?: boolean;
  housingStatus?: string;
  incomeSource?: string;
  monthlyIncome?: number;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalConditions?: string;
  medications?: string;
  mentalHealthStatus?: string;
  substanceUseHistory?: string;
  lastServiceDate?: Date;
  caseNotes?: string;
  [key: string]: any; // For any additional fields
}

export const readExcelFile = (filePath: string): ImportedClient[] => {
  try {
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    
    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      raw: false,
      dateNF: 'MM/DD/YYYY'
    });
    
    console.log('Excel file headers:', Object.keys(jsonData[0] || {}));
    console.log('Total records found:', jsonData.length);
    console.log('Sample record:', jsonData[0]);
    
    return jsonData as ImportedClient[];
  } catch (error) {
    console.error('Error reading Excel file:', error);
    return [];
  }
};

export const analyzeExcelData = (data: ImportedClient[]) => {
  if (data.length === 0) return null;
  
  // Get all unique field names
  const allFields = new Set<string>();
  data.forEach(row => {
    Object.keys(row).forEach(key => allFields.add(key));
  });
  
  // Analyze field completeness
  const fieldAnalysis: { [key: string]: number } = {};
  allFields.forEach(field => {
    const filledCount = data.filter(row => row[field] && row[field] !== '').length;
    fieldAnalysis[field] = (filledCount / data.length) * 100;
  });
  
  return {
    totalRecords: data.length,
    fields: Array.from(allFields),
    fieldCompleteness: fieldAnalysis,
    sampleData: data.slice(0, 3)
  };
};