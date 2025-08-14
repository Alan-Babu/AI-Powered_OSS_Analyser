export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080/api',
  backendUrl: 'http://localhost:8080',
  aiServices: {
    securityScanner: 'http://localhost:8001',
    nlpExplainer: 'http://localhost:8002',
    riskModel: 'http://localhost:8003',
    knowledgeGraph: 'http://localhost:8004'
  }
};
