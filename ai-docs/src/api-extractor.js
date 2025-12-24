import fs from 'fs';
import path from 'path';

/**
 * Enhanced API extraction from Redux slices
 * Extracts comprehensive API information including payload and response structures
 */
export function extractAPIEndpoints(codebasePath, componentPath) {
  const apiEndpoints = [];
  
  try {
    console.log('📡 Extracting comprehensive API information');
    console.log('   Component path:', componentPath);
    console.log('   Codebase path:', codebasePath);
    
    // Find the project root - navigate up from codebasePath to find the root
    let projectRoot = codebasePath;
    
    // If codebasePath ends with /src, go up one level
    if (projectRoot.endsWith('src') || projectRoot.endsWith('src/') || projectRoot.endsWith('src\\')) {
      projectRoot = path.dirname(projectRoot);
    }
    
    // If path contains /src/ or \src\, take everything before it
    if (projectRoot.includes('/src/') || projectRoot.includes('\\src\\')) {
      const parts = projectRoot.split(/[\/\\]src[\/\\]/);
      projectRoot = parts[0];
    }
    
    console.log('   Project root:', projectRoot);
    
    // Determine Redux slice path
    const slicePath = findReduxSlicePath(projectRoot, componentPath);
    
    if (!slicePath || !fs.existsSync(slicePath)) {
      console.log('⚠️  Redux slice file not found');
      return apiEndpoints;
    }
    
    console.log('✅ Found Redux slice file:', slicePath);
    const sliceContent = fs.readFileSync(slicePath, 'utf8');
    
    // Extract all createAsyncThunk actions
    const asyncThunks = extractAsyncThunks(sliceContent);
    
    asyncThunks.forEach(thunk => {
      const apiCall = extractAPICallFromThunk(thunk, sliceContent);
      if (apiCall) {
        apiEndpoints.push(apiCall);
        console.log(`✅ Extracted API: ${apiCall.name} (${apiCall.method})`);
      }
    });
    
    console.log(`✅ Total APIs extracted: ${apiEndpoints.length}`);
  } catch (e) {
    console.log('❌ Error extracting API information:', e.message);
  }
  
  return apiEndpoints;
}

/**
 * Find Redux slice file path based on component name
 */
function findReduxSlicePath(projectRoot, componentPath) {
  // Extract component name from path - check both filename and directory
  const pathParts = componentPath.split(/[\/\\]/);
  const fileName = pathParts[pathParts.length - 1];
  const dirName = pathParts[pathParts.length - 2];
  
  // Check both filename and parent directory for component patterns
  const searchText = `${fileName} ${dirName} ${componentPath}`.toLowerCase();
  
  const slicePatterns = [
    // PPM Report variations
    { match: 'ppmreport', path: 'features/ppmReport/ppmReportRequestSlice.js' },
    { match: 'tppmreport', path: 'features/ppmReport/ppmReportRequestSlice.js' },
    // Line Summary variations
    { match: 'linesummaryreport', path: 'features/lineSummaryReport/lineSummaryReportRequestSlice.js' },
    { match: 'tlinesummaryreport', path: 'features/lineSummaryReport/lineSummaryReportRequestSlice.js' },
    // PO Report variations
    { match: 'poreport', path: 'features/poReport/poReportRequestSlice.js' },
    { match: 'tporeport', path: 'features/poReport/poReportRequestSlice.js' },
    // PO Search variations
    { match: 'posearch', path: 'features/poSearch/poSearchSlice.js' },
    { match: 'tposearch', path: 'features/poSearch/poSearchSlice.js' },
    // Air Freight Report
    { match: 'airfreightreport', path: 'features/airFreightReport/airFreightReportSlice.js' },
    // GAC Change Report
    { match: 'gacchangereport', path: 'features/gacChangeReport/gacChangeReportSlice.js' },
    // Conversation Thread Report
    { match: 'conversationthreadreport', path: 'features/conversationThreadReport/conversationThreadReportSlice.js' }
  ];
  
  for (const pattern of slicePatterns) {
    if (searchText.includes(pattern.match)) {
      const fullPath = path.join(projectRoot, 'src', pattern.path);
      console.log(`   Matched pattern "${pattern.match}" -> ${fullPath}`);
      return fullPath;
    }
  }
  
  return null;
}

/**
 * Extract all createAsyncThunk definitions from slice
 */
function extractAsyncThunks(sliceContent) {
  const thunks = [];
  const thunkPattern = /function\s+(\w+)\s*\(\)\s*{\s*return\s+createAsyncThunk\s*\(\s*[`'"]([^`'"]+)[`'"],\s*async\s*\([\s\S]*?\}\s*\);?\s*\}/g;
  
  let match;
  while ((match = thunkPattern.exec(sliceContent)) !== null) {
    const functionName = match[1];
    const actionType = match[2];
    const fullMatch = match[0];
    
    thunks.push({
      functionName,
      actionType,
      code: fullMatch,
      index: match.index
    });
  }
  
  return thunks;
}

/**
 * Extract API call details from a thunk
 */
function extractAPICallFromThunk(thunk, sliceContent) {
  const { functionName, code } = thunk;
  
  // Extract request() call
  const requestMatch = code.match(/request\s*\(\s*{[\s\S]*?api:\s*['"]([^'"]+)['"][\s\S]*?method:\s*['"]([^'"]+)['"][\s\S]*?(?:data:\s*(\w+))?[\s\S]*?}\s*,/);
  
  if (!requestMatch) {
    return null;
  }
  
  const endpoint = requestMatch[1];
  const method = requestMatch[2].toUpperCase();
  const dataVar = requestMatch[3];
  
  const api = {
    name: formatAPIName(functionName, endpoint),
    reduxAction: `${thunk.actionType}`,
    endpoint,
    method,
    payload: null,
    response: null,
    queryParams: null
  };
  
  // Extract payload structure - always try to extract
  api.payload = extractPayloadStructure(code, dataVar);
  
  // Extract response structure
  api.response = extractResponseStructure(code);
  
  // Extract query parameters
  api.queryParams = extractQueryParams(code);
  
  return api;
}

/**
 * Format API name from function name and endpoint
 */
function formatAPIName(functionName, endpoint) {
  // Convert camelCase to Title Case
  const formatted = functionName
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return formatted || endpoint.replace(/([A-Z])/g, ' $1').trim();
}

/**
 * Extract payload structure from thunk code with comprehensive field analysis
 */
function extractPayloadStructure(code, dataVar) {
  const payload = {};
  
  // Check for different payload patterns in the code - even without dataVar
  
  // 1. Search array structure
  if (code.includes('search:') || code.includes('requestData') || code.includes('mapInputFieldsToRequest')) {
    payload.search = [
      {
        fieldName: "PONUMBER",
        values: ["12345", "67890"]
      },
      {
        fieldName: "DOC DATE",
        from: "2024-01-01",
        to: "2024-12-31"
      }
    ];
  }
  
  // 2. Fields array
  if (code.includes('fields:') || code.includes('fieldsForRequest') || code.includes('columnOrderOptions')) {
    payload.fields = ["PONUMBER", "STYLE NUMBER", "VENDOR", "DOC DATE", "GAC"];
  }
  
  // 3. Filter object
  if (code.includes('filter:') || code.includes('modifiedrequestBody') || code.includes('ppmReportRequestBody.filter')) {
    payload.filter = {
      "VENDOR": ["vendor1", "vendor2"],
      "DIVISION CODE": ["div1"],
      "ITEM STATUS": ["Active"]
    };
  }
  
  // 4. Offset for pagination
  if (code.includes('offset') || code.includes('jumpToPage')) {
    payload.offset = 100;
    payload.limit = 100;
  }
  
  // 5. Page token
  if (code.includes('pageToken') || code.includes('nextPageToken')) {
    payload.pageToken = "eyJvZmZzZXQiOjEwMH0=";
  }
  
  // 6. Export specific fields
  if (code.includes('filetype') || code.includes('exportPOReport')) {
    payload.filetype = "csv";
    if (!payload.offset) payload.offset = 0;
    if (!payload.fields) payload.fields = ["PONUMBER", "STYLE NUMBER", "VENDOR", "DOC DATE", "GAC"];
    if (!payload.filter) payload.filter = {};
  }
  
  // 7. Saved search ID
  if (code.includes('savedSearchId') || code.includes('ppmReportRequestData')) {
    payload.savedSearchId = "search_id_123";
    if (!payload.fields) payload.fields = ["PONUMBER", "STYLE NUMBER", "VENDOR"];
    if (!payload.filter) payload.filter = {};
  }
  
  // 8. Request filter values flag
  if (code.includes('shouldRequestFilterValues') || code.includes('requestFilterValues')) {
    payload.shouldRequestFilterValues = true;
  }
  
  // 9. Inactive feature fields
  if (code.includes('inactiveFeatureFields')) {
    payload.inactiveFeatureFields = [];
  }
  
  // If it's a search/filter API and we don't have basic structure yet, add defaults
  if (code.includes('ppmReportSearch') && Object.keys(payload).length === 0) {
    payload.search = [
      {
        fieldName: "PONUMBER",
        values: ["12345", "67890"]
      }
    ];
    payload.fields = ["PONUMBER", "STYLE NUMBER", "VENDOR", "DOC DATE"];
    payload.filter = {
      "VENDOR": ["vendor1"],
      "DIVISION CODE": ["div1"]
    };
  }
  
  return Object.keys(payload).length > 0 ? payload : null;
}

/**
 * Extract response structure from thunk code
 */
function extractResponseStructure(code) {
  const response = {};
  
  // Look for common response patterns in .then() handlers
  
  // 1. Results array
  if (code.includes('response.data.results') || code.includes('getflattenResponse')) {
    response.results = [];
  }
  
  // 2. Total count
  if (code.includes('response.data.total') || code.includes('totalCount')) {
    response.total = 0;
  }
  
  // 3. Filters
  if (code.includes('response.data.filters') || code.includes('getFilterValuesFromResponse')) {
    response.filters = {
      "VENDOR": ["vendor1", "vendor2", "vendor3"],
      "DIVISION CODE": ["div1", "div2"],
      "ITEM STATUS": ["Active", "Cancelled", "Closed"]
    };
  }
  
  // 4. Page tokens
  if (code.includes('nextPageToken') || code.includes('prevPageToken')) {
    response.nextPageToken = "eyJvZmZzZXQiOjEwMH0=";
    response.prevPageToken = "eyJvZmZzZXQiOjB9";
  }
  
  // 5. Success flag
  if (code.includes('.success') || code.includes('callback')) {
    response.success = true;
  }
  
  // 6. Message
  if (code.includes('.message') || code.includes('error.message')) {
    response.message = "Operation completed successfully";
  }
  
  // 7. GAC Reason Codes specific
  if (code.includes('gacReasonCode') || code.includes('getGACReasonCode')) {
    response.gacReasonCodes = [
      {
        code: "RC001",
        description: "Material Delay"
      },
      {
        code: "RC002",
        description: "Production Issue"
      },
      {
        code: "RC003",
        description: "Shipping Delay"
      }
    ];
  }
  
  // 8. Saved search metadata
  if (code.includes('savedSearch') || code.includes('bookmark')) {
    response.id = "search_id_123";
    response.name = "Saved Search Name";
    response.createdDate = "2024-01-01T10:00:00Z";
  }
  
  return Object.keys(response).length > 0 ? response : null;
}

/**
 * Extract query parameters from code
 */
function extractQueryParams(code) {
  const params = [];
  
  // Check for type parameter
  if (code.includes("type: 'report'") || code.includes('type: "report"')) {
    params.push('type=report');
  }
  
  // Check for column/filter type parameters
  if (code.includes('columnType') || code.includes('filterType')) {
    params.push('columnType={type}');
    params.push('filterType={type}');
  }
  
  return params.length > 0 ? params.join('&') : null;
}

/**
 * Format API endpoint documentation
 */
export function formatAPIDocumentation(apiEndpoints) {
  const lines = [];
  
  if (!apiEndpoints || apiEndpoints.length === 0) {
    return lines;
  }
  
  lines.push('### API Endpoints');
  lines.push('');
  
  apiEndpoints.forEach((api, index) => {
    lines.push(`#### ${index + 1}. ${api.name}`);
    lines.push('');
    lines.push(`**Redux Action:** \`${api.reduxAction}\``);
    lines.push('');
    lines.push('**Request:**');
    lines.push(`- **Method:** ${api.method}`);
    lines.push(`- **Endpoint:** \`${api.endpoint}\``);
    
    if (api.queryParams) {
      lines.push(`- **Query Params:** \`?${api.queryParams}\``);
    }
    
    lines.push('');
    
    if (api.payload) {
      lines.push('**Payload Structure:**');
      lines.push('```json');
      lines.push(JSON.stringify(api.payload, null, 2));
      lines.push('```');
      lines.push('');
    }
    
    if (api.response) {
      lines.push('**Response Structure:**');
      lines.push('```json');
      lines.push(JSON.stringify(api.response, null, 2));
      lines.push('```');
      lines.push('');
    } else if (api.method === 'DELETE') {
      lines.push('**Response:**');
      lines.push('```json');
      lines.push(JSON.stringify({ success: true, message: 'Operation completed successfully' }, null, 2));
      lines.push('```');
      lines.push('');
    }
    
    lines.push('---');
    lines.push('');
  });
  
  return lines;
}
