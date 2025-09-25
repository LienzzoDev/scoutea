const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all API route files
const apiFiles = glob.sync('src/app/api/**/route.ts');

console.log(`Found ${apiFiles.length} API route files to check...`);

apiFiles.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Pattern to match the old params syntax
    const oldPattern = /\{ params \}: \{ params: \{ ([^}]+) \} \}/g;
    
    if (oldPattern.test(content)) {
      console.log(`Fixing ${filePath}...`);
      
      // Reset regex
      oldPattern.lastIndex = 0;
      
      // Replace with new async params syntax
      content = content.replace(
        /\{ params \}: \{ params: \{ ([^}]+) \} \}/g,
        '{ params }: { params: Promise<{ $1 }> }'
      );
      
      // Add await params destructuring after the function starts
      content = content.replace(
        /(export async function \w+\([^)]*\) \{[^}]*?)(\s*)(const [^=]+ = await [^;]+;)?(\s*)(.*?params\.(\w+))/gs,
        (match, funcStart, ws1, existingAwait, ws2, rest, paramName) => {
          if (existingAwait && existingAwait.includes('await params')) {
            return match; // Already fixed
          }
          
          const awaitParams = `const { ${paramName} } = await params;`;
          const updatedRest = rest.replace(new RegExp(`params\\.${paramName}`, 'g'), paramName);
          
          return `${funcStart}${ws1}${awaitParams}${ws2}${updatedRest}`;
        }
      );
      
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log('Done!');