const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      file = path.join(dir, file);
      const stat = fs.statSync(file);
      if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
         results = results.concat(walk(file));
      } else {
        if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
          results.push(file);
        }
      }
    });
  } catch (e) {}
  return results;
}

const files = walk('./src').concat(walk('./prisma'));
let count = 0;
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  let o = c;
  
  c = c.replace(/(?<!SUPER_)'ADMIN'/g, "'RESTAURANTS_ADMIN'");
  c = c.replace(/(?<!SUPER_)"ADMIN"/g, '"RESTAURANTS_ADMIN"');
  
  c = c.replace(/ : 'Admin'} Dashboard/g, " : 'Restaurants Admin'} Dashboard");
  c = c.replace(/'Admin Dashboard'/g, "'Restaurants Admin Dashboard'");
  c = c.replace(/"Admin Dashboard"/g, '"Restaurants Admin Dashboard"');
  c = c.replace(/>Admin</g, ">Restaurants Admin<");
  
  if(c !== o) {
    fs.writeFileSync(f, c);
    count++;
    console.log('Updated', f);
  }
});
console.log('Total updated:', count);
