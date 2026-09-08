import fs from 'node:fs';
import path from 'node:path';

export function applyLaodaCommentary(records, overlay) {
  const seen = new Set();
  for (const record of records) {
    const ids = new Set([record.id, ...(record.mergedIds || [])]);
    const groups = overlay.groups.filter(g => g.ids.some(id => ids.has(id)));
    if (!groups.length) continue;
    for (const group of groups) seen.add(group.topic);
    if (!Array.isArray(record.fields)) throw new Error('Missing fields: ' + record.id);
    const sections = groups.map(g => g.excerpts.map(e => e.text).join('\n\n')).join('\n\n');
    const citation = [
      '讲者：' + overlay.attribution + '。来源：' + overlay.source,
      overlay.status,
      ...groups.map(g => g.topic + '：正文第 ' + [...new Set(g.excerpts.map(e => e.paragraph))].join('、') + ' 段。' + (g.note || '')),
      overlay.paragraphConvention,
      '以上仅按笔记节录，不是古籍原文，不代表已核定的录音逐字稿。'
    ].join('\n\n');
    const previous = record.fields.find(([k]) => k === '老大评唱')?.[1];
    // Future notes must be explicitly merged rather than silently overwritten.
    if (previous && previous !== sections) throw new Error('Existing commentary requires review: ' + record.id);
    record.fields = record.fields.filter(([k]) => !['老大评唱', '老大评唱来源'].includes(k));
    let at = record.fields.findIndex(([k]) => /^(原文|内容节录|通行文本|整理正文)/.test(k));
    if (at < 0) at = 0;
    record.fields.splice(at + 1, 0, ['老大评唱', sections], ['老大评唱来源', citation]);
    const marker = '\n老大评唱\n';
    record.searchText = (record.searchText || '').split(marker)[0] + marker + sections;
  }
  return seen;
}

export function readOverlay(file = path.join(import.meta.dirname, 'laoda-commentary-20260719.json')) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
