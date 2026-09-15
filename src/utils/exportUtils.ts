import { ApiDefinition, ReliabilityAnalysis } from '../types';

export function downloadJsonFile(filename: string, data: unknown): void {
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to download JSON file', err);
  }
}

export function downloadMarkdownFile(filename: string, markdown: string): void {
  try {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to download Markdown file', err);
  }
}

export function formatAnalysisToMarkdown(analysis: ReliabilityAnalysis): string {
  const method = analysis.meta?.method || 'API';
  const endpoint = analysis.meta?.endpoint || '';
  const generatedAt = analysis.meta?.generatedAt || new Date().toISOString();

  let md = `# API Reliability & Security Test Suite
**Target:** \`${method} ${endpoint}\`  
**Generated:** ${new Date(generatedAt).toLocaleString()}  
**Reliability Score:** ${analysis.reliabilityScore} / 100  
**Risk Level:** ${analysis.riskLevel}  

---

## Executive Summary
${analysis.summary}

---

## Comprehensive Test Scenarios

`;

  const allTests = [
    ...(analysis.positiveTests || []),
    ...(analysis.negativeTests || []),
    ...(analysis.edgeCases || []),
    ...(analysis.validationChecks || []),
    ...(analysis.authenticationChecks || []),
    ...(analysis.authorizationChecks || []),
    ...(analysis.securityChecks || []),
  ];

  allTests.forEach((t) => {
    const reqStr =
      typeof t.request === 'object' && t.request !== null
        ? JSON.stringify(t.request, null, 2)
        : String(t.request || '');

    md += `### [${t.id || 'TC'}] ${t.scenario || 'Scenario'}\n`;
    md += `- **Category:** ${t.category || 'General'}\n`;
    md += `- **Severity:** ${t.severity || 'Medium'}\n`;
    md += `- **Expected HTTP Status:** \`${t.expectedStatus || '200 OK'}\`\n`;
    md += `- **Expected Behaviour:** ${t.expectedBehaviour || ''}\n`;
    md += `- **Rationale / Contract Risk:** ${t.rationale || ''}\n\n`;
    md += `\`\`\`json\n${reqStr}\n\`\`\`\n\n`;
  });

  if (analysis.statusCodes && analysis.statusCodes.length > 0) {
    md += `---

## HTTP Status Code Expectations
| Status Code | Scenario | Technical Rationale |
|---|---|---|
`;
    analysis.statusCodes.forEach((sc) => {
      md += `| \`${sc.expectedStatus}\` | ${sc.scenario} | ${sc.reason} |\n`;
    });
    md += `\n`;
  }

  if (analysis.reliabilityObservations && analysis.reliabilityObservations.length > 0) {
    md += `---

## Reliability Observations & Hardening Recommendations
`;
    analysis.reliabilityObservations.forEach((obs) => {
      md += `### ${obs.title} [${obs.severity}]
- **Observation:** ${obs.observation}
- **Recommendation:** ${obs.recommendation}

`;
    });
  }

  if (analysis.assumptions && analysis.assumptions.length > 0) {
    md += `---

## Explicit Contract Assumptions
`;
    analysis.assumptions.forEach((assump) => {
      md += `- ${assump}\n`;
    });
    md += `\n`;
  }

  return md;
}
