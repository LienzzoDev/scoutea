#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript and JavaScript files
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      // Skip node_modules and .next directories
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        results = results.concat(findFiles(filePath, extensions));
      }
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

// Function to fix router references
function fixRouterReferences(content) {
  // Replace router. with _router. but only if _router is imported
  if (content.includes('const _router = useRouter()')) {
    content = content.replace(/([^_])router\./g, '$1_router.');
    content = content.replace(/^router\./gm, '_router.');
    content = content.replace(/\(\s*router\./g, '(_router.');
    content = content.replace(/=>\s*router\./g, '=> _router.');
    content = content.replace(/,\s*router\s*,/g, ', _router,');
    content = content.replace(/,\s*router\s*\]/g, ', _router]');
    content = content.replace(/\[\s*router\s*,/g, '[_router,');
  }
  
  return content;
}

// Main function to process files
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Apply fixes
    content = fixRouterReferences(content);
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
function main() {
  const srcDir = path.join(process.cwd(), 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.error('src directory not found');
    process.exit(1);
  }
  
  const files = findFiles(srcDir);
  console.log(`Found ${files.length} files to process`);
  
  let fixedCount = 0;
  files.forEach(file => {
    if (processFile(file)) {
      fixedCount++;
    }
  });
  
  console.log(`\nProcessed ${files.length} files, fixed ${fixedCount} files`);
}

if (require.main === module) {
  main();
}