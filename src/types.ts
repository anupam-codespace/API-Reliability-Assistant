export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type AuthType = 'none' | 'bearer' | 'apiKey' | 'basic';

export interface HeaderItem {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface ParamItem {
  id: string;
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}

export interface ValidationRule {
  id: string;
  field: string;
  pattern: string;
  description?: string;
  enabled: boolean;
}

export interface AuthConfig {
  type: AuthType;
  tokenPlaceholder?: string;
  headerName?: string;
  apiKeyValue?: string;
  username?: string;
  password?: string;
}

export interface ApiDefinition {
  method: HttpMethod;
  endpoint: string;
  pathParams: ParamItem[];
  queryParams: ParamItem[];
  headers: HeaderItem[];
  auth: AuthConfig;
  requestBody: string;
  expectedBehaviour: string;
  description?: string;
  validationRules?: ValidationRule[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export type TestCategory =
  | 'Positive'
  | 'Negative'
  | 'Edge & Boundary'
  | 'Validation'
  | 'Authentication'
  | 'Authorization'
  | 'Security';

export type TestSeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';

export interface TestCase {
  id: string;
  category: TestCategory;
  scenario: string;
  request: string;
  expectedStatus: string;
  expectedBehaviour: string;
  rationale: string;
  severity: TestSeverity;
}

export interface StatusCodeScenario {
  scenario: string;
  expectedStatus: string;
  reason: string;
}

export interface SampleRequest {
  title: string;
  type: 'valid' | 'invalid' | 'edge' | 'security';
  description: string;
  curlSnippet: string;
  body?: string;
}

export interface ReliabilityObservation {
  title: string;
  severity: 'High' | 'Medium' | 'Low';
  observation: string;
  recommendation: string;
}

export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface ReliabilityAnalysis {
  summary: string;
  reliabilityScore: number; // 0 - 100
  riskLevel: RiskLevel;
  totalTests: number;
  positiveTests: TestCase[];
  negativeTests: TestCase[];
  edgeCases: TestCase[];
  validationChecks: TestCase[];
  authenticationChecks: TestCase[];
  authorizationChecks: TestCase[];
  securityChecks: TestCase[];
  statusCodes: StatusCodeScenario[];
  sampleRequests: SampleRequest[];
  reliabilityObservations: ReliabilityObservation[];
  assumptions: string[];
  meta: {
    generatedAt: string;
    method: HttpMethod;
    endpoint: string;
    source: 'gemini' | 'rule-engine';
  };
}
