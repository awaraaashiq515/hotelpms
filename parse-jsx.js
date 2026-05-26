const fs = require('fs');
const content = fs.readFileSync('src/app/tablet/[id]/page.tsx', 'utf-8');
const startIndex = content.indexOf("if (tablet.mode === 'WAITER' && sessionStage !== 'MENU') {");
let returnIndex = content.indexOf('return (', startIndex);
let endIndex = content.indexOf('  }\n\n  return (', returnIndex);
const block = content.substring(returnIndex, endIndex);

let tags = [];
const regex = /<\/?([a-zA-Z0-9_.-]+)[^>]*>/g;
let match;
while ((match = regex.exec(block)) !== null) {
  const fullTag = match[0];
  const tagName = match[1];
  
  if (fullTag.endsWith('/>')) continue;
  
  // ignore typescript generics that look like tags (they don't have spaces usually and are single words inside <>)
  if (fullTag.match(/^<[a-zA-Z0-9_]+>$/)) {
      // if it's not a standard html or component name, ignore
      if (['any', 'number', 'string', 'boolean', 'KotSlipData'].includes(tagName)) continue;
  }
  
  if (fullTag.startsWith('</')) {
    if (tags.length > 0) {
      const last = tags[tags.length - 1];
      if (last.name === tagName) {
        tags.pop();
      } else {
        // ignore if we had a mismatched generic previously
      }
    }
  } else {
    const selfClosingHTML = ['input', 'br', 'hr', 'img', 'meta', 'link'];
    if (selfClosingHTML.includes(tagName)) continue;
    tags.push({name: tagName, index: match.index, tag: fullTag});
  }
}
console.log('Open tags at the end:');
console.log(tags.slice(-10));
