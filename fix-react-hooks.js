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

// Function to fix React hook dependencies
function fixReactHooks(content) {
  // Fix useEffect missing dependencies
  const useEffectPattern = /useEffect\(\s*\(\)\s*=>\s*\{[^}]*\},\s*\[[^\]]*\]\s*\)/gs;
  
  // Common fixes for missing dependencies
  const hookFixes = [
    {
      // Add getPlayer to dependency array
      pattern: /useEffect\(\s*\(\)\s*=>\s*\{[^}]*getPlayer[^}]*\},\s*\[\]\s*\)/gs,
      replacement: (match) => match.replace('[]', '[getPlayer]')
    },
    {
      // Add loadPlayerList to dependency array
      pattern: /useEffect\(\s*\(\)\s*=>\s*\{[^}]*loadPlayerList[^}]*\},\s*\[\]\s*\)/gs,
      replacement: (match) => match.replace('[]', '[loadPlayerList]')
    },
    {
      // Add loadFilterOptions to dependency array
      pattern: /useEffect\(\s*\(\)\s*=>\s*\{[^}]*loadFilterOptions[^}]*\},\s*\[\]\s*\)/gs,
      replacement: (match) => match.replace('[]', '[loadFilterOptions]')
    },
    {
      // Add defaultCategories to dependency array
      pattern: /useEffect\(\s*\(\)\s*=>\s*\{[^}]*defaultCategories[^}]*\},\s*\[\]\s*\)/gs,
      replacement: (match) => match.replace('[]', '[defaultCategories]')
    }
  ];

  hookFixes.forEach(({ pattern, replacement }) => {
    content = content.replace(pattern, replacement);
  });

  // Fix useCallback missing dependencies
  const callbackFixes = [
    {
      // Add error to dependency array for useCallback
      pattern: /useCallback\(\s*\([^)]*\)\s*=>\s*\{[^}]*error[^}]*\},\s*\[\]\s*\)/gs,
      replacement: (match) => match.replace('[]', '[error]')
    },
    {
      // Add removeToast to dependency array for useCallback
      pattern: /useCallback\(\s*\([^)]*\)\s*=>\s*\{[^}]*removeToast[^}]*\},\s*\[[^\]]*\]\s*\)/gs,
      replacement: (match) => {
        if (!match.includes('removeToast')) {
          return match.replace(/\[([^\]]*)\]/, (m, deps) => {
            const cleanDeps = deps.trim();
            return cleanDeps ? `[${cleanDeps}, removeToast]` : '[removeToast]';
          });
        }
        return match;
      }
    }
  ];

  callbackFixes.forEach(({ pattern, replacement }) => {
    content = content.replace(pattern, replacement);
  });

  return content;
}

// Function to fix unescaped quotes in JSX
function fixJSXQuotes(content) {
  // Fix unescaped quotes in JSX text content - more precise patterns
  const quoteFixes = [
    {
      pattern: /(\>)\s*([^<]*)"([^"<]*?)"\s*([^<]*?)(\<)/g,
      replacement: '$1$2&quot;$3&quot;$4$5'
    },
    {
      pattern: /(\>)\s*([^<]*)"([^"<]*?)"\s*([^<]*?)(\<)/g,
      replacement: '$1$2&quot;$3&quot;$4$5'
    }
  ];

  quoteFixes.forEach(({ pattern, replacement }) => {
    content = content.replace(pattern, replacement);
  });

  return content;
}

// Function to replace img tags with Next.js Image component
function fixImageTags(content) {
  // Add Image import if not present and img tags exist
  if (content.includes('<img') && !content.includes('import Image from')) {
    // Find the import section
    const importMatch = content.match(/^(import[^;]+;[\s\S]*?)(\n\n|$)/m);
    if (importMatch) {
      const imports = importMatch[1];
      const newImport = 'import Image from "next/image";\n';
      content = content.replace(imports, imports + newImport);
    } else {
      // Add import at the beginning if no imports found
      content = 'import Image from "next/image";\n\n' + content;
    }
  }

  // Replace img tags with Image components (basic replacement)
  content = content.replace(
    /<img\s+([^>]*)\s*\/?>/g,
    (match, attributes) => {
      // Extract src and alt attributes
      const srcMatch = attributes.match(/src=["']([^"']+)["']/);
      const altMatch = attributes.match(/alt=["']([^"']+)["']/);
      const classMatch = attributes.match(/className=["']([^"']+)["']/);
      
      const src = srcMatch ? srcMatch[1] : '';
      const alt = altMatch ? altMatch[1] : '';
      const className = classMatch ? ` className="${classMatch[1]}"` : '';
      
      if (src) {
        return `<Image src="${src}" alt="${alt}" width={100} height={100}${className} />`;
      }
      return match;
    }
  );

  return content;
}

// Function to fix require() imports
function fixRequireImports(content) {
  // Replace require() with import statements where possible
  const requireFixes = [
    {
      pattern: /const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\)/g,
      replacement: 'import $1 from "$2"'
    }
  ];

  requireFixes.forEach(({ pattern, replacement }) => {
    content = content.replace(pattern, replacement);
  });

  return content;
}

// Main function to process files
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Apply fixes
    content = fixReactHooks(content);
    content = fixJSXQuotes(content);
    
    // Only fix img tags in .tsx files (React components)
    if (filePath.endsWith('.tsx')) {
      content = fixImageTags(content);
    }
    
    // Fix require imports in .ts files
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      content = fixRequireImports(content);
    }
    
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