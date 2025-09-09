import { SupabaseClient } from '../hooks/useClients';

export interface DuplicateGroup {
  clients: SupabaseClient[];
  matchReason: string[];
  confidence: 'high' | 'medium' | 'low';
}

// Normalize strings for comparison
const normalize = (str: string): string => {
  return str?.toLowerCase().trim().replace(/[^a-z0-9]/g, '') || '';
};

// Calculate Levenshtein distance for fuzzy matching
const levenshteinDistance = (str1: string, str2: string): number => {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + 1
        );
      }
    }
  }
  return dp[m][n];
};

// Check if two names are similar
const areNamesSimilar = (name1: string, name2: string, threshold: number = 2): boolean => {
  const n1 = normalize(name1);
  const n2 = normalize(name2);
  
  if (!n1 || !n2) return false;
  if (n1 === n2) return true;
  
  // Check if one name contains the other (for nicknames)
  if (n1.includes(n2) || n2.includes(n1)) return true;
  
  // Use Levenshtein distance for fuzzy matching
  return levenshteinDistance(n1, n2) <= threshold;
};

// Detect potential duplicates
export const detectDuplicates = (clients: SupabaseClient[]): DuplicateGroup[] => {
  const duplicateGroups: DuplicateGroup[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < clients.length; i++) {
    if (processed.has(clients[i].id)) continue;

    const client1 = clients[i];
    const group: SupabaseClient[] = [client1];
    const matchReasons: Set<string> = new Set();
    let highestConfidence: 'high' | 'medium' | 'low' = 'low';

    for (let j = i + 1; j < clients.length; j++) {
      if (processed.has(clients[j].id)) continue;

      const client2 = clients[j];
      const reasons: string[] = [];
      let confidence: 'high' | 'medium' | 'low' = 'low';

      // Check exact name match
      if (normalize(client1.first_name) === normalize(client2.first_name) &&
          normalize(client1.last_name) === normalize(client2.last_name)) {
        reasons.push('Exact name match');
        confidence = 'high';
      }
      // Check similar names
      else if (areNamesSimilar(client1.first_name, client2.first_name) &&
               areNamesSimilar(client1.last_name, client2.last_name)) {
        reasons.push('Similar names');
        confidence = 'medium';
      }

      // Check AKA matches
      if (client1.aka || client2.aka) {
        const aka1 = normalize(client1.aka);
        const aka2 = normalize(client2.aka);
        const name1 = normalize(`${client1.first_name} ${client1.last_name}`);
        const name2 = normalize(`${client2.first_name} ${client2.last_name}`);

        if (aka1 && (aka1 === name2 || aka1 === aka2)) {
          reasons.push('AKA matches name');
          confidence = 'high';
        } else if (aka2 && (aka2 === name1)) {
          reasons.push('Name matches AKA');
          confidence = 'high';
        }
      }

      // Check matching physical characteristics
      let physicalMatches = 0;
      if (client1.gender && client1.gender === client2.gender) physicalMatches++;
      if (client1.age && client2.age && Math.abs(parseInt(client1.age) - parseInt(client2.age)) <= 2) physicalMatches++;
      if (client1.ethnicity && client1.ethnicity === client2.ethnicity) physicalMatches++;
      if (client1.hair && client1.hair === client2.hair) physicalMatches++;
      if (client1.eyes && client1.eyes === client2.eyes) physicalMatches++;

      if (physicalMatches >= 3 && reasons.length > 0) {
        reasons.push(`${physicalMatches} matching physical characteristics`);
        if (confidence === 'low') confidence = 'medium';
      }

      // If we found matches, add to group
      if (reasons.length > 0) {
        group.push(client2);
        processed.add(client2.id);
        reasons.forEach(r => matchReasons.add(r));
        
        if (confidence === 'high' || (confidence === 'medium' && highestConfidence === 'low')) {
          highestConfidence = confidence;
        }
      }
    }

    // Only add groups with duplicates
    if (group.length > 1) {
      processed.add(client1.id);
      duplicateGroups.push({
        clients: group,
        matchReason: Array.from(matchReasons),
        confidence: highestConfidence
      });
    }
  }

  // Sort by confidence (high first)
  return duplicateGroups.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.confidence] - order[b.confidence];
  });
};

// Merge duplicate clients
export const mergeClients = (primary: SupabaseClient, duplicates: SupabaseClient[]): Partial<SupabaseClient> => {
  const merged: Partial<SupabaseClient> = { ...primary };

  // Combine notes with timestamps
  const allNotes: string[] = [primary.notes || ''];
  duplicates.forEach(dup => {
    if (dup.notes && dup.notes !== primary.notes) {
      allNotes.push(`[Merged from duplicate - ${dup.first_name} ${dup.last_name}]\n${dup.notes}`);
    }
  });
  merged.notes = allNotes.filter(n => n).join('\n\n---\n\n');

  // Keep the most recent contact date
  const allDates = [primary.last_contact, ...duplicates.map(d => d.last_contact)]
    .filter(d => d)
    .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime());
  if (allDates.length > 0) {
    merged.last_contact = allDates[0];
  }

  // Sum up total contacts
  merged.contacts = primary.contacts + duplicates.reduce((sum, d) => sum + (d.contacts || 0), 0);

  // Merge AKA names
  const akas = new Set([primary.aka, ...duplicates.map(d => d.aka)].filter(a => a));
  if (akas.size > 0) {
    merged.aka = Array.from(akas).join(', ');
  }

  // Fill in missing fields from duplicates
  duplicates.forEach(dup => {
    if (!merged.gender && dup.gender) merged.gender = dup.gender;
    if (!merged.ethnicity && dup.ethnicity) merged.ethnicity = dup.ethnicity;
    if (!merged.age && dup.age) merged.age = dup.age;
    if (!merged.height && dup.height) merged.height = dup.height;
    if (!merged.weight && dup.weight) merged.weight = dup.weight;
    if (!merged.hair && dup.hair) merged.hair = dup.hair;
    if (!merged.eyes && dup.eyes) merged.eyes = dup.eyes;
    if (!merged.description && dup.description) merged.description = dup.description;
  });

  return merged;
};