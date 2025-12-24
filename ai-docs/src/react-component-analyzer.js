import fs from 'fs';
import path from 'path';
import { summarizeWithLLM } from './llm.js';
import { generateBusinessDocumentation } from './business-doc-generator.js';
import { generateComponentInterface, generateUsageGuidelines, generateImplementationSummary } from './component-interface-generator.js';

const REACT_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);

/**
 * Find and analyze specific React components by name or path
 */
export async function findReactComponent(codebasePath, componentName) {
  const results = [];
  const componentPattern = new RegExp(`(${componentName}|\\b${componentName}\\b)`, 'i');
  
  function walkDirectory(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip common directories
          if (['node_modules', '.git', 'dist', 'build', '.next', 'coverage'].includes(entry.name)) {
            continue;
          }
          walkDirectory(fullPath);
        } else if (entry.isFile() && REACT_EXTENSIONS.has(path.extname(entry.name))) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            
            // Check if this file contains the component
            const fileName = path.basename(entry.name, path.extname(entry.name));
            const isTargetFile = componentPattern.test(fileName) || componentPattern.test(content);
            
            if (isTargetFile) {
              const analysis = analyzeReactFile(content, fullPath, componentName);
              if (analysis) {
                results.push({
                  path: fullPath,
                  fileName: entry.name,
                  ...analysis
                });
              }
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }
  
  walkDirectory(codebasePath);
  return results;
}

/**
 * Analyze a React file to extract component information
 */
function analyzeReactFile(content, filePath, targetComponent) {
  const analysis = {
    components: [],
    imports: [],
    exports: [],
    hooks: [],
    props: [],
    state: [],
    functions: [],
    fullContent: content
  };
  
  const lines = content.split('\n');
  
  // Extract imports
  const importRegex = /^import\s+.*?\s+from\s+['"](.+?)['"];?$/gm;
  let importMatch;
  while ((importMatch = importRegex.exec(content)) !== null) {
    analysis.imports.push(importMatch[0].trim());
  }
  
  // Extract exports
  const exportRegex = /^export\s+(?:default\s+)?(?:const\s+|function\s+|class\s+)?(\w+)/gm;
  let exportMatch;
  while ((exportMatch = exportRegex.exec(content)) !== null) {
    analysis.exports.push(exportMatch[1]);
  }
  
  // Extract React hooks
  const hooksRegex = /(?:const\s+\[([^\]]+)\]\s*=\s*)?(use\w+)\s*\(/g;
  let hookMatch;
  while ((hookMatch = hooksRegex.exec(content)) !== null) {
    analysis.hooks.push({
      hook: hookMatch[2],
      variables: hookMatch[1] ? hookMatch[1].split(',').map(v => v.trim()) : [],
      line: content.substring(0, hookMatch.index).split('\n').length
    });
  }
  
  // Extract function components and class components
  const functionComponentRegex = /(?:export\s+(?:default\s+)?)?(?:const\s+|function\s+)(\w+)\s*[=:]?\s*(?:\([^)]*\)\s*=>|\([^)]*\)\s*\{)/g;
  let funcMatch;
  while ((funcMatch = functionComponentRegex.exec(content)) !== null) {
    if (funcMatch[1] && funcMatch[1][0] === funcMatch[1][0].toUpperCase()) {
      analysis.components.push({
        name: funcMatch[1],
        type: 'functional',
        line: content.substring(0, funcMatch.index).split('\n').length
      });
    }
  }
  
  // Extract class components
  const classComponentRegex = /class\s+(\w+)\s+extends\s+(?:React\.)?Component/g;
  let classMatch;
  while ((classMatch = classComponentRegex.exec(content)) !== null) {
    analysis.components.push({
      name: classMatch[1],
      type: 'class',
      line: content.substring(0, classMatch.index).split('\n').length
    });
  }
  
  // Extract props (from PropTypes or TypeScript interfaces)
  const propTypesRegex = /(\w+)\.propTypes\s*=\s*\{([^}]+)\}/g;
  const interfaceRegex = /interface\s+(\w+Props)\s*\{([^}]+)\}/g;
  
  let propMatch;
  while ((propMatch = propTypesRegex.exec(content)) !== null) {
    const propsText = propMatch[2];
    const props = propsText.split(',').map(p => p.trim().split(':')[0].trim()).filter(Boolean);
    analysis.props.push(...props);
  }
  
  while ((propMatch = interfaceRegex.exec(content)) !== null) {
    const propsText = propMatch[2];
    const props = propsText.split('\n').map(line => {
      const match = line.trim().match(/^(\w+)[?:]?\s*:/);
      return match ? match[1] : null;
    }).filter(Boolean);
    analysis.props.push(...props);
  }
  
  // Check if this file is relevant to the target component
  const isRelevant = analysis.components.some(comp => 
    comp.name.toLowerCase().includes(targetComponent.toLowerCase())
  ) || path.basename(filePath).toLowerCase().includes(targetComponent.toLowerCase());
  
  return isRelevant ? analysis : null;
}

/**
 * Generate comprehensive React component documentation using business-focused approach
 */
export async function generateReactComponentDocumentation({ 
  componentName, 
  codebasePath, 
  componentResults, 
  userDocs = [] 
}) {
  // Convert componentResults to searchResults format for compatibility
  const searchResults = componentResults.map(result => ({
    path: result.path,
    snippets: [{ context: `Component: ${result.components.map(c => c.name).join(', ')}` }]
  }));
  
  // Use the new business-focused documentation generator
  return await generateBusinessDocumentation({ 
    query: componentName, 
    searchResults, 
    userDocs, 
    codebasePath, 
    componentName 
  });
}

function buildComponentAnalysisPrompt(componentName, componentResults, codebasePath) {
  // Extract key information without including raw code
  const components = componentResults.flatMap(r => r.components);
  const hooks = componentResults.flatMap(r => r.hooks);
  const imports = componentResults.flatMap(r => r.imports);
  const props = componentResults.flatMap(r => r.props);
  
  // Analyze imports to identify external libraries and internal dependencies
  const externalLibs = imports.filter(imp => !imp.includes('./') && !imp.includes('../'));
  const internalDeps = imports.filter(imp => imp.includes('./') || imp.includes('../'));
  
  const prompt = `Analyze React component "${componentName}" and create business-focused technical documentation:

COMPONENT ANALYSIS:
- Main Components: ${components.map(c => `${c.name} (${c.type})`).join(', ')}
- React Hooks Used: ${hooks.map(h => h.hook).join(', ')}
- Props/Interface: ${props.join(', ')}
- External Libraries: ${externalLibs.slice(0, 8).join(', ')}
- Internal Dependencies: ${internalDeps.slice(0, 5).join(', ')}

Create comprehensive documentation covering:

## 1. Component Overview
- What this component does and its primary purpose
- Key business functionality it provides
- When and where to use this component

## 2. Component Dependencies & APIs
- External libraries and APIs it integrates with
- Internal components it uses or depends on
- Data sources and backend services it connects to
- Third-party integrations

## 3. Component Interface
- Key props and their business purpose
- Events and callbacks it provides
- Data it accepts and returns
- Integration points with other components

## 4. Business Logic & Features
- Main features and capabilities
- Business rules it implements
- User interactions it handles
- State management approach

## 5. Integration Guidelines
- How other components can use this component
- Common integration patterns
- Parent-child relationships
- Context and data flow

Focus on practical business value and integration details. Avoid showing code snippets.`.trim();
  
  return prompt;
}

function generateArchitectureSection(lines, componentResults) {
  // Component overview
  const totalComponents = componentResults.flatMap(r => r.components);
  const totalHooks = componentResults.flatMap(r => r.hooks);
  
  lines.push('### Component Structure');
  lines.push('');
  lines.push(`**Files analyzed:** ${componentResults.length}`);
  lines.push(`**Components found:** ${totalComponents.length}`);
  lines.push(`**React hooks used:** ${totalHooks.length}`);
  lines.push('');
  
  // Component types and purposes
  if (totalComponents.length > 0) {
    lines.push('### Component Types');
    lines.push('');
    for (const comp of totalComponents) {
      const file = componentResults.find(r => r.components.includes(comp));
      lines.push(`**${comp.name}** (${comp.type} component)`);
      lines.push(`- File: ${file?.fileName}`);
      lines.push(`- React hooks: ${file?.hooks.map(h => h.hook).join(', ') || 'None'}`);
      lines.push('');
    }
  }
  
  // State management pattern
  const stateHooks = totalHooks.filter(h => h.hook.includes('useState'));
  const effectHooks = totalHooks.filter(h => h.hook.includes('useEffect'));
  const customHooks = totalHooks.filter(h => !h.hook.startsWith('useState') && !h.hook.startsWith('useEffect'));
  
  lines.push('### State Management Pattern');
  lines.push('');
  if (stateHooks.length > 0) {
    lines.push(`- **Local State**: Uses \`useState\` (${stateHooks.length} instances)`);
  }
  if (effectHooks.length > 0) {
    lines.push(`- **Side Effects**: Uses \`useEffect\` (${effectHooks.length} instances)`);
  }
  if (customHooks.length > 0) {
    lines.push(`- **Custom Hooks**: ${customHooks.map(h => h.hook).join(', ')}`);
  }
  if (stateHooks.length === 0 && effectHooks.length === 0) {
    lines.push('- **Stateless**: Pure component without local state management');
  }
  lines.push('');
}

function generateAPIReference(lines, componentResults) {
  lines.push('### Component Props');
  lines.push('');
  lines.push('| Prop | Type | Required | Default | Description |');
  lines.push('|------|------|----------|---------|-------------|');
  
  const allProps = [...new Set(componentResults.flatMap(r => r.props))];
  if (allProps.length > 0) {
    for (const prop of allProps) {
      lines.push(`| ${prop} | \`any\` | ❓ | \`undefined\` | *Analysis needed* |`);
    }
  } else {
    lines.push('| *No props detected* | - | - | - | Component may use children or be self-contained |');
  }
  lines.push('');
  
  lines.push('### Methods & Handlers');
  lines.push('');
  lines.push('*Methods will be documented after detailed code analysis*');
  lines.push('');
}

function generateDependenciesSection(lines, componentResults) {
  const allImports = [...new Set(componentResults.flatMap(r => r.imports))];
  
  // Categorize imports
  const externalLibs = allImports.filter(imp => !imp.includes('./') && !imp.includes('../'));
  const internalDeps = allImports.filter(imp => imp.includes('./') || imp.includes('../'));
  
  // Extract library names from imports
  const libraries = externalLibs.map(imp => {
    const match = imp.match(/from\s+['"]([^'"]+)['"]/);
    return match ? match[1] : '';
  }).filter(Boolean);
  
  // Extract internal component references
  const internalComponents = internalDeps.map(imp => {
    const match = imp.match(/from\s+['"]([^'"]+)['"]/);
    return match ? match[1].replace('./', '').replace('../', '') : '';
  }).filter(Boolean);
  
  lines.push('### External Libraries & APIs');
  lines.push('');
  if (libraries.length > 0) {
    const uniqueLibs = [...new Set(libraries)];
    for (const lib of uniqueLibs) {
      lines.push(`- **${lib}** - Third-party integration`);
    }
  } else {
    lines.push('- No external library dependencies');
  }
  lines.push('');
  
  lines.push('### Internal Dependencies');
  lines.push('');
  if (internalComponents.length > 0) {
    const uniqueComps = [...new Set(internalComponents)];
    for (const comp of uniqueComps) {
      lines.push(`- **${comp}** - Internal component/module`);
    }
  } else {
    lines.push('- No internal component dependencies');
  }
  lines.push('');
  
  lines.push('### Integration Points');
  lines.push('');
  lines.push('This component integrates with:');
  if (libraries.some(lib => lib.includes('axios') || lib.includes('fetch'))) {
    lines.push('- **APIs/Backend services** (via HTTP requests)');
  }
  if (libraries.some(lib => lib.includes('redux') || lib.includes('zustand'))) {
    lines.push('- **State management store** (global state)');
  }
  if (libraries.some(lib => lib.includes('router'))) {
    lines.push('- **Routing system** (navigation)');
  }
  if (libraries.some(lib => lib.includes('styled') || lib.includes('css'))) {
    lines.push('- **Styling system** (UI/UX)');
  }
  if (internalComponents.length > 0) {
    lines.push('- **Internal components** (component composition)');
  }
  lines.push('');
}

// Old code-heavy functions removed - using business-focused approach instead