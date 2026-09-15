import { GoogleGenAI, Type } from '@google/genai';
import { ApiDefinition, ReliabilityAnalysis, TestCase, StatusCodeScenario } from '../src/types';
import { generateRuleBasedAnalysis } from './ruleEngine';

const testCaseSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING, description: 'Test ID like POS-001, NEG-001, SEC-001' },
    category: { type: Type.STRING, description: 'Positive | Negative | Edge & Boundary | Validation | Authentication | Authorization | Security' },
    scenario: { type: Type.STRING, description: 'Specific scenario description' },
    request: { type: Type.STRING, description: 'Sample request payload or parameters' },
    expectedStatus: { type: Type.STRING, description: 'Expected HTTP status code and text (e.g. 200 OK, 400 Bad Request)' },
    expectedBehaviour: { type: Type.STRING, description: 'Expected API behaviour' },
    rationale: { type: Type.STRING, description: 'Why this test case is necessary' },
    severity: { type: Type.STRING, description: 'Critical | High | Medium | Low | Info' },
  },
  required: ['id', 'category', 'scenario', 'request', 'expectedStatus', 'expectedBehaviour', 'rationale', 'severity'],
};

const analysisResponseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: 'Executive summary of the API reliability and risk posture' },
    reliabilityScore: { type: Type.NUMBER, description: 'Overall reliability score from 0 to 100' },
    riskLevel: { type: Type.STRING, description: 'Low | Medium | High' },
    totalTests: { type: Type.NUMBER, description: 'Total number of generated test cases' },
    positiveTests: { type: Type.ARRAY, items: testCaseSchema },
    negativeTests: { type: Type.ARRAY, items: testCaseSchema },
    edgeCases: { type: Type.ARRAY, items: testCaseSchema },
    validationChecks: { type: Type.ARRAY, items: testCaseSchema },
    authenticationChecks: { type: Type.ARRAY, items: testCaseSchema },
    authorizationChecks: { type: Type.ARRAY, items: testCaseSchema },
    securityChecks: { type: Type.ARRAY, items: testCaseSchema },
    statusCodes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          scenario: { type: Type.STRING },
          expectedStatus: { type: Type.STRING },
          reason: { type: Type.STRING },
        },
        required: ['scenario', 'expectedStatus', 'reason'],
      },
    },
    sampleRequests: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          type: { type: Type.STRING, description: 'valid | invalid | edge | security' },
          description: { type: Type.STRING },
          curlSnippet: { type: Type.STRING },
          body: { type: Type.STRING },
        },
        required: ['title', 'type', 'description', 'curlSnippet'],
      },
    },
    reliabilityObservations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          severity: { type: Type.STRING, description: 'High | Medium | Low' },
          observation: { type: Type.STRING },
          recommendation: { type: Type.STRING },
        },
        required: ['title', 'severity', 'observation', 'recommendation'],
      },
    },
    assumptions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Clear list of assumptions made due to missing or implicit specification details',
    },
  },
  required: [
    'summary',
    'reliabilityScore',
    'riskLevel',
    'totalTests',
    'positiveTests',
    'negativeTests',
    'edgeCases',
    'validationChecks',
    'authenticationChecks',
    'authorizationChecks',
    'securityChecks',
    'statusCodes',
    'sampleRequests',
    'reliabilityObservations',
    'assumptions',
  ],
};

export async function analyzeApiDefinition(api: ApiDefinition): Promise<ReliabilityAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    console.warn('GEMINI_API_KEY not configured. Falling back to deterministic rule-engine.');
    return generateRuleBasedAnalysis(api);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const safeAuth = api.auth || { type: 'none' };
    const safePathParams = Array.isArray(api.pathParams) ? api.pathParams : [];
    const safeQueryParams = Array.isArray(api.queryParams) ? api.queryParams : [];
    const safeHeaders = Array.isArray(api.headers) ? api.headers : [];

    const prompt = `
You are a principal API quality engineer, site reliability architect, and application security specialist performing an exhaustive, deterministic reliability and security analysis for this API specification.

=== API SPECIFICATION ===
HTTP Method: ${api.method || 'POST'}
Endpoint: ${api.endpoint || ''}
Path Parameters: ${JSON.stringify(safePathParams.filter((p) => p && p.enabled))}
Query Parameters: ${JSON.stringify(safeQueryParams.filter((q) => q && q.enabled))}
Headers: ${JSON.stringify(safeHeaders.filter((h) => h && h.enabled))}
Authentication Method: ${safeAuth.type || 'none'}
Validation Rules & Regex Patterns: ${JSON.stringify(api.validationRules?.filter((r) => r.enabled) || [])}
Request Body:
${api.requestBody || '(None)'}

Expected Behaviour:
${api.expectedBehaviour || '(Not specified)'}

API Description:
${api.description || '(Not specified)'}

=== TASK & CONTRACT ASSESSMENT REQUIREMENTS ===
1. Tailor all tests directly to the provided API. Avoid generic filler. Every test scenario must refer to actual fields, path parameters, and query parameters defined in this specification.
2. If this is a User Registration / POST users API:
   - Generate field validation tests for all submitted fields (e.g. name, email, password, age).
   - If an email regex pattern (e.g. ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$) or validation rule is specified, generate a dedicated validation test case verifying that invalid email inputs (e.g. missing domain, missing TLD, invalid symbols) are rejected with HTTP 400 Bad Request or 422 Unprocessable Entity.
   - Generate duplicate email registration collision test expecting HTTP 409 Conflict.
   - Generate malformed email format violation test expecting HTTP 400 Bad Request.
   - Generate missing required fields tests (e.g. missing email, missing name) expecting HTTP 400 Bad Request.
   - Generate password complexity and validation tests (weak password, empty password) expecting HTTP 400 Bad Request.
   - Generate age boundary checks (negative value, string type, unrealistic values) expecting HTTP 422 Unprocessable Entity or 400 Bad Request.
   - Generate creation status code verification expecting HTTP 201 Created with created user representation (confirming password hash or plaintext password is NEVER returned).
3. If this is an Order Retrieval / GET orders API:
   - Generate authentication checks (missing/invalid Bearer token) expecting HTTP 401 Unauthorized.
   - Generate resource ownership and IDOR / BOLA authorization checks (authenticated user attempting to query or tamper with another user's order) expecting HTTP 403 Forbidden.
   - Generate nonexistent order lookup test expecting HTTP 404 Not Found.
   - Generate malformed order ID parameter test expecting HTTP 400 Bad Request.
   - Generate rate limiting and scraping protection checks expecting HTTP 429 Too Many Requests.

Generate an exhaustive, deep test suite with explicit counts:
4. Positive Test Cases: Generate 2-3 realistic positive scenarios (baseline happy path, minimal schema with defaults, optional parameters).
5. Negative Test Cases: Generate 3-5 negative scenarios (missing required fields, type mismatches, malformed JSON, unsupported HTTP methods 405 Method Not Allowed, domain-specific violations like duplicate email).
6. Edge & Boundary Cases: Generate 3-4 edge scenarios (10,000+ char buffers, multi-byte Unicode / RTL / emoji, empty strings, integer max bounds 9223372036854775807).
7. Validation Checks: Generate 2-4 validation scenarios (including regex pattern verification for any fields with pattern constraints, mass assignment prevention e.g. injected role: admin, explicit null values, type mutations).
8. Authentication Checks: Generate 2-3 authentication scenarios (missing credential, invalid/expired cryptographic token, unsupported scheme).
9. Authorization Checks: Generate 2-3 authorization scenarios (BOLA / IDOR cross-tenant access e.g. User A accessing User B's order, horizontal and vertical privilege escalation).
10. Security Checks: Generate 3-4 security scenarios. You MUST include a dedicated Security Check for Rate Limiting & volumetric abuse test (e.g. burst of 100 rapid requests exceeding threshold) expecting HTTP status of '429 Too Many Requests' with 'Retry-After' and rate-limit headers. In addition, include SQL/NoSQL injection payload, XSS in string fields, and sensitive data exposure prevention.
11. HTTP Status Codes: Map 5-7 exact scenarios to RFC 9110 status codes (200, 201, 400, 401, 403, 404, 409, 422, 429, 500) with technical rationale. You MUST include 429 Too Many Requests for rate limiting.
12. Sample Requests: Provide 3-4 realistic copy-pasteable cURL snippets (Happy path, Missing field / Duplicate, Boundary / Edge, Auth / IDOR probe) using safe placeholders (e.g. YOUR_ACCESS_TOKEN, example.com). Never include real credentials.
13. Reliability Observations: Architectural assessments on idempotency, retry safety, error leakage, and rate limiting.
14. Explicit Assumptions: State assumptions if specification details are implicit.
15. Reliability Score: Calculate an honest score (0-100) and risk level (Low, Medium, High).
`;

    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let responseText: string | null = null;
    let lastError: unknown = null;

    for (const modelName of candidateModels) {
      try {
        const res = await Promise.race([
          ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction:
                'You are a senior principal API quality engineer and security specialist. You generate highly realistic, concrete, API-specific QA test plans and security assessments with structured schema output.',
              responseMimeType: 'application/json',
              responseSchema: analysisResponseSchema,
              temperature: 0.2,
            },
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Model ${modelName} timed out after 8s`)), 8000)
          ),
        ]);

        if (res && res.text) {
          responseText = res.text;
          break;
        }
      } catch (err: unknown) {
        lastError = err;
        console.info(`Model ${modelName} unavailable, attempting next candidate...`);
      }
    }

    if (!responseText) {
      console.warn('All AI candidate models failed or timed out. Falling back to deterministic rule engine.', lastError);
      return generateRuleBasedAnalysis(api);
    }

    // Strip markdown code fences if model enclosed JSON
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.slice(7);
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.slice(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.slice(0, -3);
    }
    cleanJson = cleanJson.trim();

    const rawParsed = JSON.parse(cleanJson);
    const normalized = normalizeAndSanitizeAnalysis(rawParsed, api);

    return normalized;
  } catch (error) {
    console.info('AI service unavailable or timed out, seamlessly using rule engine fallback:', error instanceof Error ? error.message : error);
    return generateRuleBasedAnalysis(api);
  }
}

function normalizeAndSanitizeAnalysis(raw: any, api: ApiDefinition): ReliabilityAnalysis {
  const sanitizeTestCase = (item: any, fallbackCat: string, index: number) => {
    const rawReq = item?.request;
    const requestStr =
      typeof rawReq === 'object' && rawReq !== null
        ? JSON.stringify(rawReq, null, 2)
        : String(rawReq || '');

    const validSeverities = ['Critical', 'High', 'Medium', 'Low', 'Info'];
    const rawSev = item?.severity;
    const severity = validSeverities.includes(rawSev) ? rawSev : 'Medium';

    return {
      id: String(item?.id || `TC-${fallbackCat.substring(0, 3).toUpperCase()}-${String(index + 1).padStart(3, '0')}`),
      category: String(item?.category || fallbackCat) as any,
      scenario: String(item?.scenario || 'Test Scenario'),
      request: requestStr,
      expectedStatus: String(item?.expectedStatus || (api.method === 'POST' ? '201 Created' : '200 OK')),
      expectedBehaviour: String(item?.expectedBehaviour || 'Expected API response conforms to specification.'),
      rationale: String(item?.rationale || 'Verifies system reliability boundaries.'),
      severity: severity as any,
    };
  };

  const sanitizeList = (arr: any, fallbackCat: string) => {
    if (!Array.isArray(arr)) return [];
    return arr.map((item, idx) => sanitizeTestCase(item, fallbackCat, idx));
  };

  // Import baseline rule engine to augment any missing or minimal AI categories
  const baseline = generateRuleBasedAnalysis(api);

  const mergeUnique = (aiTests: TestCase[], baselineTests: TestCase[], cat: string): TestCase[] => {
    const combined = [...aiTests];
    const existingScenarios = new Set(aiTests.map((t) => t.scenario.toLowerCase().trim()));

    for (const baseTest of baselineTests) {
      if (!existingScenarios.has(baseTest.scenario.toLowerCase().trim())) {
        combined.push(baseTest);
        existingScenarios.add(baseTest.scenario.toLowerCase().trim());
      }
    }
    // Re-index cleanly
    return combined.map((t, idx) => ({
      ...t,
      id: `${t.category.toUpperCase().slice(0, 4)}-${String(idx + 1).padStart(3, '0')}`,
    }));
  };

  const positiveTests = mergeUnique(sanitizeList(raw?.positiveTests, 'Positive'), baseline.positiveTests, 'Positive');
  const negativeTests = mergeUnique(sanitizeList(raw?.negativeTests, 'Negative'), baseline.negativeTests, 'Negative');
  const edgeCases = mergeUnique(sanitizeList(raw?.edgeCases, 'Edge & Boundary'), baseline.edgeCases, 'Edge & Boundary');
  const validationChecks = mergeUnique(sanitizeList(raw?.validationChecks, 'Validation'), baseline.validationChecks, 'Validation');
  const authenticationChecks = mergeUnique(sanitizeList(raw?.authenticationChecks, 'Authentication'), baseline.authenticationChecks, 'Authentication');
  const authorizationChecks = mergeUnique(sanitizeList(raw?.authorizationChecks, 'Authorization'), baseline.authorizationChecks, 'Authorization');
  const securityChecks = mergeUnique(sanitizeList(raw?.securityChecks, 'Security'), baseline.securityChecks, 'Security');

  const totalTests =
    positiveTests.length +
    negativeTests.length +
    edgeCases.length +
    validationChecks.length +
    authenticationChecks.length +
    authorizationChecks.length +
    securityChecks.length;

  // Merge status codes ensuring all critical codes (200/201, 400, 401, 403, 404, 409, 422, 429, 500) are covered
  const rawStatusCodes = Array.isArray(raw?.statusCodes)
    ? raw.statusCodes.map((sc: any) => ({
        scenario: String(sc?.scenario || 'Status Scenario'),
        expectedStatus: String(sc?.expectedStatus || '200 OK'),
        reason: String(sc?.reason || 'Standard HTTP RFC response.'),
      }))
    : [];
  
  const statusCodes = [...rawStatusCodes];
  const existingCodes = new Set(rawStatusCodes.map((s: StatusCodeScenario) => s.expectedStatus.split(' ')[0]));
  for (const baseSc of baseline.statusCodes) {
    const codeNum = baseSc.expectedStatus.split(' ')[0];
    if (!existingCodes.has(codeNum)) {
      statusCodes.push(baseSc);
      existingCodes.add(codeNum);
    }
  }

  // Merge sample requests
  const rawSampleRequests = Array.isArray(raw?.sampleRequests)
    ? raw.sampleRequests.map((sr: any) => ({
        title: String(sr?.title || 'Sample Request'),
        type: ['valid', 'invalid', 'edge', 'security'].includes(sr?.type) ? sr.type : 'valid',
        description: String(sr?.description || 'cURL template'),
        curlSnippet: String(sr?.curlSnippet || `curl -X ${api.method} "${api.endpoint}"`),
        body: sr?.body ? String(sr.body) : undefined,
      }))
    : [];

  const sampleRequests = rawSampleRequests.length >= 3 ? rawSampleRequests : baseline.sampleRequests;

  const rawObservations = Array.isArray(raw?.reliabilityObservations)
    ? raw.reliabilityObservations.map((obs: any) => ({
        title: String(obs?.title || 'Reliability Observation'),
        severity: ['High', 'Medium', 'Low'].includes(obs?.severity) ? obs.severity : 'Medium',
        observation: String(obs?.observation || 'Observation detail.'),
        recommendation: String(obs?.recommendation || 'Actionable recommendation.'),
      }))
    : [];

  const reliabilityObservations = rawObservations.length > 0 ? rawObservations : baseline.reliabilityObservations;

  const rawAssumptions = Array.isArray(raw?.assumptions)
    ? raw.assumptions.map((a: any) => String(a))
    : [];

  const assumptions = rawAssumptions.length > 0 ? rawAssumptions : baseline.assumptions;

  let rawScore = typeof raw?.reliabilityScore === 'number' ? raw.reliabilityScore : 75;
  if (isNaN(rawScore)) rawScore = 75;
  const reliabilityScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  const validRisks = ['Low', 'Medium', 'High'];
  const riskLevel = validRisks.includes(raw?.riskLevel) ? raw.riskLevel : 'Medium';

  return {
    summary: String(raw?.summary || 'API Reliability and Security assessment generated successfully.'),
    reliabilityScore,
    riskLevel,
    totalTests,
    positiveTests,
    negativeTests,
    edgeCases,
    validationChecks,
    authenticationChecks,
    authorizationChecks,
    securityChecks,
    statusCodes,
    sampleRequests,
    reliabilityObservations,
    assumptions,
    meta: {
      generatedAt: new Date().toISOString(),
      method: api.method,
      endpoint: api.endpoint,
      source: 'gemini',
    },
  };
}
