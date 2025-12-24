import { summarizeWithLLM } from './llm.js';
import { analyzeComponentArchitecture, generateArchitecturalDocumentation, generateDataFlowDiagram } from './deep-component-analyzer.js';
import { extractAPIEndpoints, formatAPIDocumentation } from './api-extractor.js';
import fs from 'fs';
import path from 'path';

/**
 * Extract all column fields from ppmReportFieldMapping file with default status
 */
function extractAllColumnFields(projectRoot) {
  const allFields = [];
  
  try {
    // Read ppmReportFieldMapping.js for all available fields
    const fieldMappingPath = path.join(projectRoot, 'src', 'constants', 'fieldMappings', 'ppmReportFieldMapping.js');
    
    // Read staticData.js for default fields list
    const staticDataPath = path.join(projectRoot, 'src', 'constants', 'staticData.js');
    
    let defaultFields = new Set();
    let allFieldsMap = new Map();
    
    // Extract default fields from ppmReportFieldList in staticData.js
    if (fs.existsSync(staticDataPath)) {
      const staticDataContent = fs.readFileSync(staticDataPath, 'utf8');
      
      // Extract fields from ppmReportFieldList - look for patterns like:
      // { key: ppmReportFieldMapping.PPM_REPORT_PONUMBER }
      const defaultFieldPattern = /ppmReportFieldMapping\.(PPM_REPORT_\w+)/g;
      let match;
      
      // Look specifically in ppmReportFieldList section
      const ppmReportListMatch = staticDataContent.match(/export\s+const\s+ppmReportFieldList\s*=[\s\S]*?\];/);
      if (ppmReportListMatch) {
        const listContent = ppmReportListMatch[0];
        while ((match = defaultFieldPattern.exec(listContent)) !== null) {
          defaultFields.add(match[1]);
        }
      }
      
      console.log(`✅ Found ${defaultFields.size} default column fields in search criteria`);
    }
    
    // Extract all available fields from field mapping with their actual mapping values
    if (fs.existsSync(fieldMappingPath)) {
      const fieldMappingContent = fs.readFileSync(fieldMappingPath, 'utf8');
      
      // Match pattern: PPM_REPORT_FIELD_NAME: 'mapping.value'
      const fieldPattern = /(PPM_REPORT_\w+):\s*['"]([^'"]+)['"]/g;
      let match;
      
      while ((match = fieldPattern.exec(fieldMappingContent)) !== null) {
        const fieldName = match[1];
        const mappingValue = match[2];
        
        if (fieldName !== 'REPORT_PO_NUMBER' && fieldName !== 'REPORT_ID') {
          const label = fieldName
            .replace(/PPM_REPORT_/, '')
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0) + word.slice(1).toLowerCase())
            .join(' ');
          
          allFieldsMap.set(fieldName, {
            name: fieldName,
            label: label,
            mapping: mappingValue, // Use actual mapping value from the file
            isDefault: defaultFields.has(fieldName),
            isExport: true // All fields are exportable
          });
        }
      }
      
      // Convert to array, putting default fields first
      const defaultFieldsArray = [];
      const nonDefaultFieldsArray = [];
      
      for (const [fieldName, fieldInfo] of allFieldsMap) {
        if (fieldInfo.isDefault) {
          defaultFieldsArray.push(fieldInfo);
        } else {
          nonDefaultFieldsArray.push(fieldInfo);
        }
      }
      
      allFields.push(...defaultFieldsArray, ...nonDefaultFieldsArray);
      
      console.log(`✅ Extracted ${allFields.length} total column fields (${defaultFieldsArray.length} default, ${nonDefaultFieldsArray.length} additional)`);
    }
  } catch (error) {
    console.log('⚠️  Could not extract all column fields:', error.message);
  }
  
  return allFields;
}

/**
 * Generate Set Column Order section from field definitions
 */
function generateSetColumnOrderSection(fieldDefinitions, projectRoot) {
  const lines = [];
  
  // First try to get all fields from the field mapping file with default status
  let allFields = extractAllColumnFields(projectRoot);
  
  // If we couldn't extract from field mapping, fall back to search criteria fields
  if (allFields.length === 0 && fieldDefinitions && fieldDefinitions.length > 0) {
    allFields = fieldDefinitions.map(field => ({
      name: field.name,
      label: field.label || field.name.replace(/PPM_REPORT_|PO_SEARCH_/g, '').replace(/_/g, ' '),
      mapping: field.name.replace(/PPM_REPORT_|PO_SEARCH_/g, '').replace(/_/g, ' '),
      isDefault: true, // Search criteria fields are considered default
      isExport: true
    }));
  }
  
  if (allFields.length === 0) {
    return lines;
  }
  
  lines.push('## Set Column Order');
  lines.push('');
  lines.push('|Label|Mapping|Default|Export|');
  lines.push('|---|---|---|---|');
  
  allFields.forEach(field => {
    const mapping = field.mapping || field.name.replace(/PPM_REPORT_|PO_SEARCH_/g, '').replace(/_/g, ' ');
    const label = field.label || mapping;
    const isDefault = field.isDefault ? '✓' : '-';
    const isExport = field.isExport ? '✓' : '-';
    
    lines.push(`|${label}|${mapping}|${isDefault}|${isExport}|`);
  });
  
  lines.push('');
  
  return lines;
}

/**
 * Generate Filters section from ppmReportFieldList (search criteria fields)
 */
function generateFiltersSection(projectRoot) {
  const lines = [];
  
  try {
    const slicePath = path.join(projectRoot, 'src', 'features', 'ppmReport', 'ppmReportRequestSlice.js');
    const fieldMappingPath = path.join(projectRoot, 'src', 'constants', 'fieldMappings', 'ppmReportFieldMapping.js');
    
    if (!fs.existsSync(slicePath) || !fs.existsSync(fieldMappingPath)) {
      console.log('⚠️ Could not find ppmReportRequestSlice.js or ppmReportFieldMapping.js');
      return lines;
    }
    
    const sliceContent = fs.readFileSync(slicePath, 'utf-8');
    const fieldMappingContent = fs.readFileSync(fieldMappingPath, 'utf-8');
    
    // Extract filter fields from selectedFilters in the Redux slice
    const filterFields = [];
    
    // Find selectedFilters - it's a ternary with showForNONPROD ? {...} : {...}
    // We need to capture both branches to get all possible filters
    const selectedFiltersMatch = sliceContent.match(/selectedFilters:\s*showForNONPROD\s*\?\s*\{([\s\S]*?)\}\s*:\s*\{([\s\S]*?)\}/);
    if (!selectedFiltersMatch) {
      console.log('⚠️ Could not find selectedFilters in Redux slice');
      return lines;
    }
    
    // Combine both branches of the ternary to get all filters
    const selectedFiltersContent = selectedFiltersMatch[1] + selectedFiltersMatch[2];
    
    // Extract all field references - including those in spread operators
    // Pattern matches: ppmReportFieldMapping.PPM_REPORT_ITEM_STATUS
    const fieldPattern = /ppmReportFieldMapping\.(PPM_REPORT_\w+)/g;
    let match;
    const fieldNames = new Set();
    
    while ((match = fieldPattern.exec(selectedFiltersContent)) !== null) {
      fieldNames.add(match[1]);
    }
    
    console.log(`Found ${fieldNames.size} filter fields in selectedFilters`);
    
    // Now extract the labels and mappings for these fields
    const fieldMappingPattern = /(PPM_REPORT_\w+):\s*['"]([^'"]+)['"]/g;
    const fieldMappings = new Map();
    
    while ((match = fieldMappingPattern.exec(fieldMappingContent)) !== null) {
      const fieldName = match[1];
      const mapping = match[2];
      if (fieldNames.has(fieldName)) {
        fieldMappings.set(fieldName, mapping);
      }
    }
    
    // Create filter entries with labels and mappings
    for (const fieldName of fieldNames) {
      const mapping = fieldMappings.get(fieldName) || '';
      const label = fieldName.replace('PPM_REPORT_', '').replace(/_/g, ' ');
      
      filterFields.push({
        label: label,
        mapping: mapping
      });
    }
    
    if (filterFields.length === 0) {
      return lines;
    }
    
    // Sort by label for better organization
    filterFields.sort((a, b) => a.label.localeCompare(b.label));
    
    lines.push('## Filters');
    lines.push('');
    lines.push('|Label|Mapping|');
    lines.push('|---|---|');
    
    filterFields.forEach(field => {
      lines.push(`|${field.label}|${field.mapping}|`);
    });
    
    lines.push('');
    
    console.log(`✅ Generated Filters section with ${filterFields.length} fields`);
    
  } catch (e) {
    console.log('❌ Error generating Filters section:', e.message);
  }
  
  return lines;
}

/**
 * Extract search criteria fields from component code in correct UI order
 */
function extractSearchCriteriaFields(content, staticDataContent = '', projectRoot = '') {
  const fields = [];
  const fieldOrder = [];
  
  // Load field mappings to get the actual API paths
  const fieldMappings = new Map();
  if (projectRoot) {
    try {
      const fieldMappingPath = path.join(projectRoot, 'src', 'constants', 'fieldMappings', 'ppmReportFieldMapping.js');
      if (fs.existsSync(fieldMappingPath)) {
        const fieldMappingContent = fs.readFileSync(fieldMappingPath, 'utf-8');
        const mappingPattern = /(PPM_REPORT_\w+):\s*['"]([^'"]+)['"]/g;
        let match;
        while ((match = mappingPattern.exec(fieldMappingContent)) !== null) {
          fieldMappings.set(match[1], match[2]);
        }
      }
    } catch (e) {
      console.log('⚠️ Could not load field mappings:', e.message);
    }
  }
  
  // Extract the actual field list order from ppmReportFieldList usage
  // Look for imported ppmReportFieldList and try to find its definition
  const fieldListImportMatch = content.match(/from\s+['"]([^'"]*staticData[^'"]*)['"]/);
  
  // Standard field order based on ppmReportFieldList from staticData.js
  const standardFieldOrder = [
    'PPM_REPORT_PONUMBER',
    'PPM_REPORT_LINE_NUMBER',
    'PPM_REPORT_TR_CO_PONUMBER',
    'PPM_REPORT_STYLE_NUMBER',
    'PPM_REPORT_ITEM_STATUS',
    'PPM_REPORT_VENDOR',
    'PPM_REPORT_PMO_DEC_CODE',
    'PPM_REPORT_DIVISION_CODE',
    'PPM_REPORT_DOC_TYPE_CODE',
    'PPM_REPORT_DOC_DATE',
    'PPM_REPORT_CHANGED_DATE',
    'PPM_REPORT_MRGAC',
    'PPM_REPORT_OGAC',
    'PPM_REPORT_GAC',
    'PPM_REPORT_ORIGIN_RECEIPT_ACTUAL_DATE',
    'PPM_REPORT_CREATED_DATE',
    'PPM_REPORT_ACCEPT_PO_ACTUAL_DATE',
    'PPM_REPORT_FACTORY_DELIVERY_ACTUAL_DATE',
    'PPM_REPORT_CURRENT_EVENT_DATE',
    'PPM_REPORT_NEXT_EVENT_DATE',
    'PPM_REPORT_ASIAN_CC_LAST_UPDATED_DATE',
    'PPM_REPORT_SEASON_CODE',
    'PPM_REPORT_SEASON_YEAR',
    'PPM_REPORT_GAC_REASON_CODE',
    'PPM_REPORT_DIRECT_SALES_ORDER_NUMBER',
    'PPM_REPORT_PRODUCT_CODE',
    'PPM_REPORT_CURRENT_EVENT',
    'PPM_REPORT_NEXT_EVENT',
    'PPM_REPORT_CATEGORY_CODE',
    'PPM_REPORT_MIDSOLE_CODE',
    'PPM_REPORT_OUTSOLE_CODE',
    'PPM_REPORT_PURCHASE_GROUP_CODE',
    'PPM_REPORT_PURCHASE_ORG_CODE',
    'PPM_REPORT_GEOGRAPHY_CODE',
    'PPM_REPORT_ORDER_REASON_CODE',
    'PPM_REPORT_DIVERT_FLAG',
    'PPM_REPORT_ASIAN_CC',
    'PPM_REPORT_FIELDS_OF_PLAY_NAME',
    'PPM_REPORT_BIS_CLASSIFICATION',
    'PPM_REPORT_SHIPPING_TYPE'
  ];
  
  // Extract initial field state to determine default values and types
  // Use staticDataContent if provided, otherwise try to extract from content
  const sourceContent = staticDataContent || content;
  const initialFieldStateMap = new Map();
  const initialStatePattern = /\[ppmReportFieldMapping\.(\w+)\]:\s*(\[\]|''|'[^']*'|{\s*from:\s*null,\s*to:\s*null\s*})/g;
  let stateMatch;
  
  while ((stateMatch = initialStatePattern.exec(sourceContent)) !== null) {
    const fieldKey = stateMatch[1];
    const defaultValue = stateMatch[2].trim();
    
    let inputMode = 'Single value';
    
    if (defaultValue === '[]') {
      inputMode = 'Multiple values (array)';
    } else if (defaultValue.includes('from:') && defaultValue.includes('to:')) {
      inputMode = 'Date range (from/to)';
    } else if (defaultValue === "''" || defaultValue.startsWith("'")) {
      inputMode = 'Single value';
    }
    
    initialFieldStateMap.set(fieldKey, { inputMode, defaultValue });
  }
  
  // Extract field configurations from getAdditionalProps function
  const fieldConfigMap = new Map();
  const additionalPropsMatch = content.match(/function\s+getAdditionalProps\s*\([^)]*\)\s*{[\s\S]*?return\s*{([\s\S]*?)}\s*;?\s*}/);
  
  if (additionalPropsMatch) {
    const propsContent = additionalPropsMatch[1];
    
    // Extract each field configuration
    const fieldPattern = /\[ppmReportFieldMapping\.(\w+)\]:\s*(?:showForMultiSelect\s*\?\s*)?{([^}]+(?:{[^}]*}[^}]*)*?)}/g;
    let match;
    
    while ((match = fieldPattern.exec(propsContent)) !== null) {
      const fieldKey = match[1];
      const fieldConfig = match[2];
      
      // Get initial state info
      const initialState = initialFieldStateMap.get(fieldKey) || { inputMode: 'Single value' };
      
      const field = {
        name: fieldKey,
        type: 'text',
        inputMode: initialState.inputMode,
        validation: '',
        options: '',
        label: '',
        mapping: fieldMappings.get(fieldKey) || ''
      };
      
      // Determine field type based on configuration
      const typeMatch = fieldConfig.match(/type:\s*['"](\w+)['"]/);
      if (typeMatch) {
        field.type = typeMatch[1];
      }
      
      // Check for date range fields (fields with 'group:' property or date range initial state)
      if (fieldConfig.includes('group:') || initialState.inputMode === 'Date range (from/to)') {
        field.type = 'date-range';
        field.inputMode = 'Date range (from/to)';
      }
      
      // Extract label with conditional logic
      const labelPattern = /label:\s*(?:hasFPCAccess\s*&&\s*showForFPC\s*\?\s*['"]([^'"]+)['"]\s*:\s*)?['"]([^'"]+)['"]/;
      const labelMatch = fieldConfig.match(labelPattern);
      if (labelMatch) {
        field.label = labelMatch[2] || labelMatch[1] || '';
      }
      
      // Extract maxLength validation
      const maxLengthMatch = fieldConfig.match(/maxLength:\s*(\d+)/);
      if (maxLengthMatch) {
        field.validation = `Max ${maxLengthMatch[1]} chars`;
      }
      
      // Check for validation function
      if (fieldConfig.includes('validateInput:')) {
        if (!field.validation) {
          field.validation = 'Input validation required';
        } else {
          field.validation += ', validated';
        }
      }
      
      // Extract options/dropdown configuration
      if (fieldConfig.includes('options:')) {
        const optionsMatch = fieldConfig.match(/options:\s*(\[[\s\S]*?\]|\w+)/);
        if (optionsMatch) {
          const optionsStr = optionsMatch[1];
          if (optionsStr.startsWith('[')) {
            // Count inline options
            const textMatches = optionsStr.match(/text:\s*['"][^'"]+['"]/g);
            if (textMatches && textMatches.length > 0) {
              field.type = 'dropdown';
              field.options = `${textMatches.length} options`;
              // Update input mode based on initial state
              if (initialState.inputMode === 'Multiple values (array)') {
                field.inputMode = `Multi-select (${textMatches.length} options)`;
              } else {
                field.inputMode = `Single-select (${textMatches.length} options)`;
              }
            }
          } else {
            // Named options variable
            field.type = 'dropdown';
            field.options = 'Select from list';
            if (initialState.inputMode === 'Multiple values (array)') {
              field.inputMode = 'Multi-select dropdown';
            } else {
              field.inputMode = 'Single-select dropdown';
            }
          }
        }
      }
      
      // Check for getOptionLabel (another indicator of dropdown)
      if (fieldConfig.includes('getOptionLabel')) {
        field.type = 'dropdown';
        if (!field.options) {
          field.options = 'Select option';
          if (initialState.inputMode === 'Multiple values (array)') {
            field.inputMode = 'Multi-select dropdown';
          } else if (!field.inputMode.includes('select')) {
            field.inputMode = 'Single-select dropdown';
          }
        }
      }
      
      // Check for gridSpan (multi-column field)
      if (fieldConfig.includes('gridSpan:')) {
        if (!field.validation) field.validation = '';
        const gridMatch = fieldConfig.match(/gridSpan:\s*(\d+)/);
        if (gridMatch && gridMatch[1] !== '1') {
          // This is useful metadata but we won't display it in the table
        }
      }
      
      fieldConfigMap.set(fieldKey, field);
    }
  }
  
  // Build ordered fields based on standard order
  const orderedFields = [];
  for (const fieldKey of standardFieldOrder) {
    // If field is in initialFieldStateMap, include it even if not in getAdditionalProps
    if (fieldConfigMap.has(fieldKey)) {
      orderedFields.push(fieldConfigMap.get(fieldKey));
    } else if (initialFieldStateMap.has(fieldKey)) {
      // Field exists in initialState but not in getAdditionalProps - add with defaults
      const initialState = initialFieldStateMap.get(fieldKey);
      const fieldName = fieldKey.replace(/PPM_REPORT_|PO_SEARCH_/g, '').replace(/_/g, ' ');
      
      let fieldType = 'text';
      if (initialState.inputMode === 'Date range (from/to)') {
        fieldType = 'date-range';
      } else if (initialState.inputMode === 'Multiple values (array)') {
        fieldType = 'text'; // Could be dropdown or text, default to text
      }
      
      orderedFields.push({
        name: fieldKey,
        type: fieldType,
        inputMode: initialState.inputMode,
        validation: '',
        options: '',
        label: fieldName
      });
    }
  }
  
  // Add any remaining fields not in standard order
  for (const [fieldKey, field] of fieldConfigMap) {
    if (!standardFieldOrder.includes(fieldKey)) {
      field.mapping = fieldMappings.get(fieldKey) || field.mapping || '';
      orderedFields.push(field);
    }
  }
  
  // Add fields from initialState not in standard order
  for (const [fieldKey, initialState] of initialFieldStateMap) {
    if (!standardFieldOrder.includes(fieldKey) && !fieldConfigMap.has(fieldKey)) {
      const fieldName = fieldKey.replace(/PPM_REPORT_|PO_SEARCH_/g, '').replace(/_/g, ' ');
      let fieldType = 'text';
      if (initialState.inputMode === 'Date range (from/to)') {
        fieldType = 'date-range';
      }
      
      orderedFields.push({
        name: fieldKey,
        type: fieldType,
        inputMode: initialState.inputMode,
        validation: '',
        options: '',
        label: fieldName,
        mapping: fieldMappings.get(fieldKey) || ''
      });
    }
  }
  
  return orderedFields;
}

/**
 * Extract API calls, payloads, and responses from Redux slice files
 */
function extractAPIInformation(codebasePath, componentPath) {
  const apiInfo = [];
  
  try {
    console.log('📡 Extracting API information');
    console.log('   Component path:', componentPath);
    console.log('   Codebase path:', codebasePath);
    
    // Find the project root by looking for src directory
    let projectRoot = codebasePath;
    if (projectRoot.includes('/src/') || projectRoot.includes('\\src\\')) {
      // Extract project root before /src/
      projectRoot = projectRoot.split(/[\/\\]src[\/\\]/)[0];
    }
    console.log('   Project root:', projectRoot);
    
    // Determine the Redux slice path based on component path
    let slicePath = '';
    if (componentPath.includes('PPMReport') || componentPath.includes('TPPMReport')) {
      slicePath = path.join(projectRoot, 'src', 'features', 'ppmReport', 'ppmReportRequestSlice.js');
    } else if (componentPath.includes('LineSummaryReport') || componentPath.includes('TLineSummaryReport')) {
      slicePath = path.join(projectRoot, 'src', 'features', 'lineSummaryReport', 'lineSummaryReportRequestSlice.js');
    } else if (componentPath.includes('POReport') || componentPath.includes('TPOReport')) {
      slicePath = path.join(projectRoot, 'src', 'features', 'poReport', 'poReportRequestSlice.js');
    }
    
    console.log('🔍 Checking for slice file at:', slicePath);
    
    if (!slicePath || !fs.existsSync(slicePath)) {
      console.log('⚠️  Redux slice file not found');
      return apiInfo;
    }
    
    console.log('✅ Found Redux slice file');
    const sliceContent = fs.readFileSync(slicePath, 'utf8');
    
    // Extract request function calls that use the 'request' utility
    const requestPattern = /request\s*\(\s*{[\s\S]*?api:\s*['"]([^'"]+)['"][\s\S]*?method:\s*['"]([^'"]+)['"][\s\S]*?data:\s*(\w+)[\s\S]*?}\s*,/g;
    let match;
    
    while ((match = requestPattern.exec(sliceContent)) !== null) {
      const endpoint = match[1];
      const method = match[2];
      const dataVar = match[3];
      
      const api = {
        name: endpoint.replace(/([A-Z])/g, ' $1').trim(),
        endpoint: endpoint,
        method: method.toUpperCase(),
        payload: [],
        response: []
      };
      
      // Try to find the data variable definition before the request call
      const dataDefPattern = new RegExp(`const ${dataVar}\\s*=\\s*{([\\s\\S]*?)};`, 'g');
      const dataDefMatch = dataDefPattern.exec(sliceContent);
      
      if (dataDefMatch) {
        const payloadContent = dataDefMatch[1];
        // Extract field names from the payload
        const fieldMatches = payloadContent.match(/(\w+):/g);
        if (fieldMatches) {
          api.payload = fieldMatches.map(f => f.replace(':', '')).filter(f => 
            !['filter', 'filters', 'fields'].includes(f) || f.length > 2
          );
        }
      }
      
      // Look for response handling - find the .then() callback after this request
      const requestIndex = match.index;
      const afterRequest = sliceContent.substring(requestIndex, requestIndex + 2000);
      const responseMatch = afterRequest.match(/\.then\(\(response:\s*Object\)\s*=>\s*{[\s\S]{0,500}/);
      
      if (responseMatch) {
        const responseCode = responseMatch[0];
        // Extract response.data field accesses
        const respFieldMatches = responseCode.match(/response\.data\.(\w+)/g);
        if (respFieldMatches) {
          api.response = [...new Set(respFieldMatches.map(m => m.replace('response.data.', '')))];
        }
        
        // Check for flattened response
        if (responseCode.includes('getflattenResponse')) {
          api.response.push('results (flattened array)');
          api.response.push('total');
          api.response.push('filters');
        }
      }
      
      apiInfo.push(api);
      console.log(`✅ Found API: ${api.endpoint} (${api.method})`);
    }
    
    console.log(`✅ Extracted ${apiInfo.length} API call(s)`);
  } catch (e) {
    console.log('❌ Could not extract API information:', e.message);
  }
  
  return apiInfo;
}

export async function generateBusinessDocumentation({ query, searchResults, userDocs = [], codebasePath, componentName }) {
  const lines = [];
  const timestamp = new Date().toISOString().split('T')[0];
  const title = componentName ? `${componentName} Component Guide` : `Feature Documentation: ${query}`;
  
  // Executive Summary Header
  lines.push(`# ${title}`);
  lines.push('');
  lines.push(`**📅 Generated:** ${timestamp}`);
  lines.push(`**🔍 Analysis Scope:** ${componentName || query}`);
  lines.push(`**📁 Codebase:** ${codebasePath}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // SECTION 1: EXPLANATION
  lines.push('## Explanation');
  lines.push('');
  
  const fileCount = searchResults?.length || 0;
  const codeMatches = searchResults?.reduce((acc, r) => acc + (r.snippets?.length || 0), 0) || 0;

  // Deep Component Architecture Analysis
  let componentAnalyses = [];
  if (componentName && searchResults?.length > 0) {
    console.log('🔍 Performing deep component architecture analysis...');
    
    componentAnalyses = searchResults
      .filter(result => result.path.endsWith('.jsx') || result.path.endsWith('.tsx') || result.path.endsWith('.js') || result.path.endsWith('.ts'))
      .map(result => {
        if (fs.existsSync(result.path)) {
          return analyzeComponentArchitecture(result.path);
        }
        return null;
      })
      .filter(analysis => analysis !== null);
    
    console.log(`✅ Analyzed ${componentAnalyses.length} component file(s)`);
  }

  // AI-Powered Business Analysis with Architecture Context
  const hasLLMConfig = process.env.OPENAI_API_KEY || 
    (process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_DEPLOYMENT_NAME);
  
  if (hasLLMConfig && searchResults?.length > 0) {
    try {
      console.log('🤖 Generating AI analysis for Explanation section...');
      
      // Include architectural context in the prompt
      let architecturalContext = '';
      if (componentAnalyses.length > 0) {
        const mainAnalysis = componentAnalyses[0];
        architecturalContext = `

ARCHITECTURAL CONTEXT:
- Child Components: ${mainAnalysis.childComponents.map(c => c.name).join(', ')}
- State Variables: ${mainAnalysis.state.map(s => s.variable).join(', ')}
- Hooks Used: ${[...new Set(mainAnalysis.hooks)].join(', ')}
- Props Interface: ${mainAnalysis.props.join(', ')}
`;
      }
      
      const businessPrompt = `Analyze this ${componentName ? 'React component' : 'feature'} and provide a CLEAR, DETAILED explanation.

${componentName ? `Component: ${componentName}` : `Feature: ${query}`}
Files analyzed: ${searchResults.length}
${architecturalContext}

Provide a comprehensive explanation in approximately 10 lines covering:

1. **What it does** - Core functionality (2-3 sentences)
2. **Purpose** - Business value and user benefits (2 sentences)
3. **Key capabilities** - Main features and interactions (5-7 bullet points with brief descriptions)
4. **Technical context** - How it fits in the system (1-2 sentences)

Target approximately 200-250 words. Be specific and informative while remaining concise.`;

      const llmResult = await summarizeWithLLM({ 
        userPrompt: businessPrompt,
        systemPrompt: 'You are a technical writer who provides clear, detailed explanations. Write approximately 10 lines covering what the component does, its purpose, key capabilities, and technical context. Be informative and specific.'
      });
      
      if (llmResult && llmResult.trim()) {
        lines.push(llmResult.trim());
        lines.push('');
        console.log('✅ AI analysis successfully generated');
      }
    } catch (e) {
      console.error('❌ AI analysis failed:', e.message);
    }
  }

  // SEARCH CRITERIA FIELDS - Right after Explanation
  if (searchResults && searchResults.length > 0) {
    const mainFile = searchResults[0];
    if (fs.existsSync(mainFile.path)) {
      try {
        const content = fs.readFileSync(mainFile.path, 'utf8');
        
        // Try to read staticData.js for field initial states
        let staticDataContent = '';
        const staticDataMatch = content.match(/from\s+['"]([^'"]*staticData[^'"]*)['"]/);
        if (staticDataMatch) {
          const relPath = staticDataMatch[1];
          const mainFileDir = path.dirname(mainFile.path);
          
          // Resolve the relative path from the component file
          const staticDataPath = path.resolve(mainFileDir, relPath + '.js');
          
          if (fs.existsSync(staticDataPath)) {
            staticDataContent = fs.readFileSync(staticDataPath, 'utf8');
            console.log('✅ Found staticData.js for field states at:', staticDataPath);
          } else {
            console.log('⚠️  staticData.js not found at:', staticDataPath);
          }
        }
        
        // Extract projectRoot from codebasePath early for use in extractSearchCriteriaFields
        let projectRoot = codebasePath;
        if (projectRoot.includes('/src/') || projectRoot.includes('\\src\\')) {
          projectRoot = projectRoot.split(/[\/\\]src[\/\\]/)[0];
        }
        
        // Extract field mappings and types in correct UI order
        const fieldDefinitions = extractSearchCriteriaFields(content, staticDataContent, projectRoot);
        
        if (fieldDefinitions && fieldDefinitions.length > 0) {
          lines.push('## Search Criteria Fields');
          lines.push('');
          lines.push('|Field Name|Mapping|Type|Input Mode|Validation/Options|Description|');
          lines.push('|---|---|---|---|---|---|');
          
          fieldDefinitions.forEach(field => {
            const fieldName = field.name.replace(/PPM_REPORT_|PO_SEARCH_/g, '').replace(/_/g, ' ');
            const mapping = field.mapping || '-';
            const type = field.type || 'text';
            const inputMode = field.inputMode || 'Single value';
            const validation = field.validation || field.options || '-';
            const description = field.label || '-';
            
            lines.push(`|${fieldName}|${mapping}|${type}|${inputMode}|${validation}|${description}|`);
          });
          
          lines.push('');
          
          // Add Set Column Order section right after Search Criteria Fields
          
          const columnOrderLines = generateSetColumnOrderSection(fieldDefinitions, projectRoot);
          lines.push(...columnOrderLines);
          
          // Add Filters section right after Set Column Order
          const filterLines = generateFiltersSection(projectRoot);
          lines.push(...filterLines);
        }
      } catch (e) {
        console.log('Could not extract search criteria fields:', e.message);
      }
    }
  }

  // SECTION 2: LAYOUT & DESIGN
  lines.push('## Layout & Design');
  lines.push('');
  
  if (searchResults && searchResults.length > 0) {
    lines.push('### Component Structure');
    lines.push('');
    
    // Group files by type
    const components = searchResults.filter(r => r.path.includes('.jsx') || r.path.includes('.tsx'));
    const styles = searchResults.filter(r => r.path.includes('.css') || r.path.includes('.scss') || r.path.includes('.sass'));
    
    if (components.length > 0) {
      lines.push('**UI Components:**');
      lines.push('');
      components.forEach(comp => {
        const name = comp.path.split('/').pop().replace(/\.(jsx|tsx|js|ts)$/, '');
        const matches = comp.snippets?.length || 0;
        lines.push(`- **${name}** - ${matches} implementation${matches === 1 ? '' : 's'} found`);
      });
      lines.push('');
    }
    
    if (styles.length > 0) {
      lines.push('**Styling:**');
      lines.push('');
      styles.forEach(style => {
        const name = style.path.split('/').pop();
        lines.push(`- ${name}`);
      });
      lines.push('');
    }
  }
  
  // Add detailed architectural analysis
  if (componentAnalyses.length > 0) {
    lines.push('### Component Architecture');
    lines.push('');
    const architecturalLines = generateArchitecturalDocumentation(componentAnalyses);
    lines.push(...architecturalLines);
    
    lines.push('### Data Flow');
    lines.push('');
    const dataFlowLines = generateDataFlowDiagram(componentAnalyses);
    lines.push(...dataFlowLines);
  }
  
  lines.push('### Visual Design Notes');
  lines.push('');
  lines.push('*Layout patterns, UI/UX considerations, and design system usage*');
  lines.push('');

  // SECTION 3: API & EVENTS
  lines.push('## API & Events');
  lines.push('');
  
  // Extract and document API calls using enhanced extractor
  if (searchResults && searchResults.length > 0) {
    const mainFile = searchResults[0];
    const apiEndpoints = extractAPIEndpoints(codebasePath, mainFile.path);
    
    if (apiEndpoints && apiEndpoints.length > 0) {
      const apiDocLines = formatAPIDocumentation(apiEndpoints);
      lines.push(...apiDocLines);
    }
  }
  
  if (componentAnalyses.length > 0) {
    const mainAnalysis = componentAnalyses[0];
    
    // Props (API)
    if (mainAnalysis.props && mainAnalysis.props.length > 0) {
      lines.push('### Props');
      lines.push('');
      lines.push('| Prop | Type | Description |');
      lines.push('|------|------|-------------|');
      mainAnalysis.props.forEach(prop => {
        lines.push(`| ${prop} | - | - |`);
      });
      lines.push('');
    }
    
    // State
    if (mainAnalysis.state && mainAnalysis.state.length > 0) {
      lines.push('### State Management');
      lines.push('');
      mainAnalysis.state.forEach(s => {
        lines.push(`- **${s.variable}**: ${s.initialValue !== undefined ? `Initial value: \`${s.initialValue}\`` : 'State variable'}`);
      });
      lines.push('');
    }
    
    // Event Handlers
    const eventHandlers = mainAnalysis.functions?.filter(f => 
      f.name.startsWith('handle') || f.name.startsWith('on') || f.name.includes('Click') || f.name.includes('Change')
    ) || [];
    
    if (eventHandlers.length > 0) {
      lines.push('### Event Handlers');
      lines.push('');
      eventHandlers.forEach(handler => {
        const params = handler.params ? `(${handler.params.join(', ')})` : '()';
        lines.push(`- **${handler.name}${params}**: Event handler`);
      });
      lines.push('');
    }
  }
  
  // Service & API calls
  const services = searchResults?.filter(r => r.path.includes('service') || r.path.includes('api')) || [];
  if (services.length > 0) {
    lines.push('### External APIs');
    lines.push('');
    services.forEach(service => {
      const name = service.path.split('/').pop().replace(/\.(js|ts)$/, '');
      lines.push(`- **${name}**: API service integration`);
    });
    lines.push('');
  }
  
  lines.push('### Integration Points');
  lines.push('');
  lines.push('*Parent components, child components, and external dependencies*');
  lines.push('');

  // Additional Resources & References
  if (searchResults && searchResults.length > 0) {
    lines.push('## 📚 File References');
    lines.push('');
    lines.push('**File Locations:**');
    lines.push('');
    searchResults.forEach(r => {
      const name = r.path.split('/').pop();
      const dir = r.path.split('/').slice(-2, -1)[0] || 'root';
      lines.push(`- \`${name}\` in \`${dir}/\` directory`);
    });
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push('');
  lines.push(`*Generated on ${timestamp} • Auto-generated documentation*`);
  lines.push('');

  return lines.join('\n');
}

// Helper functions
function getComplexityLevel(fileCount, codeMatches) {
  if (fileCount <= 1 && codeMatches <= 3) return 'Low';
  if (fileCount <= 3 && codeMatches <= 10) return 'Medium';
  return 'High';
}

function getEffortEstimate(fileCount, codeMatches) {
  const complexity = getComplexityLevel(fileCount, codeMatches);
  
  switch (complexity) {
    case 'Low':
      return { time: '1-2 days', risk: 'Low' };
    case 'Medium':
      return { time: '3-5 days', risk: 'Medium' };
    case 'High':
      return { time: '1-2 weeks', risk: 'High - careful planning required' };
    default:
      return { time: 'Unknown', risk: 'Unknown' };
  }
}