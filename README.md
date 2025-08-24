# AI-Powered OSS Analyzer

A comprehensive open-source software risk assessment platform that uses AI and machine learning to analyze dependencies, detect vulnerabilities, and provide intelligent recommendations for secure software development.

## 🚀 Features

### Core Features
- **Repository Scanning**: Analyze GitHub repositories for dependencies and vulnerabilities
- **AI-Powered Risk Assessment**: Use pre-trained models for intelligent risk prediction
- **Real-time API Integration**: Fetch live data from NPM, PyPI, Maven Central, and GitHub APIs
- **Vulnerability Detection**: Comprehensive security scanning with CWE classification
- **Knowledge Graph Analysis**: Visualize dependency relationships and risk clusters
- **NLP-powered Insights**: Extract and analyze vulnerability descriptions using AI
- **Interactive Chatbot**: AI-powered assistant for security guidance

### AI-ML Services
- **Security Scanner** (Port 8001): Code security vulnerability detection
- **NLP Explainer** (Port 8002): AI-powered vulnerability description analysis
- **Risk Model** (Port 8003): Pre-trained ML models for dependency risk assessment
- **Knowledge Graph** (Port 8004): Dependency relationship analysis and visualization
- **Chat Service** (Port 8000): AI-powered security assistant

### Enhanced Features
- **Batch Processing**: Scan multiple repositories simultaneously
- **Real-time Data**: Live dependency metadata from package registries
- **Comprehensive Reporting**: Detailed risk reports with AI insights
- **API-First Design**: RESTful APIs for all services
- **Modern UI**: Angular-based responsive frontend
- **Enterprise Ready**: Spring Boot backend with security and monitoring

## 🛠️ Technology Stack

### Backend
- **Spring Boot 3.5.4**: Main application framework
- **Spring Security**: Authentication and authorization
- **Spring Data JPA**: Database operations
- **H2 Database**: In-memory database for development
- **Maven**: Build and dependency management

### Frontend
- **Angular 19**: Modern web framework
- **Tailwind CSS**: Utility-first CSS framework
- **D3.js**: Data visualization
- **ngx-graph**: Graph visualization components

### AI-ML Services
- **FastAPI**: High-performance Python web framework
- **Transformers**: Hugging Face pre-trained models
- **scikit-learn**: Machine learning algorithms
- **NetworkX**: Graph analysis
- **PyTorch**: Deep learning framework

## 📋 Prerequisites

### System Requirements
- Java 17 or higher
- Python 3.8 or higher
- Node.js 18 or higher
- Git

### API Keys Required
- **Hugging Face Token**: For pre-trained models
- **GitHub Token**: For repository analysis (optional)
- **OSSIndex Credentials**: For vulnerability data (optional)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd AI-Powered_OSS_Analyser
```

### 2. Set Environment Variables
Create a `.env` file in the root directory:
```env
HF_TOKEN=your_huggingface_token_here
GITHUB_TOKEN=your_github_token_here
OSSINDEX_USERNAME=your_ossindex_username
OSSINDEX_TOKEN=your_ossindex_token
```

### 3. Install Dependencies

#### Backend Dependencies
```bash
cd backend/oss
mvn clean install
```

#### Frontend Dependencies
```bash
cd frontend
npm install
```

#### AI-ML Services Dependencies
```bash
cd ai-ml-services
pip install -r requirement.txt
```

### 4. Start All Services

#### Option 1: Using the Startup Script (Windows)
```bash
start-services.bat
```

#### Option 2: Manual Start

**Start AI-ML Services:**
```bash
# Terminal 1: Security Scanner
cd ai-ml-services/security_scanner && python main.py

# Terminal 2: NLP Explainer
cd ai-ml-services/nlp_explainer && python main.py

# Terminal 3: Risk Model
cd ai-ml-services/risk_model && python main.py

# Terminal 4: Knowledge Graph
cd ai-ml-services/knowledge_graph && python main.py

# Terminal 5: Chat Service
cd ai-ml-services/chat && python main.py
```

**Start Backend:**
```bash
cd backend/oss
mvn spring-boot:run
```

**Start Frontend:**
```bash
cd frontend
npm start
```

### 5. Access the Application
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/swagger-ui.html
- **Health Check**: http://localhost:8080/api/repo/health

## 📖 Usage Guide

### 1. Repository Scanning
1. Navigate to the Repository Scan page
2. Enter a GitHub repository URL
3. Select scan options (dependencies, vulnerabilities, license check)
4. Click "Scan Repository"
5. View comprehensive analysis results

### 2. AI-Powered Analysis
1. Use the "Scan with AI" option for enhanced analysis
2. View AI-generated risk assessments
3. Get intelligent recommendations
4. Explore dependency relationships in the knowledge graph

### 3. Batch Processing
1. Use the batch scan endpoint for multiple repositories
2. POST to `/api/repo/batch-scan` with a list of URLs
3. Get comprehensive results for all repositories

### 4. AI Chatbot
1. Navigate to the AI Chatbot page
2. Ask questions about security, dependencies, or vulnerabilities
3. Get AI-powered responses and recommendations

## 🔧 API Endpoints

### Repository Management
- `POST /api/repo/scan` - Scan a single repository
- `POST /api/repo/scan/ai` - Scan with AI enhancement
- `POST /api/repo/batch-scan` - Batch scan multiple repositories
- `GET /api/repo/all` - Get all scanned repositories
- `GET /api/repo/{id}` - Get repository by ID

### Reports
- `GET /api/repo/reports` - Get all risk reports
- `GET /api/repo/reports/{id}` - Get report by ID
- `POST /api/repo/reports/{id}/enhance` - Enhance report with AI

### Health & Monitoring
- `GET /api/repo/health` - Service health check
- `GET /actuator/health` - Spring Boot health endpoint

### AI Services
- `POST /chat` - AI chatbot interface
- `POST /api/repo/chat` - Repository-specific AI chat

## 🧪 Testing

### Integration Testing
```bash
# Test repository scan
curl -X POST "http://localhost:8080/api/repo/scan?url=https://github.com/Alan-Babu/testvulnrepo.git"

# Test AI-enhanced scan
curl -X POST "http://localhost:8080/api/repo/scan/ai?url=https://github.com/Alan-Babu/testvulnrepo.git"

# Test health check
curl http://localhost:8080/api/repo/health
```

### AI Services Testing
```bash
# Test security scanner
curl -X POST "http://localhost:8001/scan/security" -H "Content-Type: application/json" -d '{"filename":"test.py","content":"import os; os.system(\"ls\")","language":"python"}'

# Test risk model
curl -X POST "http://localhost:8003/risk/assess" -H "Content-Type: application/json" -d '{"package_name":"express","version":"4.17.1","ecosystem":"npm"}'

# Test knowledge graph
curl -X POST "http://localhost:8004/graph/build" -H "Content-Type: application/json" -d '{"dependencies":[],"relationships":[]}'
```

## 🔒 Security Features

- **Input Validation**: Comprehensive validation for all inputs
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Error Handling**: Graceful error handling without information leakage
- **API Rate Limiting**: Protection against abuse
- **Secure Headers**: Security headers for web applications

## 📊 Monitoring & Metrics

- **Health Checks**: All services provide health endpoints
- **Metrics**: Prometheus metrics for monitoring
- **Logging**: Comprehensive logging across all services
- **Performance**: Optimized for large repository analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the integration test guide in `integration-test.md`

## 🔄 Updates & Maintenance

### Regular Updates
- Keep dependencies updated for security patches
- Monitor AI model performance and update as needed
- Review and update API integrations

### Performance Optimization
- Monitor service response times
- Optimize database queries
- Implement caching where appropriate

## 🎯 Roadmap

### Planned Features
- [ ] Advanced machine learning models
- [ ] Real-time vulnerability alerts
- [ ] Integration with CI/CD pipelines
- [ ] Mobile application
- [ ] Advanced visualization features
- [ ] Multi-language support
- [ ] Enterprise SSO integration

### Performance Improvements
- [ ] Distributed processing for large repositories
- [ ] Advanced caching strategies
- [ ] Database optimization
- [ ] Service mesh implementation

---

**Note**: This is a comprehensive AI-powered OSS analysis platform designed for enterprise use. Make sure to configure all required API keys and tokens before running the application.
