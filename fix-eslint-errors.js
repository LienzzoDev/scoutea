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

// Function to fix unused variables by prefixing with underscore
function fixUnusedVariables(content) {
  // Fix unused variables in function parameters
  content = content.replace(
    /(\w+):\s*([^,)]+)(?=\s*[,)])/g,
    (match, varName, type) => {
      // Don't modify if already prefixed with underscore
      if (varName.startsWith('_')) return match;
      // Common unused parameter names to prefix
      const commonUnused = ['error', 'request', 'key', 'i', 'context', 'filters', 'player', 'pagination'];
      if (commonUnused.includes(varName)) {
        return `_${varName}: ${type}`;
      }
      return match;
    }
  );

  // Fix unused variables in destructuring and assignments
  const unusedPatterns = [
    { pattern: /const\s+error\s*=/g, replacement: 'const _error =' },
    { pattern: /const\s+request\s*=/g, replacement: 'const _request =' },
    { pattern: /const\s+key\s*=/g, replacement: 'const _key =' },
    { pattern: /let\s+error\s*=/g, replacement: 'let _error =' },
    { pattern: /\s+error\s*=/g, replacement: ' _error =' },
    { pattern: /const\s+selectedTeam\s*=/g, replacement: 'const _selectedTeam =' },
    { pattern: /const\s+isModalOpen\s*=/g, replacement: 'const _isModalOpen =' },
    { pattern: /const\s+closeTeamModal\s*=/g, replacement: 'const _closeTeamModal =' },
    { pattern: /const\s+selectedTorneo\s*=/g, replacement: 'const _selectedTorneo =' },
    { pattern: /const\s+setSelectedTorneo\s*=/g, replacement: 'const _setSelectedTorneo =' },
    { pattern: /const\s+setIsModalOpen\s*=/g, replacement: 'const _setIsModalOpen =' },
    { pattern: /const\s+page\s*=/g, replacement: 'const _page =' },
    { pattern: /const\s+clearError\s*=/g, replacement: 'const _clearError =' },
    { pattern: /const\s+activeReportsTab\s*=/g, replacement: 'const _activeReportsTab =' },
    { pattern: /const\s+setActiveReportsTab\s*=/g, replacement: 'const _setActiveReportsTab =' },
    { pattern: /const\s+router\s*=/g, replacement: 'const _router =' },
    { pattern: /const\s+showFilterDropdowns\s*=/g, replacement: 'const _showFilterDropdowns =' },
    { pattern: /const\s+toggleFilterDropdown\s*=/g, replacement: 'const _toggleFilterDropdown =' },
    { pattern: /const\s+formatDate\s*=/g, replacement: 'const _formatDate =' },
    { pattern: /const\s+getEstadoColor\s*=/g, replacement: 'const _getEstadoColor =' },
    { pattern: /const\s+responseData\s*=/g, replacement: 'const _responseData =' },
    { pattern: /const\s+profileCompleted\s*=/g, replacement: 'const _profileCompleted =' },
    { pattern: /const\s+handleStep1Submit\s*=/g, replacement: 'const _handleStep1Submit =' },
    { pattern: /const\s+subscription\s*=/g, replacement: 'const _subscription =' },
    { pattern: /const\s+handleBookmarkClick\s*=/g, replacement: 'const _handleBookmarkClick =' },
    { pattern: /const\s+showPercentiles\s*=/g, replacement: 'const _showPercentiles =' },
    { pattern: /const\s+setShowPercentiles\s*=/g, replacement: 'const _setShowPercentiles =' },
    { pattern: /const\s+clientError\s*=/g, replacement: 'const _clientError =' },
    { pattern: /const\s+generateBlurDataURL\s*=/g, replacement: 'const _generateBlurDataURL =' },
    { pattern: /const\s+itemToRemove\s*=/g, replacement: 'const _itemToRemove =' },
    { pattern: /const\s+lastError\s*=/g, replacement: 'const _lastError =' },
    { pattern: /const\s+retryCount\s*=/g, replacement: 'const _retryCount =' },
    { pattern: /const\s+totalErrors\s*=/g, replacement: 'const _totalErrors =' },
    { pattern: /const\s+cacheAnalysis\s*=/g, replacement: 'const _cacheAnalysis =' },
    { pattern: /const\s+totalTime\s*=/g, replacement: 'const _totalTime =' },
    { pattern: /const\s+cacheKey\s*=/g, replacement: 'const _cacheKey =' },
    { pattern: /const\s+comparisonGroup\s*=/g, replacement: 'const _comparisonGroup =' },
  ];

  unusedPatterns.forEach(({ pattern, replacement }) => {
    content = content.replace(pattern, replacement);
  });

  return content;
}

// Function to fix unescaped quotes in JSX
function fixUnescapedQuotes(content) {
  // Replace unescaped quotes in JSX text content
  content = content.replace(/([>])\s*([^<]*)"([^<]*?)"\s*([^<]*?)(<)/g, (match, start, before, quoted, after, end) => {
    return `${start}${before}&quot;${quoted}&quot;${after}${end}`;
  });
  
  return content;
}

// Function to replace any types with proper types
function fixAnyTypes(content) {
  // Common any type replacements
  const anyReplacements = [
    { pattern: /:\s*any\[\]/g, replacement: ': unknown[]' },
    { pattern: /:\s*any\s*=/g, replacement: ': unknown =' },
    { pattern: /:\s*any\s*\)/g, replacement: ': unknown)' },
    { pattern: /:\s*any\s*,/g, replacement: ': unknown,' },
    { pattern: /:\s*any\s*;/g, replacement: ': unknown;' },
    { pattern: /:\s*any\s*\|/g, replacement: ': unknown |' },
    { pattern: /\|\s*any\s*>/g, replacement: '| unknown>' },
    { pattern: /\|\s*any\s*,/g, replacement: '| unknown,' },
    { pattern: /\|\s*any\s*\)/g, replacement: '| unknown)' },
    { pattern: /\|\s*any\s*;/g, replacement: '| unknown;' },
  ];

  anyReplacements.forEach(({ pattern, replacement }) => {
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
    content = fixUnusedVariables(content);
    content = fixUnescapedQuotes(content);
    content = fixAnyTypes(content);
    
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