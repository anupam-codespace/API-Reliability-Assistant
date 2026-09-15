import { ApiDefinition, ReliabilityAnalysis, TestCase, StatusCodeScenario, SampleRequest, ReliabilityObservation } from '../src/types';

export function generateRuleBasedAnalysis(api: ApiDefinition): ReliabilityAnalysis {
  let parsedBody: Record<string, unknown> = {};
  if (api.requestBody?.trim()) {
    try {
      parsedBody = JSON.parse(api.requestBody);
    } catch {
      // keep empty
    }
  }

  const bodyKeys = Object.keys(parsedBody);
  const endpoint = String(api.endpoint || '');
  const resourceName = endpoint.split('/').filter(Boolean).pop()?.replace(/[{}:]/g, '') || 'resource';
  const auth = api.auth || { type: 'none' };
  const hasAuth = auth.type !== 'none';
  const pathParams = Array.isArray(api.pathParams) ? api.pathParams : [];
  const queryParams = Array.isArray(api.queryParams) ? api.queryParams : [];
  const headers = Array.isArray(api.headers) ? api.headers : [];
  const hasPathParams = pathParams.length > 0;
  const hasQueryParams = queryParams.length > 0;

  // 1. Positive Tests
  const positiveTests: TestCase[] = [
    {
      id: 'POS-001',
      category: 'Positive',
      scenario: `Standard valid ${api.method} request with all standard expected fields`,
      request: api.requestBody?.trim() ? api.requestBody : `{ /* standard valid ${api.method} query/params */ }`,
      expectedStatus: api.method === 'POST' ? '201 Created' : '200 OK',
      expectedBehaviour: api.expectedBehaviour || `Processes request successfully and returns response body representing ${resourceName}.`,
      rationale: `Validates baseline happy path functionality for standard client interactions.`,
      severity: 'Info',
    },
  ];

  if (bodyKeys.length > 1) {
    const subset: Record<string, unknown> = {};
    subset[bodyKeys[0]] = parsedBody[bodyKeys[0]];
    positiveTests.push({
      id: 'POS-002',
      category: 'Positive',
      scenario: `Valid request containing only minimal required fields (${bodyKeys[0]})`,
      request: JSON.stringify(subset, null, 2),
      expectedStatus: api.method === 'POST' ? '201 Created' : '200 OK',
      expectedBehaviour: `API accepts minimal payload and applies sensible system defaults for omitted optional attributes.`,
      rationale: `Confirms that optional fields are not prematurely treated as mandatory.`,
      severity: 'Low',
    });
  }

  if (hasQueryParams) {
    positiveTests.push({
      id: 'POS-003',
      category: 'Positive',
      scenario: `Valid request with supported query parameter combinations`,
      request: `Query: ?${api.queryParams.map((q) => `${q.key}=${q.value}`).join('&')}`,
      expectedStatus: '200 OK',
      expectedBehaviour: `API correctly filters, paginates, or sorts the returned ${resourceName} collection.`,
      rationale: `Verifies that query parameters do not cause unhandled runtime exceptions.`,
      severity: 'Low',
    });
  }

  // 2. Negative Tests
  const negativeTests: TestCase[] = [];

  // Domain-specific check: Email validation & duplicate collision
  const hasEmailField = bodyKeys.some((k) => k.toLowerCase().includes('email'));
  if (hasEmailField) {
    negativeTests.push(
      {
        id: `NEG-00${negativeTests.length + 1}`,
        category: 'Negative',
        scenario: `Duplicate email registration collision (user already exists in database)`,
        request: JSON.stringify({ ...parsedBody, email: 'existing.user@example.com' }, null, 2),
        expectedStatus: '409 Conflict',
        expectedBehaviour: `API returns 409 Conflict indicating email is already registered. Does not leak account enumeration details.`,
        rationale: `Enforces uniqueness constraints on user identity attributes without compromising account privacy.`,
        severity: 'High',
      },
      {
        id: `NEG-00${negativeTests.length + 1}`,
        category: 'Negative',
        scenario: `Malformed email format violation (RFC 5322 compliance check e.g. missing '@' or domain)`,
        request: JSON.stringify({ ...parsedBody, email: 'invalid-email-format-without-at' }, null, 2),
        expectedStatus: '400 Bad Request',
        expectedBehaviour: `Rejects invalid email format with field-level validation message 'email is invalid'.`,
        rationale: `Prevents invalid communication addresses from polluting downstream notification services.`,
        severity: 'Medium',
      }
    );
  }

  // Domain-specific check: Password validation
  const hasPasswordField = bodyKeys.some((k) => k.toLowerCase().includes('password'));
  if (hasPasswordField) {
    negativeTests.push({
      id: `NEG-00${negativeTests.length + 1}`,
      category: 'Negative',
      scenario: `Weak password policy failure (<8 characters, no special characters, or common dictionary word)`,
      request: JSON.stringify({ ...parsedBody, password: '123' }, null, 2),
      expectedStatus: '400 Bad Request',
      expectedBehaviour: `Rejects weak password with policy requirements (e.g. minimum 8 chars, mixed case, symbols).`,
      rationale: `Enforces baseline credential hygiene against credential stuffing and brute force attacks.`,
      severity: 'High',
    });
  }

  // Domain-specific check: Order / Resource lookup
  const isOrderEndpoint = endpoint.toLowerCase().includes('order') || pathParams.some((p) => p.key.toLowerCase().includes('order'));
  if (isOrderEndpoint) {
    negativeTests.push(
      {
        id: `NEG-00${negativeTests.length + 1}`,
        category: 'Negative',
        scenario: `Nonexistent order lookup with syntactically valid ID (e.g. ord_nonexistent_99999)`,
        request: `${api.method} ${endpoint.replace(/\{[^}]+\}/g, 'ord_nonexistent_99999')}`,
        expectedStatus: '404 Not Found',
        expectedBehaviour: `Returns 404 Not Found with clean message 'Order not found'; does not expose internal query details.`,
        rationale: `Verifies proper handling of missing resources under RFC 9110.`,
        severity: 'Medium',
      },
      {
        id: `NEG-00${negativeTests.length + 1}`,
        category: 'Negative',
        scenario: `Malformed order ID format violation (special characters or SQL fragment in ID)`,
        request: `${api.method} ${endpoint.replace(/\{[^}]+\}/g, '!!!invalid_id###')}`,
        expectedStatus: '400 Bad Request',
        expectedBehaviour: `Rejects malformed identifier before performing database lookup.`,
        rationale: `Validates path parameter regex and early validation rejection.`,
        severity: 'Medium',
      }
    );
  }

  if (bodyKeys.length > 0) {
    // Missing required field
    const missingKey = bodyKeys[0];
    const omittedBody = { ...parsedBody };
    delete omittedBody[missingKey];
    negativeTests.push({
      id: `NEG-00${negativeTests.length + 1}`,
      category: 'Negative',
      scenario: `Missing mandatory body attribute '${missingKey}'`,
      request: JSON.stringify(omittedBody, null, 2),
      expectedStatus: '400 Bad Request',
      expectedBehaviour: `API rejects transaction and returns structured validation error detailing missing '${missingKey}'.`,
      rationale: `Guarantees schema integrity before persisting records to database.`,
      severity: 'High',
    });

    // Type mismatch
    const typeFuzzedBody: Record<string, unknown> = { ...parsedBody };
    typeFuzzedBody[missingKey] = 99999999;
    negativeTests.push({
      id: `NEG-00${negativeTests.length + 1}`,
      category: 'Negative',
      scenario: `Type mutation: '${missingKey}' supplied as numeric integer instead of expected format`,
      request: JSON.stringify(typeFuzzedBody, null, 2),
      expectedStatus: '400 Bad Request or 422 Unprocessable Entity',
      expectedBehaviour: `API parser rejects type mismatch with clear error message indicating expected type.`,
      rationale: `Prevents backend runtime type errors and unhandled exception crashes.`,
      severity: 'High',
    });
  }

  // Unsupported HTTP Method
  negativeTests.push({
    id: `NEG-00${negativeTests.length + 1}`,
    category: 'Negative',
    scenario: `Unsupported HTTP Verb invocation (e.g. OPTIONS / TRACE or mismatched verb)`,
    request: `TRACE ${api.endpoint}`,
    expectedStatus: '405 Method Not Allowed',
    expectedBehaviour: `Returns 405 Method Not Allowed with 'Allow' header indicating permitted verbs.`,
    rationale: `Restricts unexpected verb methods and prevents unintentional side effects.`,
    severity: 'Medium',
  });

  // Malformed JSON payload
  if (['POST', 'PUT', 'PATCH'].includes(api.method)) {
    negativeTests.push({
      id: `NEG-00${negativeTests.length + 1}`,
      category: 'Negative',
      scenario: `Malformed JSON payload (syntax error: unclosed brackets)`,
      request: `{"${bodyKeys[0] || 'id'}": "value", ...unterminated}`,
      expectedStatus: '400 Bad Request',
      expectedBehaviour: `Rejects malformed JSON with descriptive parsing error; does not expose internal stack trace.`,
      rationale: `Ensures robust JSON serialization barrier at reverse proxy / middleware layer.`,
      severity: 'Medium',
    });
  }

  // 3. Edge & Boundary Cases
  const edgeCases: TestCase[] = [
    {
      id: 'EDGE-001',
      category: 'Edge & Boundary',
      scenario: `Extremely large string payload (10,000+ characters / buffer boundary test)`,
      request: bodyKeys.length > 0
        ? JSON.stringify({ ...parsedBody, [bodyKeys[0]]: 'A'.repeat(10000) }, null, 2)
        : `Header or URL string padding with 10k characters`,
      expectedStatus: '400 Bad Request or 413 Payload Too Large',
      expectedBehaviour: `Safely validates string length limits; does not crash database column constraints.`,
      rationale: `Prevents Denial of Service through resource exhaustion or database column overflow exceptions.`,
      severity: 'Medium',
    },
    {
      id: 'EDGE-002',
      category: 'Edge & Boundary',
      scenario: `Unicode special characters, multi-byte encodings, and RTL text inputs`,
      request: bodyKeys.length > 0
        ? JSON.stringify({ ...parsedBody, [bodyKeys[0]]: 'Ünïcödé_测试_مرحبا_ñ' }, null, 2)
        : `URL parameter encoded with multi-byte UTF-8 symbols`,
      expectedStatus: api.method === 'POST' ? '201 Created' : '200 OK',
      expectedBehaviour: `Correctly encodes, persists, and round-trips UTF-8 characters without data corruption.`,
      rationale: `Guarantees internationalization support and prevents database charset collation faults.`,
      severity: 'Low',
    },
    {
      id: 'EDGE-003',
      category: 'Edge & Boundary',
      scenario: `Empty string / whitespace-only values in non-nullable fields`,
      request: bodyKeys.length > 0
        ? JSON.stringify({ ...parsedBody, [bodyKeys[0]]: '    ' }, null, 2)
        : `Empty query value`,
      expectedStatus: '400 Bad Request or 422 Unprocessable Entity',
      expectedBehaviour: `Trims whitespace and triggers empty-field validation rather than saving ghost data.`,
      rationale: `Prevents silent data degradation caused by blank or whitespace-padded records.`,
      severity: 'Medium',
    },
  ];

  if (hasPathParams) {
    edgeCases.push({
      id: 'EDGE-004',
      category: 'Edge & Boundary',
      scenario: `Path parameter format boundary: negative integer, zero, or max 64-bit integer`,
      request: `Path parameter ${api.pathParams[0].key} = 9223372036854775807`,
      expectedStatus: '404 Not Found or 400 Bad Request',
      expectedBehaviour: `Handles integer upper bounds without internal integer overflow runtime crash.`,
      rationale: `Guarantees graceful boundary handling across numeric identifiers.`,
      severity: 'Medium',
    });
  }

  // 4. Validation Checks
  const validationChecks: TestCase[] = [
    {
      id: 'VAL-001',
      category: 'Validation',
      scenario: `Unexpected extraneous fields in request body (mass assignment test)`,
      request: JSON.stringify({ ...parsedBody, __isAdmin: true, role: 'superadmin', internalFlag: 1 }, null, 2),
      expectedStatus: '400 Bad Request or 200/201 ignoring unpermitted fields',
      expectedBehaviour: `API schema either rejects extraneous attributes or strips them before database persistence.`,
      rationale: `Prevents privilege escalation via mass assignment vulnerabilities (CWE-915).`,
      severity: 'High',
    },
    {
      id: 'VAL-002',
      category: 'Validation',
      scenario: `Null value passed to explicitly typed non-null field`,
      request: bodyKeys.length > 0
        ? JSON.stringify({ ...parsedBody, [bodyKeys[0]]: null }, null, 2)
        : `{"value": null}`,
      expectedStatus: '400 Bad Request or 422 Unprocessable Entity',
      expectedBehaviour: `Returns explicit field-level error 'must not be null'.`,
      rationale: `Protects against null pointer exceptions in application business logic.`,
      severity: 'Medium',
    },
  ];

  // Domain-specific check: Email regex pattern enforcement
  const emailRule = api.validationRules?.find(
    (r) => r.enabled && r.field.toLowerCase() === 'email'
  );
  const emailRegexPattern =
    emailRule?.pattern ||
    (hasEmailField ? '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' : null);

  if (emailRegexPattern) {
    validationChecks.push({
      id: `VAL-00${validationChecks.length + 1}`,
      category: 'Validation',
      scenario: `Email field regex validation: Enforce format pattern '${emailRegexPattern}'`,
      request: JSON.stringify(
        {
          ...parsedBody,
          email: 'invalid.user@missing-tld',
        },
        null,
        2
      ),
      expectedStatus: '400 Bad Request or 422 Unprocessable Entity',
      expectedBehaviour: `API validates email against regex format '${emailRegexPattern}' and rejects invalid input with field error 'email does not match required format'.`,
      rationale: `Enforces strict regex format validation to prevent invalid or dangerous email payloads from entering data stores.`,
      severity: 'High',
    });
  }

  // Support any custom field validation rules
  if (Array.isArray(api.validationRules)) {
    api.validationRules
      .filter((r) => r.enabled && r.field.toLowerCase() !== 'email')
      .forEach((rule) => {
        validationChecks.push({
          id: `VAL-00${validationChecks.length + 1}`,
          category: 'Validation',
          scenario: `Field validation pattern test: Enforce '${rule.field}' regex '${rule.pattern}'`,
          request: JSON.stringify(
            {
              ...parsedBody,
              [rule.field]: 'invalid_regex_sample_format!',
            },
            null,
            2
          ),
          expectedStatus: '400 Bad Request or 422 Unprocessable Entity',
          expectedBehaviour: `Rejects invalid '${rule.field}' value that does not match pattern '${rule.pattern}'.`,
          rationale: `Guarantees schema constraint integrity for '${rule.field}'.`,
          severity: 'Medium',
        });
      });
  }

  // 5. Authentication Checks
  const authenticationChecks: TestCase[] = [];
  if (hasAuth) {
    authenticationChecks.push(
      {
        id: 'AUTH-001',
        category: 'Authentication',
        scenario: `Missing authentication header/credentials entirely`,
        request: `Request sent with no Authorization header or token`,
        expectedStatus: '401 Unauthorized',
        expectedBehaviour: `Immediate rejection with 401 status and WWW-Authenticate challenge header.`,
        rationale: `Ensures protected endpoints cannot be reached anonymously.`,
        severity: 'Critical',
      },
      {
        id: 'AUTH-002',
        category: 'Authentication',
        scenario: `Invalid / expired / revoked credential signature`,
        request: `Authorization: ${auth.type === 'bearer' ? 'Bearer eyJhbGciOiJIUzI1Ni...invalid_sig' : 'Malformed_Token'}`,
        expectedStatus: '401 Unauthorized',
        expectedBehaviour: `Token verification fails cleanly without revealing crypto stack trace or key hints.`,
        rationale: `Guarantees cryptographic verification is enforced on every request.`,
        severity: 'Critical',
      },
      {
        id: 'AUTH-003',
        category: 'Authentication',
        scenario: `Incorrect authentication scheme (e.g. Basic instead of Bearer or wrong header name)`,
        request: `Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=`,
        expectedStatus: '401 Unauthorized',
        expectedBehaviour: `Rejects unsupported scheme with proper authentication scheme specification.`,
        rationale: `Enforces standard token exchange protocol integrity.`,
        severity: 'Medium',
      }
    );
  } else {
    authenticationChecks.push({
      id: 'AUTH-001',
      category: 'Authentication',
      scenario: `Public access validation: Confirm no authenticated privileges are accidentally unlocked`,
      request: `Request sent without authentication headers`,
      expectedStatus: api.method === 'POST' ? '201 Created' : '200 OK',
      expectedBehaviour: `Allows public invocation according to public specification, but throttled by IP rate limits.`,
      rationale: `Confirms public scope while ensuring rate-limiting guards against automated abuse.`,
      severity: 'Info',
    });
  }

  // 6. Authorization Checks
  const authorizationChecks: TestCase[] = [];
  if (hasPathParams || hasAuth) {
    authorizationChecks.push(
      {
        id: 'AUTHZ-001',
        category: 'Authorization',
        scenario: `BOLA/IDOR: Authenticated user attempts to access/modify a resource owned by another tenant`,
        request: `Valid auth token for User A accessing resource identifier belonging to User B`,
        expectedStatus: '403 Forbidden or 404 Not Found',
        expectedBehaviour: `Request is blocked; tenant boundary is strictly enforced; no data leak occurs.`,
        rationale: `Mitigates Broken Object Level Authorization (OWASP API #1 vulnerability).`,
        severity: 'Critical',
      },
      {
        id: 'AUTHZ-002',
        category: 'Authorization',
        scenario: `Vertical privilege escalation: Low-privilege role attempting administrative operation`,
        request: `Standard customer session accessing administrative scope/query parameters`,
        expectedStatus: '403 Forbidden',
        expectedBehaviour: `Returns 403 with permission denied code; action is not performed.`,
        rationale: `Verifies role-based access control (RBAC) boundaries are validated at controller layer.`,
        severity: 'High',
      }
    );
  } else {
    authorizationChecks.push({
      id: 'AUTHZ-001',
      category: 'Authorization',
      scenario: `Authorization scope verification: Ensure public endpoint cannot alter protected system flags`,
      request: JSON.stringify({ role: 'admin', verified: true, ...parsedBody }, null, 2),
      expectedStatus: '400 Bad Request or unprivileged processing',
      expectedBehaviour: `User permissions remain unprivileged.`,
      rationale: `Prevents parameter tampering from elevating caller status.`,
      severity: 'Medium',
    });
  }

  // 7. Security Checks
  const securityChecks: TestCase[] = [
    {
      id: 'SEC-001',
      category: 'Security',
      scenario: `Defensive check: SQL/NoSQL Injection payload in input attributes`,
      request: bodyKeys.length > 0
        ? JSON.stringify({ ...parsedBody, [bodyKeys[0]]: "' OR '1'='1' --" }, null, 2)
        : `Path param: 1' OR '1'='1`,
      expectedStatus: '400 Bad Request or handled parameter parsing',
      expectedBehaviour: `Parameterized queries or ORM sanitization safely treats input as literal string without executing SQL syntax.`,
      rationale: `Prevents database compromise via structured injection attacks (CWE-89).`,
      severity: 'Critical',
    },
    {
      id: 'SEC-002',
      category: 'Security',
      scenario: `Defensive check: Cross-Site Scripting (XSS) script tag payload in string attributes`,
      request: bodyKeys.length > 0
        ? JSON.stringify({ ...parsedBody, [bodyKeys[0]]: '<script>alert("xss")</script>' }, null, 2)
        : `Query parameter: ?search=<script>alert(1)</script>`,
      expectedStatus: '400 Bad Request or properly encoded string stored',
      expectedBehaviour: `Input is HTML-escaped or rejected; response Content-Type is application/json with nosniff headers.`,
      rationale: `Defends downstream web clients against stored or reflected script execution (CWE-79).`,
      severity: 'High',
    },
    {
      id: 'SEC-003',
      category: 'Security',
      scenario: `Rate limiting & volumetric abuse test: Burst of 100 concurrent requests in 5 seconds`,
      request: `100 rapid requests from single IP / client token`,
      expectedStatus: '429 Too Many Requests',
      expectedBehaviour: `Returns 429 status code with 'Retry-After' header when threshold is breached.`,
      rationale: `Protects downstream services and databases from denial of service and brute force attacks.`,
      severity: 'High',
    },
    {
      id: 'SEC-004',
      category: 'Security',
      scenario: `Sensitive data exposure check: Confirm passwords, salts, or internal DB IDs are never returned`,
      request: `Standard valid request`,
      expectedStatus: api.method === 'POST' ? '201 Created' : '200 OK',
      expectedBehaviour: `Response body strictly filters out password hashes, secret keys, or internal system paths.`,
      rationale: `Adheres to OWASP API #3 Broken Object Property Level Authorization & Information Disclosure.`,
      severity: 'High',
    },
  ];

  // Total tests calculation
  const allTests = [
    ...positiveTests,
    ...negativeTests,
    ...edgeCases,
    ...validationChecks,
    ...authenticationChecks,
    ...authorizationChecks,
    ...securityChecks,
  ];

  // Status codes
  const statusCodes: StatusCodeScenario[] = [
    {
      scenario: `Successful request handling under standard conditions`,
      expectedStatus: api.method === 'POST' ? '201 Created' : '200 OK',
      reason: api.method === 'POST'
        ? `A new ${resourceName} entity was created and its representation is returned.`
        : `The requested ${resourceName} data was successfully retrieved or modified.`,
    },
    {
      scenario: `Missing mandatory parameter or invalid request payload format`,
      expectedStatus: '400 Bad Request',
      reason: `Client provided malformed syntax, missing required fields, or unparseable JSON.`,
    },
  ];

  if (hasEmailField) {
    statusCodes.push({
      scenario: `Duplicate resource conflict (e.g. email address already registered)`,
      expectedStatus: '409 Conflict',
      reason: `Client attempted to register an entity with an email that already exists in the database.`,
    });
  }

  if (bodyKeys.length > 0) {
    statusCodes.push({
      scenario: `Semantic validation failure (e.g. negative age or field format violation)`,
      expectedStatus: '422 Unprocessable Entity',
      reason: `Request syntax is valid JSON, but domain business logic validation failed.`,
    });
  }

  if (hasAuth) {
    statusCodes.push(
      {
        scenario: `Unauthenticated caller or missing/expired security credentials`,
        expectedStatus: '401 Unauthorized',
        reason: `Endpoint is protected by ${auth.type} authentication and requires a valid active session.`,
      },
      {
        scenario: `Authenticated caller attempting to access an unauthorized resource or another user's data`,
        expectedStatus: '403 Forbidden',
        reason: `Caller identity is validated, but insufficient permissions or tenant boundaries forbid access.`,
      }
    );
  }

  if (hasPathParams || api.method === 'GET') {
    statusCodes.push({
      scenario: `Target ${resourceName} identifier does not correspond to any known entity`,
      expectedStatus: '404 Not Found',
      reason: `The requested resource URI does not exist in the persistence store.`,
    });
  }

  statusCodes.push(
    {
      scenario: `Client exceeds allocated rate limiting threshold for endpoint`,
      expectedStatus: '429 Too Many Requests',
      reason: `Throttling policy enforced to preserve downstream system reliability.`,
    },
    {
      scenario: `Unhandled downstream system exception, database timeout, or unhandled null reference`,
      expectedStatus: '500 Internal Server Error',
      reason: `Server should catch unexpected errors gracefully and mask internal stack traces.`,
    }
  );

  // Sample requests
  const sampleRequests: SampleRequest[] = [
    {
      title: 'Valid Request (Happy Path)',
      type: 'valid',
      description: `Baseline request with recommended headers and valid payload structure.`,
      curlSnippet: `curl -X ${api.method} "${api.endpoint}" \\\n  -H "Content-Type: application/json" \\\n  ${
        hasAuth ? '-H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\\n  ' : ''
      }-d '${api.requestBody?.trim() ? api.requestBody.replace(/\s+/g, ' ') : '{}'}'`,
      body: api.requestBody || undefined,
    },
    {
      title: 'Invalid Request (Missing Required Fields)',
      type: 'invalid',
      description: `Triggers 400 Bad Request validation response.`,
      curlSnippet: `curl -X ${api.method} "${api.endpoint}" \\\n  -H "Content-Type: application/json" \\\n  ${
        hasAuth ? '-H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\\n  ' : ''
      }-d '{}'`,
      body: '{}',
    },
    {
      title: 'Edge Case (Boundary Unicode and Large Strings)',
      type: 'edge',
      description: `Tests handling of multi-byte UTF-8, whitespace, and maximum length thresholds.`,
      curlSnippet: `curl -X ${api.method} "${api.endpoint}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"name": "   ", "query": "测试_Unicode"}'`,
    },
    {
      title: 'Security Probe (IDOR / Unauthorized Tenant Access)',
      type: 'security',
      description: `Verifies tenant isolation and validates that unauthorized object IDs return 403 Forbidden.`,
      curlSnippet: `curl -X ${api.method} "${api.endpoint}" \\\n  -H "Authorization: Bearer ATTACKER_TOKEN_ANOTHER_TENANT"`,
    },
  ];

  // Reliability Observations
  const reliabilityObservations: ReliabilityObservation[] = [
    {
      title: 'Idempotency & Retry Safety',
      severity: api.method === 'POST' ? 'High' : 'Low',
      observation:
        api.method === 'POST'
          ? `POST operations are inherently non-idempotent. Network retries from mobile clients may generate duplicate ${resourceName} records.`
          : `${api.method} is expected to be idempotent under RFC 9110 guidelines.`,
      recommendation:
        api.method === 'POST'
          ? `Implement an 'Idempotency-Key' request header with Redis/cache locking to deduplicate transient retries.`
          : `Ensure repeating identical ${api.method} requests produces identical state without side-effects.`,
    },
    {
      title: 'Tenant Isolation & Authorization Enforcement',
      severity: hasAuth ? 'High' : 'Medium',
      observation:
        hasAuth
          ? `Authorization must be validated against the underlying tenant ID at the database query level, not just checking that a valid JWT token exists.`
          : `Endpoint is currently unauthenticated. Verify whether sensitive personal information could be harvested without an audit trail.`,
      recommendation:
        hasAuth
          ? `Enforce row-level security (RLS) or mandatory tenant_id filters in all query predicates.`
          : `Implement token-based rate limiting or authentication if customer data is processed.`,
    },
    {
      title: 'Structured Validation & Error Exposure',
      severity: 'Medium',
      observation: `Uncaught exceptions during parameter parsing can inadvertently leak framework stack traces or database schema names.`,
      recommendation: `Adopt RFC 7807 (Problem Details for HTTP APIs) to provide structured machine-readable error codes without internal telemetry leak.`,
    },
  ];

  // Assumptions
  const assumptions: string[] = [
    `Assumption: The API enforces JSON Content-Type negotiation and returns structured JSON responses across all HTTP status codes.`,
    `Assumption: Parameter types and required fields inferred from the sample payload; production schema may enforce additional regex or format constraints.`,
  ];

  if (hasAuth) {
    assumptions.push(`Assumption: Authentication utilizes standard JSON Web Tokens (JWT) or Bearer tokens with short-lived expiration and signature validation.`);
  } else {
    assumptions.push(`Assumption: Endpoint is intentionally exposed without authentication; IP-level rate limiting is assumed to be active on the API gateway.`);
  }

  // Calculate score & risk
  let score = 88;
  if (!hasAuth && api.method !== 'GET') score -= 15;
  if (!api.expectedBehaviour) score -= 10;
  if (bodyKeys.length === 0 && ['POST', 'PUT'].includes(api.method)) score -= 15;
  score = Math.max(45, Math.min(95, score));

  const riskLevel = score >= 80 ? 'Low' : score >= 60 ? 'Medium' : 'High';

  return {
    summary: `Comprehensive reliability and security analysis for ${api.method} ${api.endpoint}. Identified ${allTests.length} targeted test scenarios spanning positive flows, negative error boundaries, authentication guards, and OWASP API security checks.`,
    reliabilityScore: score,
    riskLevel,
    totalTests: allTests.length,
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
      source: 'rule-engine',
    },
  };
}
