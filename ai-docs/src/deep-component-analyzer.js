/**
 * Deep Component Architecture Analyzer
 * Analyzes component structure, child components, props flow, and architecture
 */

import fs from 'fs';
import path from 'path';

export function analyzeComponentArchitecture(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    const analysis = {
      filePath,
      fileName: path.basename(filePath),
      childComponents: [],
      imports: [],
      hooks: [],
      props: [],
      state: [],
      effects: [],
      handlers: [],
      jsxStructure: [],
      dataFlow: [],
      reduxSlices: [],
      permissions: [],
      apiCalls: [],
      selectors: [],
      dispatchers: []
    };

    // Extract imports to find child components
    const importRegex = /import\s+(?:{([^}]+)}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
    let importMatch;
    while ((importMatch = importRegex.exec(content)) !== null) {
      const [, namedImports, namespaceImport, defaultImport, source] = importMatch;
      
      if (namedImports) {
        namedImports.split(',').forEach(imp => {
          const cleanImport = imp.trim();
          analysis.imports.push({
            name: cleanImport,
            type: 'named',
            source: source,
            isComponent: /^[A-Z]/.test(cleanImport)
          });
        });
      } else if (defaultImport) {
        analysis.imports.push({
          name: defaultImport,
          type: 'default',
          source: source,
          isComponent: /^[A-Z]/.test(defaultImport)
        });
      } else if (namespaceImport) {
        analysis.imports.push({
          name: namespaceImport,
          type: 'namespace',
          source: source,
          isComponent: false
        });
      }
    }

    // Extract hooks usage
    const hooksRegex = /(use\w+)\s*\(/g;
    let hookMatch;
    while ((hookMatch = hooksRegex.exec(content)) !== null) {
      analysis.hooks.push(hookMatch[1]);
    }

    // Extract useState declarations
    const stateRegex = /const\s+\[([^,]+),\s*([^\]]+)\]\s*=\s*useState\s*\(([^)]*)\)/g;
    let stateMatch;
    while ((stateMatch = stateRegex.exec(content)) !== null) {
      analysis.state.push({
        variable: stateMatch[1].trim(),
        setter: stateMatch[2].trim(),
        initialValue: stateMatch[3].trim()
      });
    }

    // Extract useEffect dependencies
    const effectRegex = /useEffect\s*\(\s*\(\s*\)\s*=>\s*{[^}]*},\s*\[([^\]]*)\]/g;
    let effectMatch;
    while ((effectMatch = effectRegex.exec(content)) !== null) {
      analysis.effects.push({
        dependencies: effectMatch[1].split(',').map(dep => dep.trim()).filter(dep => dep)
      });
    }

    // Extract props from function parameters or destructuring
    const propsRegex = /(?:function\s+\w+\s*\(|const\s+\w+\s*=\s*\()\s*{([^}]+)}/;
    const propsMatch = content.match(propsRegex);
    if (propsMatch) {
      const propsString = propsMatch[1];
      analysis.props = propsString.split(',').map(prop => prop.trim()).filter(prop => prop);
    }

    // Extract JSX component usage and props
    const componentUsageRegex = /<([A-Z]\w+)(\s+[^>]*)?(?:\s*\/>|>[^<]*<\/\1>)/g;
    let componentMatch;
    while ((componentMatch = componentUsageRegex.exec(content)) !== null) {
      const componentName = componentMatch[1];
      const propsString = componentMatch[2] || '';
      
      // Extract props passed to this component
      const propMatches = propsString.match(/(\w+)=(?:{([^}]+)}|"([^"]+)"|'([^']+)')/g) || [];
      const componentProps = propMatches.map(propMatch => {
        const [, propName, jsValue, stringValue1, stringValue2] = propMatch.match(/(\w+)=(?:{([^}]+)}|"([^"]+)"|'([^']+)')/) || [];
        return {
          name: propName,
          value: jsValue || stringValue1 || stringValue2,
          type: jsValue ? 'expression' : 'string'
        };
      });

      analysis.childComponents.push({
        name: componentName,
        props: componentProps,
        usage: componentMatch[0]
      });
    }

    // Extract event handlers
    const handlerRegex = /(on\w+|handle\w+)\s*=\s*{([^}]+)}/g;
    let handlerMatch;
    while ((handlerMatch = handlerRegex.exec(content)) !== null) {
      analysis.handlers.push({
        name: handlerMatch[1],
        implementation: handlerMatch[2].trim()
      });
    }

    // Extract Redux usage
    analysis.selectors = extractReduxSelectors(content);
    analysis.dispatchers = extractReduxDispatchers(content);
    analysis.reduxSlices = extractReduxSlices(content);
    
    // Extract permissions usage
    analysis.permissions = extractPermissions(content);
    
    // Extract API calls
    analysis.apiCalls = extractApiCalls(content);
    
    // Extract JSX structure
    analysis.jsxStructure = extractJSXStructure(content);

    return analysis;
  } catch (error) {
    console.error(`Error analyzing component ${filePath}:`, error.message);
    return null;
  }
}

function extractJSXStructure(content) {
  const structure = [];
  
  // Find the return statement with JSX
  const returnMatch = content.match(/return\s*\(\s*([\s\S]*?)\s*\);?\s*}/);
  if (!returnMatch) return structure;
  
  const jsxContent = returnMatch[1];
  
  // Extract main container elements
  const containerRegex = /<(\w+)(\s+[^>]*)?>/g;
  let containerMatch;
  while ((containerMatch = containerRegex.exec(jsxContent)) !== null) {
    if (!/^[A-Z]/.test(containerMatch[1])) { // HTML elements only
      structure.push({
        type: 'html',
        element: containerMatch[1],
        attributes: containerMatch[2] || ''
      });
    }
  }
  
  return structure;
}

function extractReduxSelectors(content) {
  const selectors = [];
  
  // Extract useSelector calls - enhanced patterns
  const selectorRegexes = [
    /useSelector\s*\(\s*(?:state\s*=>\s*)?([^)]+)\)/g,
    /useSelector\s*\(\s*\(\s*state\s*\)\s*=>\s*([^)]+)\)/g,
    /useSelector\s*\(\s*state\s*=>\s*state\.(\w+)\.([^)]+)\)/g
  ];
  
  selectorRegexes.forEach(regex => {
    let selectorMatch;
    while ((selectorMatch = regex.exec(content)) !== null) {
      const selectorExpression = selectorMatch[1] || `${selectorMatch[1]}.${selectorMatch[2]}`;
      const slice = selectorMatch[1] && selectorMatch[2] ? selectorMatch[1] : extractSliceFromSelector(selectorExpression);
      
      selectors.push({
        type: 'useSelector',
        expression: selectorExpression.trim(),
        slice: slice
      });
    }
  });
  
  // Extract direct selector calls
  const directSelectorRegex = /(\w+Selector)\s*\(\s*state\s*\)/g;
  let directMatch;
  while ((directMatch = directSelectorRegex.exec(content)) !== null) {
    selectors.push({
      type: 'selector',
      name: directMatch[1],
      slice: extractSliceFromSelectorName(directMatch[1])
    });
  }
  
  return selectors;
}

function extractReduxDispatchers(content) {
  const dispatchers = [];
  
  // Extract useDispatch calls
  const dispatchRegex = /dispatch\s*\(\s*([^)]+)\)/g;
  let dispatchMatch;
  while ((dispatchMatch = dispatchRegex.exec(content)) !== null) {
    const actionExpression = dispatchMatch[1].trim();
    dispatchers.push({
      type: 'dispatch',
      action: actionExpression,
      slice: extractSliceFromAction(actionExpression)
    });
  }
  
  return dispatchers;
}

function extractReduxSlices(content) {
  const slices = [];
  const importedSlices = new Set();
  
  // Extract slice imports
  const sliceImportRegex = /import\s+(?:{([^}]+)}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"]([^'"]*(?:slice|store|redux)[^'"]*)['"]/g;
  let importMatch;
  while ((importMatch = sliceImportRegex.exec(content)) !== null) {
    const [, namedImports, namespaceImport, defaultImport, source] = importMatch;
    
    if (namedImports) {
      namedImports.split(',').forEach(imp => {
        const cleanImport = imp.trim();
        if (cleanImport.includes('Slice') || cleanImport.includes('Actions')) {
          importedSlices.add(cleanImport);
        }
      });
    } else if (defaultImport && (defaultImport.includes('Slice') || source.includes('slice'))) {
      importedSlices.add(defaultImport);
    }
  }
  
  return Array.from(importedSlices).map(slice => ({
    name: slice,
    type: 'imported'
  }));
}

function extractPermissions(content) {
  const permissions = [];
  
  // Enhanced permission detection patterns
  const permissionPatterns = [
    // Function calls with permission strings
    /(hasPermission|checkPermission|userPermission|canAccess|isAuthorized)\s*\([^)]*['"]([^'"]+)['"][^)]*\)/g,
    // Permission constants
    /PERMISSION[S]?\.(\w+)/g,
    // userPermission object access
    /userPermission(?:s)?\.(\w+)/g,
    // Permission checks in conditionals
    /if\s*\(\s*([^)]*(?:permission|Permission|access|Access)[^)]*)\)/g,
    // Permission variables
    /(can\w+|has\w+|is\w+(?:Authorized|Allowed))\s*[=:]/g,
    // React-router guards or permission HOCs
    /(RequirePermission|PermissionGate|AuthGuard)\s*(?:permission|permissions)?\s*=\s*['"]([^'"]+)['"]/g,
    // Permission arrays or objects
    /permissions?\s*[:\[]\s*['"]([^'"]+)['"]/g
  ];
  
  permissionPatterns.forEach((regex, index) => {
    let permMatch;
    while ((permMatch = regex.exec(content)) !== null) {
      switch (index) {
        case 0: // Function calls
          permissions.push({
            function: permMatch[1],
            permission: permMatch[2],
            fullExpression: permMatch[0]
          });
          break;
        case 1: // Constants
          permissions.push({
            type: 'constant',
            permission: permMatch[1],
            fullExpression: permMatch[0]
          });
          break;
        case 2: // userPermission object
          permissions.push({
            type: 'userPermission',
            permission: permMatch[1],
            fullExpression: permMatch[0]
          });
          break;
        case 3: // Conditionals
          permissions.push({
            type: 'conditional',
            permission: 'conditional check',
            fullExpression: permMatch[1]
          });
          break;
        case 4: // Variables
          permissions.push({
            type: 'variable',
            permission: permMatch[1],
            fullExpression: permMatch[0]
          });
          break;
        case 5: // HOCs/Guards
          permissions.push({
            type: 'component',
            component: permMatch[1],
            permission: permMatch[2],
            fullExpression: permMatch[0]
          });
          break;
        case 6: // Arrays/Objects
          permissions.push({
            type: 'array',
            permission: permMatch[1],
            fullExpression: permMatch[0]
          });
          break;
      }
    }
  });
  
  return permissions;
}

function extractApiCalls(content) {
  const apiCalls = [];
  
  // Enhanced API call detection patterns
  const apiPatterns = [
    // Direct axios/api calls
    /(?:axios\.|api\.|client\.|apiClient\.)?(get|post|put|delete|patch|request)\s*\(\s*['"`]([^'"`]+)['"`](?:,\s*([^)]+))?\)/g,
    // Fetch calls
    /fetch\s*\(\s*['"`]([^'"`]+)['"`](?:,\s*\{[^}]*method:\s*['"`](\w+)['"`][^}]*(?:body:\s*([^}]+))?\})?\)/g,
    // Service method calls
    /(\w+(?:Service|API|Api|Client))\.(\w+)\s*\(\s*([^)]*)\)/g,
    // Redux action creators that make API calls
    /dispatch\s*\(\s*(\w+Actions)\.(\w+)\s*\(\s*([^)]*)\)/g,
    // Async function calls that might be API related
    /(fetch\w+|get\w+|post\w+|put\w+|delete\w+|create\w+|update\w+|save\w+|load\w+)\s*\(\s*([^)]*)\)/g
  ];
  
  apiPatterns.forEach((regex, patternIndex) => {
    let apiMatch;
    while ((apiMatch = regex.exec(content)) !== null) {
      switch (patternIndex) {
        case 0: // axios/api calls
          apiCalls.push({
            method: apiMatch[1] ? apiMatch[1].toUpperCase() : 'GET',
            endpoint: apiMatch[2],
            payload: apiMatch[3] || null,
            type: 'axios/api',
            fullCall: apiMatch[0]
          });
          break;
        case 1: // fetch calls
          apiCalls.push({
            method: apiMatch[2] ? apiMatch[2].toUpperCase() : 'GET',
            endpoint: apiMatch[1],
            payload: apiMatch[3] || null,
            type: 'fetch',
            fullCall: apiMatch[0]
          });
          break;
        case 2: // service calls
          apiCalls.push({
            service: apiMatch[1],
            method: apiMatch[2],
            params: apiMatch[3],
            type: 'service',
            fullCall: apiMatch[0]
          });
          break;
        case 3: // Redux actions
          apiCalls.push({
            actionType: 'redux',
            slice: apiMatch[1].replace('Actions', ''),
            action: apiMatch[2],
            params: apiMatch[3],
            type: 'redux-action',
            fullCall: apiMatch[0]
          });
          break;
        case 4: // Async functions
          if (apiMatch[1].match(/(fetch|get|post|put|delete|create|update|save|load)/i)) {
            apiCalls.push({
              functionName: apiMatch[1],
              params: apiMatch[2],
              type: 'async-function',
              fullCall: apiMatch[0]
            });
          }
          break;
      }
    }
  });
  
  // Extract calls in useEffect (for initial loads) - enhanced
  const effectApiRegex = /useEffect\s*\(\s*(?:\(\s*\)\s*=>\s*\{?\s*|(?:async\s*)?\(\s*\)\s*=>\s*\{)([^}]+)/g;
  let effectMatch;
  while ((effectMatch = effectApiRegex.exec(content)) !== null) {
    const effectBody = effectMatch[1];
    
    // Look for various API patterns within useEffect
    const innerApiPatterns = [
      /dispatch\s*\(\s*(\w+Actions)\.(\w+)/g,
      /(?:await\s+)?(\w+(?:Service|API))\.(\w+)/g,
      /(?:await\s+)?(?:axios\.|api\.|fetch\()/g
    ];
    
    innerApiPatterns.forEach(innerRegex => {
      let innerMatch;
      while ((innerMatch = innerRegex.exec(effectBody)) !== null) {
        apiCalls.push({
          trigger: 'useEffect (initial load)',
          context: effectBody.substring(0, 150) + '...',
          service: innerMatch[1],
          method: innerMatch[2],
          type: 'effect-api',
          fullCall: innerMatch[0]
        });
      }
    });
  }
  
  // Look for event handlers that make API calls
  const handlerApiRegex = /(on\w+|handle\w+)\s*=\s*(?:\(\s*\)\s*=>\s*\{?|(?:async\s*)?\(\s*[^)]*\)\s*=>\s*\{?)([^}]+)/g;
  let handlerMatch;
  while ((handlerMatch = handlerApiRegex.exec(content)) !== null) {
    const handlerBody = handlerMatch[2];
    const dispatchMatch = handlerBody.match(/dispatch\s*\(\s*(\w+Actions)\.(\w+)/);
    if (dispatchMatch) {
      apiCalls.push({
        trigger: `Event Handler: ${handlerMatch[1]}`,
        slice: dispatchMatch[1].replace('Actions', ''),
        action: dispatchMatch[2],
        type: 'event-handler-api'
      });
    }
  }
  
  return apiCalls;
}

function extractSliceFromSelector(expression) {
  const sliceMatch = expression.match(/state\.(\w+)/);
  return sliceMatch ? sliceMatch[1] : 'unknown';
}

function extractSliceFromSelectorName(selectorName) {
  // Remove 'Selector' suffix and extract slice name
  const baseName = selectorName.replace(/Selector$/, '');
  return baseName.toLowerCase();
}

function extractSliceFromAction(actionExpression) {
  const actionMatch = actionExpression.match(/(\w+)(?:Actions)?\.(\w+)/);
  return actionMatch ? actionMatch[1] : 'unknown';
}

export function generateArchitecturalDocumentation(componentAnalyses) {
  const lines = [];
  
  lines.push('## 🏗️ Component Architecture Analysis');
  lines.push('');
  
  componentAnalyses.forEach(analysis => {
    if (!analysis) return;
    
    lines.push(`### 📁 ${analysis.fileName}`);
    lines.push(`**Path:** \`${analysis.filePath}\``);
    lines.push('');
    
    // Child Components Section
    if (analysis.childComponents.length > 0) {
      lines.push('**🧩 Child Components Used:**');
      lines.push('');
      
      analysis.childComponents.forEach(child => {
        lines.push(`**${child.name}**`);
        if (child.props.length > 0) {
          lines.push('```jsx');
          const propsStr = child.props.map(p => 
            p.type === 'string' ? `${p.name}="${p.value}"` : `${p.name}={${p.value}}`
          ).join('\n  ');
          lines.push(`<${child.name}`);
          lines.push(`  ${propsStr}`);
          lines.push('/>');
          lines.push('```');
          
          lines.push('*Props passed:*');
          child.props.forEach(prop => {
            lines.push(`- **${prop.name}**: ${prop.value} *(${prop.type})*`);
          });
        }
        lines.push('');
      });
    }
    
    // Imports Section
    if (analysis.imports.filter(imp => imp.isComponent).length > 0) {
      lines.push('**📦 Component Dependencies:**');
      analysis.imports
        .filter(imp => imp.isComponent)
        .forEach(imp => {
          lines.push(`- **${imp.name}** from \`${imp.source}\``);
        });
      lines.push('');
    }
    
    // State Management
    if (analysis.state.length > 0) {
      lines.push('**🔄 State Management:**');
      analysis.state.forEach(state => {
        lines.push(`- **${state.variable}** (setter: ${state.setter}, initial: ${state.initialValue})`);
      });
      lines.push('');
    }
    
    // Hooks Used
    if (analysis.hooks.length > 0) {
      const uniqueHooks = [...new Set(analysis.hooks)];
      lines.push('**🪝 Hooks Used:**');
      lines.push(uniqueHooks.map(hook => `\`${hook}\``).join(', '));
      lines.push('');
    }
    
    // Props Interface
    if (analysis.props.length > 0) {
      lines.push('**📝 Props Interface:**');
      analysis.props.forEach(prop => {
        lines.push(`- \`${prop}\``);
      });
      lines.push('');
    }
    
    // Event Handlers
    if (analysis.handlers.length > 0) {
      lines.push('**⚡ Event Handlers:**');
      analysis.handlers.forEach(handler => {
        lines.push(`- **${handler.name}**: \`${handler.implementation}\``);
      });
      lines.push('');
    }
    
    // Redux State Management
    if (analysis.selectors.length > 0 || analysis.dispatchers.length > 0 || analysis.reduxSlices.length > 0) {
      lines.push('**🔄 Redux State Management:**');
      lines.push('');
      
      if (analysis.reduxSlices.length > 0) {
        lines.push('*Slices Used:*');
        analysis.reduxSlices.forEach(slice => {
          lines.push(`- **${slice.name}** (${slice.type})`);
        });
        lines.push('');
      }
      
      if (analysis.selectors.length > 0) {
        lines.push('*Data Selection (useSelector):*');
        analysis.selectors.forEach(selector => {
          if (selector.type === 'useSelector') {
            lines.push(`- **${selector.slice}** slice: \`${selector.expression}\``);
          } else {
            lines.push(`- **${selector.slice}** slice: \`${selector.name}\``);
          }
        });
        lines.push('');
      }
      
      if (analysis.dispatchers.length > 0) {
        lines.push('*Actions Dispatched:*');
        analysis.dispatchers.forEach(dispatcher => {
          lines.push(`- **${dispatcher.slice}** slice: \`${dispatcher.action}\``);
        });
        lines.push('');
      }
    }
    
    // User Permissions
    if (analysis.permissions.length > 0) {
      lines.push('**🔐 User Permissions & Access Control:**');
      lines.push('');
      const uniquePermissions = [...new Set(analysis.permissions.map(p => p.permission))];
      uniquePermissions.forEach(permission => {
        const permissionUsages = analysis.permissions.filter(p => p.permission === permission);
        lines.push(`- **${permission}**`);
        permissionUsages.forEach(usage => {
          if (usage.function) {
            lines.push(`  - Checked via: \`${usage.function}()\``);
          } else {
            lines.push(`  - Used as: \`${usage.fullExpression}\``);
          }
        });
      });
      lines.push('');
    }
    
    // API Calls & Data Flow
    if (analysis.apiCalls.length > 0) {
      lines.push('**🌐 API Integration & Data Flow:**');
      lines.push('');
      
      // Group by trigger type
      const initialLoadApis = analysis.apiCalls.filter(api => api.trigger === 'useEffect' || api.type === 'effect');
      const userActionApis = analysis.apiCalls.filter(api => !api.trigger || api.trigger !== 'useEffect');
      
      if (initialLoadApis.length > 0) {
        lines.push('*Initial Load APIs (useEffect):*');
        initialLoadApis.forEach(api => {
          if (api.service && api.method) {
            lines.push(`- **${api.service}.${api.method}()** - Auto-triggered on component mount`);
          } else if (api.endpoint) {
            lines.push(`- **${api.method} ${api.endpoint}** - Auto-triggered on component mount`);
          }
        });
        lines.push('');
      }
      
      if (userActionApis.length > 0) {
        lines.push('*User Action APIs:*');
        userActionApis.forEach(api => {
          if (api.endpoint) {
            const payloadText = api.payload ? ` (Payload: ${api.payload})` : '';
            lines.push(`- **${api.method} ${api.endpoint}**${payloadText}`);
          } else if (api.service && api.method) {
            lines.push(`- **${api.service}.${api.method}()** - Triggered by user action`);
          }
        });
        lines.push('');
      }
    }
    
    lines.push('---');
    lines.push('');
  });
  
  return lines;
}

export function generateDataFlowDiagram(componentAnalyses) {
  const lines = [];
  
  lines.push('## 📊 Data Flow & Component Hierarchy');
  lines.push('');
  
  // Find the main component (usually the first one)
  const mainComponent = componentAnalyses[0];
  if (!mainComponent) return lines;
  
  lines.push('```mermaid');
  lines.push('graph TD');
  lines.push(`  A[${mainComponent.fileName.replace('.js', '').replace('.jsx', '').replace('.ts', '').replace('.tsx', '')}] --> B[Child Components]`);
  
  let nodeId = 'C';
  mainComponent.childComponents.forEach(child => {
    lines.push(`  B --> ${nodeId}[${child.name}]`);
    
    if (child.props.length > 0) {
      const propsId = nodeId + '1';
      lines.push(`  ${nodeId} --> ${propsId}[Props: ${child.props.map(p => p.name).join(', ')}]`);
    }
    
    nodeId = String.fromCharCode(nodeId.charCodeAt(0) + 1);
  });
  
  lines.push('```');
  lines.push('');
  
  return lines;
}