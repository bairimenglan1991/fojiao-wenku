// User-approved curated merge; original source files remain untouched.
export const canonicalId = 'ZEN-三玄三要';
export const duplicateId = 'FXYW-0529';
export function mergeSanxuan(records) {
  const primary = records.find(r => r.id === canonicalId);
  if (!primary) throw new Error('Missing ancient-text canonical ' + canonicalId);
  const duplicate = records.find(r => r.id === duplicateId);
  primary.mergedIds = [...new Set([...(primary.mergedIds || []), duplicateId])];
  primary.aliases = [...new Set([...(primary.aliases || []), '三玄三要', '临济三玄三要', duplicateId, ...(duplicate?.aliases || [])])];
  const note = '依用户要求，将“临济三玄三要”（发心有物，FXYW-0529）合并至本条。保留本条古籍引文与出处；不沿用该导入条目的现代概述。旧编号和检索名称保留为别名。老大评唱为现代讲解，与古籍原文分列。';
  if (!primary.fields.some(([k]) => k === '合并说明')) primary.fields.push(['合并说明', note]);
  if (!primary.searchText.includes(duplicateId)) primary.searchText += '\n临济三玄三要\n' + duplicateId;
  return {records: records.filter(r => r.id !== duplicateId), redirects: [{oldId: duplicateId, record: primary}]};
}

