@echo off
echo Starting AI-Powered OSS Analyzer Services...
echo.

REM Set environment variables
set HF_TOKEN=your_huggingface_token_here
set GITHUB_TOKEN=your_github_token_here
set OSSINDEX_USERNAME=your_ossindex_username
set OSSINDEX_TOKEN=your_ossindex_token

echo Starting AI-ML Services...

REM Start Security Scanner Service (Port 8001)
echo Starting Security Scanner Service on port 8001...
start "Security Scanner" cmd /k "cd ai-ml-services/security_scanner && python main.py"

REM Start NLP Explainer Service (Port 8002)
echo Starting NLP Explainer Service on port 8002...
start "NLP Explainer" cmd /k "cd ai-ml-services/nlp_explainer && python main.py"

REM Start Risk Model Service (Port 8003)
echo Starting Risk Model Service on port 8003...
start "Risk Model" cmd /k "cd ai-ml-services/risk_model && python main.py"

REM Start Knowledge Graph Service (Port 8004)
echo Starting Knowledge Graph Service on port 8004...
start "Knowledge Graph" cmd /k "cd ai-ml-services/knowledge_graph && python main.py"

REM Start Chat Service (Port 8000)
echo Starting Chat Service on port 8000...
start "Chat Service" cmd /k "cd ai-ml-services/chat && python main.py"

echo.
echo Waiting for AI services to start...
timeout /t 10 /nobreak > nul

echo.
echo Starting Backend Service...
REM Start Spring Boot Backend (Port 8080)
start "Backend" cmd /k "cd backend/oss && mvn spring-boot:run"

echo.
echo Waiting for backend to start...
timeout /t 15 /nobreak > nul

echo.
echo Starting Frontend Service...
REM Start Angular Frontend (Port 4200)
start "Frontend" cmd /k "cd frontend && npm start"

echo.
echo All services are starting...
echo.
echo Service URLs:
echo - Frontend: http://localhost:4200
echo - Backend API: http://localhost:8080
echo - Security Scanner: http://localhost:8001
echo - NLP Explainer: http://localhost:8002
echo - Risk Model: http://localhost:8003
echo - Knowledge Graph: http://localhost:8004
echo - Chat Service: http://localhost:8000
echo.
echo Health Check: http://localhost:8080/api/repo/health
echo.
echo Press any key to exit this script (services will continue running)...
pause > nul
