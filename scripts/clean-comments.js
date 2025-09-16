#!/usr/bin/env node

/**
 * Script to identify files with excessive decorative comments
 * and suggest improvements
 */

const fs = require('fs');
const path = require('path');

// Patterns for decorative comments that should be simplified
const decorativePatterns = [
  /\/\/ 🎯|\/\/ ✅|\/\/ 🚀|\/\/ 🔍|\/\/ 📚|\/\/ 🏭|\/\/ 🌐|\/\/ 🔐|\/\/ 🧹|\/\/ 🛠️|\/\/ ➕|\/\/ 🔄/g,
  /\/\/ ={5,}/g, // Lines with many equals signs
  /\/\/ -{5,}/g, // Lines with many dashes
];

// Patterns for comments that add no value
const redundantPatterns = [
  /\/\/ Método principal/,
  /\/\/ Función principal/,
  /\/\/ Clase principal/,
  /\/\/ Usar el método/,
  /\/\/ Llamar al método/,
];

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let decorativeCount = 0;
    let redundantCount = 0;
    let issues = [];
    
    lines.forEach((line, index) => {
      // Check for decorative comments
      decorativePatterns.forEach(pattern => {
        if (pattern.test(line)) {
          decorativeCount++;
          issues.push({
            line: index + 1,
            type: 'decorative',
            content: line.trim()
          });
        }
      });
      
      // Check for redundant comments
      redundantPatterns.forEach(pattern => {
        if (pattern.test(line)) {
          redundantCount++;
          issues.push({
            line: index + 1,
            type: 'redundant',
            content: line.trim()
          });
        }
      });
    });
    
    return {
      decorativeCount,
      redundantCount,
      issues,
      totalLines: lines.length
    };
  } catch (error) {
    return null;
  }
}

function scanDirectory(dir, extensions = ['.ts', '.tsx']) {
  const results = [];
  
  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scan(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        const analysis = analyzeFile(fullPath);
        if (analysis && (analysis.decorativeCount > 0 || analysis.redundantCount > 0)) {
          results.push({
            file: fullPath,
            ...analysis
          });
        }
      }
    }
  }
  
  scan(dir);
  return results;
}

// Main execution
const srcDir = path.join(process.cwd(), 'src');
const results = scanDirectory(srcDir);

console.log('📊 Comment Analysis Results\n');
console.log('Files with excessive decorative comments:\n');

results
  .sort((a, b) => (b.decorativeCount + b.redundantCount) - (a.decorativeCount + a.redundantCount))
  .slice(0, 10) // Top 10 files
  .forEach(result => {
    const relativePath = path.relative(process.cwd(), result.file);
    console.log(`📁 ${relativePath}`);
    console.log(`   Decorative: ${result.decorativeCount}, Redundant: ${result.redundantCount}`);
    
    if (result.issues.length > 0) {
      result.issues.slice(0, 3).forEach(issue => {
        console.log(`   Line ${issue.line}: ${issue.content}`);
      });
      if (result.issues.length > 3) {
        console.log(`   ... and ${result.issues.length - 3} more`);
      }
    }
    console.log('');
  });

console.log(`\n📈 Summary:`);
console.log(`Files analyzed: ${results.length}`);
console.log(`Total decorative comments: ${results.reduce((sum, r) => sum + r.decorativeCount, 0)}`);
console.log(`Total redundant comments: ${results.reduce((sum, r) => sum + r.redundantCount, 0)}`);

console.log(`\n💡 Recommendations:`);
console.log(`1. Replace decorative emojis with meaningful descriptions`);
console.log(`2. Remove redundant comments that don't add value`);
console.log(`3. Add JSDoc comments for public APIs`);
console.log(`4. Focus on explaining "why" not "what"`);