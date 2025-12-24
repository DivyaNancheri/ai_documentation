/**
 * Component Interface Generator
 * Generates component interface documentation, usage guidelines, and implementation summaries
 */

/**
 * Generate component interface documentation
 */
export function generateComponentInterface(lines, componentResults) {
  lines.push('### Component Props');
  lines.push('');
  
  const allProps = [...new Set(componentResults.flatMap(r => r.props))];
  
  if (allProps.length > 0) {
    lines.push('| Prop | Type | Required | Default | Description |');
    lines.push('|------|------|----------|---------|-------------|');
    
    for (const prop of allProps) {
      lines.push(`| ${prop} | \`any\` | ❓ | \`undefined\` | *Analysis needed* |`);
    }
  } else {
    lines.push('*No explicit props detected in static analysis. Component may use:*');
    lines.push('- Children props for content composition');
    lines.push('- Context for data access');
    lines.push('- Self-contained functionality');
  }
  lines.push('');
  
  // Events and callbacks
  lines.push('### Events & Callbacks');
  lines.push('');
  
  const allHooks = componentResults.flatMap(r => r.hooks);
  const eventHooks = allHooks.filter(h => h.hook.includes('useCallback') || h.hook.includes('useEffect'));
  
  if (eventHooks.length > 0) {
    lines.push('**Detected event handling patterns:**');
    lines.push('- Component uses hooks that may handle events');
    lines.push('- Callback functions may be exposed via props');
    lines.push('- Side effects managed through useEffect');
  } else {
    lines.push('*No explicit event handling detected in static analysis.*');
  }
  lines.push('');
  
  // Data flow
  lines.push('### Data Flow');
  lines.push('');
  lines.push('**Input:**');
  if (allProps.length > 0) {
    lines.push(`- Props: ${allProps.join(', ')}`);
  }
  lines.push('- Children (potential)');
  lines.push('- Context data (potential)');
  lines.push('');
  
  lines.push('**Output:**');
  lines.push('- Rendered JSX/TSX elements');
  lines.push('- Callback function calls to parent components');
  lines.push('- Side effects (API calls, state updates)');
  lines.push('');
}

/**
 * Generate usage guidelines and integration patterns
 */
export function generateUsageGuidelines(lines, componentResults, componentName) {
  lines.push('### Basic Usage');
  lines.push('');
  
  const components = componentResults.flatMap(r => r.components);
  const mainComponent = components.find(c => 
    c.name.toLowerCase().includes(componentName.toLowerCase())
  ) || components[0];
  
  if (mainComponent) {
    lines.push('```jsx');
    lines.push(`import { ${mainComponent.name} } from './path/to/${mainComponent.name}';`);
    lines.push('');
    lines.push('function App() {');
    lines.push('  return (');
    lines.push(`    <${mainComponent.name}`);
    
    const allProps = [...new Set(componentResults.flatMap(r => r.props))];
    if (allProps.length > 0) {
      for (const prop of allProps.slice(0, 3)) {
        lines.push(`      ${prop}={/* provide value */}`);
      }
      if (allProps.length > 3) {
        lines.push(`      // ... ${allProps.length - 3} more props`);
      }
    }
    
    lines.push('    />');
    lines.push('  );');
    lines.push('}');
    lines.push('```');
  } else {
    lines.push('```jsx');
    lines.push(`// Usage example for ${componentName}`);
    lines.push(`<${componentName} />`);
    lines.push('```');
  }
  lines.push('');
  
  // Integration patterns
  lines.push('### Integration Patterns');
  lines.push('');
  
  const imports = componentResults.flatMap(r => r.imports);
  const hasRouter = imports.some(imp => imp.includes('router'));
  const hasStateManagement = imports.some(imp => imp.includes('redux') || imp.includes('zustand') || imp.includes('context'));
  const hasApiCalls = imports.some(imp => imp.includes('axios') || imp.includes('fetch'));
  
  if (hasRouter) {
    lines.push('**Routing Integration:**');
    lines.push('- Component integrates with routing system');
    lines.push('- May handle route parameters and navigation');
    lines.push('');
  }
  
  if (hasStateManagement) {
    lines.push('**State Management:**');
    lines.push('- Connected to application state management');
    lines.push('- May dispatch actions or consume global state');
    lines.push('');
  }
  
  if (hasApiCalls) {
    lines.push('**API Integration:**');
    lines.push('- Makes HTTP requests to backend services');
    lines.push('- Handles loading, success, and error states');
    lines.push('');
  }
  
  lines.push('**Parent Component Requirements:**');
  lines.push('- Provide required props and context');
  lines.push('- Handle callback functions appropriately');
  lines.push('- Ensure proper error boundaries');
  lines.push('');
  
  lines.push('**Child Component Composition:**');
  if (components.length > 1) {
    lines.push('- Contains multiple sub-components');
    lines.push('- Manages component composition and data flow');
  } else {
    lines.push('- Standalone component or leaf node');
    lines.push('- May accept children for content composition');
  }
  lines.push('');
}

/**
 * Generate implementation summary and technical details
 */
export function generateImplementationSummary(lines, componentResults) {
  const components = componentResults.flatMap(r => r.components);
  const hooks = componentResults.flatMap(r => r.hooks);
  const imports = componentResults.flatMap(r => r.imports);
  
  lines.push('### Technical Stack');
  lines.push('');
  
  // Component type analysis
  const functionalComponents = components.filter(c => c.type === 'functional');
  const classComponents = components.filter(c => c.type === 'class');
  
  lines.push('**Component Architecture:**');
  if (functionalComponents.length > 0) {
    lines.push(`- ${functionalComponents.length} functional component(s)`);
  }
  if (classComponents.length > 0) {
    lines.push(`- ${classComponents.length} class component(s)`);
  }
  lines.push(`- Total hooks used: ${hooks.length}`);
  lines.push('');
  
  // Hook usage analysis
  if (hooks.length > 0) {
    lines.push('**React Hooks Usage:**');
    const hookTypes = [...new Set(hooks.map(h => h.hook))];
    for (const hookType of hookTypes) {
      const count = hooks.filter(h => h.hook === hookType).length;
      lines.push(`- ${hookType}: ${count} instance(s)`);
    }
    lines.push('');
  }
  
  // Complexity analysis
  lines.push('### Complexity Analysis');
  lines.push('');
  
  const totalFiles = componentResults.length;
  const avgHooksPerFile = totalFiles > 0 ? (hooks.length / totalFiles).toFixed(1) : 0;
  const avgImportsPerFile = totalFiles > 0 ? (imports.length / totalFiles).toFixed(1) : 0;
  
  let complexity = 'Low';
  if (hooks.length > 5 || imports.length > 10) complexity = 'Medium';
  if (hooks.length > 10 || imports.length > 20) complexity = 'High';
  
  lines.push(`**Complexity Level:** ${complexity}`);
  lines.push(`**Metrics:**`);
  lines.push(`- Files: ${totalFiles}`);
  lines.push(`- Components: ${components.length}`);
  lines.push(`- Average hooks per file: ${avgHooksPerFile}`);
  lines.push(`- Average imports per file: ${avgImportsPerFile}`);
  lines.push('');
  
  // Testing recommendations
  lines.push('### Testing Recommendations');
  lines.push('');
  
  if (hooks.some(h => h.hook === 'useEffect')) {
    lines.push('**Unit Testing:**');
    lines.push('- Test useEffect side effects and cleanup');
    lines.push('- Mock external dependencies and API calls');
    lines.push('- Test state changes and user interactions');
    lines.push('');
  }
  
  if (hooks.some(h => h.hook === 'useState')) {
    lines.push('**State Testing:**');
    lines.push('- Test initial state values');
    lines.push('- Test state updates and transitions');
    lines.push('- Test state-dependent rendering');
    lines.push('');
  }
  
  lines.push('**Integration Testing:**');
  lines.push('- Test component with realistic props');
  lines.push('- Test parent-child component interactions');
  lines.push('- Test error handling and edge cases');
  lines.push('');
  
  // Performance considerations
  lines.push('### Performance Considerations');
  lines.push('');
  
  if (hooks.some(h => h.hook === 'useCallback' || h.hook === 'useMemo')) {
    lines.push('✅ **Optimization detected:** Component uses memoization hooks');
  } else if (hooks.length > 3) {
    lines.push('⚠️ **Consider optimization:** Multiple hooks may benefit from memoization');
  }
  
  if (components.length > 3) {
    lines.push('⚠️ **Consider splitting:** Large component may benefit from decomposition');
  }
  
  lines.push('');
  
  // Maintenance notes
  lines.push('### Maintenance Notes');
  lines.push('');
  lines.push('**Documentation Status:**');
  lines.push('- ✅ Component structure analyzed');
  lines.push('- ⚠️ Detailed prop documentation needed');
  lines.push('- ⚠️ Business logic documentation needed');
  lines.push('');
  
  lines.push('**Next Steps:**');
  lines.push('1. Add comprehensive prop documentation');
  lines.push('2. Document business logic and use cases');
  lines.push('3. Add unit and integration tests');
  lines.push('4. Consider performance optimizations');
  lines.push('5. Add accessibility testing');
  lines.push('');
}
