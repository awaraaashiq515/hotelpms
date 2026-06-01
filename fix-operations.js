const fs = require('fs');
let content = fs.readFileSync('src/app/[propertyCode]/operations/page.tsx', 'utf8');

content = content.replace(/import { useParams } from 'next\/navigation';/, '');
content = content.replace(/import { useRouter } from 'next\/navigation';/, "import { useRouter, useParams } from 'next/navigation';");

content = content.replace(/export default function OperationsPage\(\) {/, `export default function OperationsPage() {
  const params = useParams();
  const propertyCode = params?.propertyCode as string;
  const p = propertyCode ? \`/\${propertyCode}\` : '';
`);

content = content.replace(/path: '\//g, "path: `${p}/");
content = content.replace(/path: role === 'SUPER_ADMIN' \? `\$\{p\}\/admin\/properties` : `\$\{p\}\/manage-properties`/g, "path: role === 'SUPER_ADMIN' ? `/admin/properties` : `${p}/manage-properties`");
content = content.replace(/path: `\$\{p\}\/driver-portal`/g, "path: `/driver-portal`"); // driver portal is not dashboard? Wait, driver-portal is dashboard?
// Let's check if driver-portal is in dashboardRoots. It's not.

fs.writeFileSync('src/app/[propertyCode]/operations/page.tsx', content);
console.log('Fixed');
