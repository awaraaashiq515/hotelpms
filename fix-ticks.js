const fs = require('fs');
let content = fs.readFileSync('src/app/[propertyCode]/operations/page.tsx', 'utf8');

// Replace any trailing single quote after backtick start
content = content.replace(/path: \`\$\{p\}\/([^']+)'/g, "path: \`${p}/$1\`");

fs.writeFileSync('src/app/[propertyCode]/operations/page.tsx', content);
console.log('Fixed');
