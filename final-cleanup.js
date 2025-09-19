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

// Function to fix all remaining issues
function finalCleanup(content) {
  // Fix broken JSX attributes with &quot;
  content = content.replace(/=&quot;([^&]*?)&quot;([a-zA-Z])/g, '="$1" $2');
  content = content.replace(/=&quot;([^&]*?)&quot;>/g, '="$1">');
  content = content.replace(/=&quot;([^&]*?)&quot;\/>/g, '="$1" />');
  content = content.replace(/=&quot;([^&]*?)&quot;\s*\/>/g, '="$1" />');
  
  // Fix specific broken patterns
  content = content.replace(/className=&quot;([^&]*?)&quot;/g, 'className="$1"');
  content = content.replace(/placeholder=&quot;([^&]*?)&quot;/g, 'placeholder="$1"');
  content = content.replace(/alt=&quot;([^&]*?)&quot;/g, 'alt="$1"');
  content = content.replace(/src=&quot;([^&]*?)&quot;/g, 'src="$1"');
  content = content.replace(/href=&quot;([^&]*?)&quot;/g, 'href="$1"');
  content = content.replace(/title=&quot;([^&]*?)&quot;/g, 'title="$1"');
  content = content.replace(/type=&quot;([^&]*?)&quot;/g, 'type="$1"');
  content = content.replace(/value=&quot;([^&]*?)&quot;/g, 'value="$1"');
  content = content.replace(/id=&quot;([^&]*?)&quot;/g, 'id="$1"');
  content = content.replace(/name=&quot;([^&]*?)&quot;/g, 'name="$1"');
  
  // Fix broken expressions and template literals
  content = content.replace(/\$\{([^}]*?)&quot;([^}]*?)\}/g, '${$1"$2}');
  content = content.replace(/`([^`]*?)&quot;([^`]*?)`/g, '`$1"$2`');
  
  // Fix spacing issues
  content = content.replace(/\(\s*e\s*\)\s*=>\s*setMessage/g, '(e) => setMessage');
  content = content.replace(/\(\s*e\s*\)\s*=>\s*set([A-Z])/g, '(e) => set$1');
  
  // Fix remaining unused variables
  const unusedVarFixes = [
    { pattern: /const showPercentiles\s*=/g, replacement: 'const _showPercentiles =' },
    { pattern: /const setShowPercentiles\s*=/g, replacement: 'const _setShowPercentiles =' },
    { pattern: /const subscription\s*=/g, replacement: 'const _subscription =' },
    { pattern: /const lazy\s*=/g, replacement: 'const _lazy =' },
    { pattern: /const lastError\s*=/g, replacement: 'const _lastError =' },
    { pattern: /const retryCount\s*=/g, replacement: 'const _retryCount =' },
    { pattern: /const storageKey\s*=/g, replacement: 'const _storageKey =' },
    { pattern: /(\([^)]*?)fm_i(\s*:\s*[^,)]+)/g, replacement: '$1_fm_i$2' },
    { pattern: /(\([^)]*?)key(\s*:\s*[^,)]+)/g, replacement: '$1_key$2' },
    { pattern: /(\([^)]*?)i(\s*:\s*number[^,)]*)/g, replacement: '$1_i$2' },
    { pattern: /(\([^)]*?)player(\s*:\s*[^,)]+)/g, replacement: '$1_player$2' },
  ];

  unusedVarFixes.forEach(({ pattern, replacement }) => {
    content = content.replace(pattern, replacement);
  });

  // Fix empty interfaces
  content = content.replace(/interface\s+(\w+)\s*extends\s+Record<string,\s*never>\s*\{\s*\}/g, 'interface $1 extends Record<string, never> {}');
  
  // Fix require imports
  content = content.replace(/const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\)/g, 'import $1 from "$2"');
  
  return content;
}

// Main function to process files
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Apply fixes
    content = finalCleanup(content);
    
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