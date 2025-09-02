import { supabase } from '../lib/supabase'
import clientsData from '../clientsData.json'

export const migrateExistingData = async () => {
  try {
    console.log('Starting data migration...')
    
    // Transform the JSON data to match our database schema
    const transformedData = clientsData.map(client => {
      // Helper function to safely parse dates
      const parseDate = (dateStr: any) => {
        if (!dateStr || dateStr === 'Never' || dateStr === '') {
          return null;
        }
        try {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) {
            return null;
          }
          return date.toISOString().split('T')[0];
        } catch {
          return null;
        }
      };

      return {
        first_name: client['First Name'] || '',
        middle: client['Middle'] || '',
        last_name: client['Last Name'] || '',
        aka: client['AKA'] || '',
        gender: client['Gender'] || '',
        ethnicity: client['Ethnicity'] || '',
        age: client['Age'] || '',
        height: client['Height'] || '',
        weight: client['Weight'] || '',
        hair: client['Hair'] || '',
        eyes: client['Eyes'] || '',
        description: client['Description'] || '',
        notes: client['Notes'] || '',
        last_contact: parseDate(client['Last Contact']),
        contacts: parseInt(client['Contacts']) || 0,
        date_created: parseDate(client['Date Created']) || new Date().toISOString().split('T')[0]
      };
    })

    // Insert data in batches to avoid timeout
    const batchSize = 50
    for (let i = 0; i < transformedData.length; i += batchSize) {
      const batch = transformedData.slice(i, i + batchSize)
      
      const { data, error } = await supabase
        .from('clients')
        .insert(batch)
      
      if (error) {
        console.error('Error inserting batch:', error)
        throw error
      }
      
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}, records ${i + 1}-${Math.min(i + batchSize, transformedData.length)}`)
    }
    
    console.log('Data migration completed successfully!')
    return { success: true, count: transformedData.length }
    
  } catch (error) {
    console.error('Migration failed:', error)
    return { success: false, error }
  }
}