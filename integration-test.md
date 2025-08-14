# AI-Powered OSS Analyzer - Integration Test Guide

## System Overview
The AI-Powered OSS Analyzer consists of:
- **Backend**: Spring Boot application (port 8080)
- **Frontend**: Angular application (port 4200)
- **AI-ML Services**: 
  - Security Scanner (port 8001)
  - NLP Explainer (port 8002)
  - Risk Model (port 8003)
  - Knowledge Graph (port 8004)

## Pre-Test Checklist
- [ ] Backend is running on port 8080
- [ ] Frontend is running on port 4200
- [ ] All AI-ML services are running
- [ ] Database is accessible (H2 in-memory for testing)

## Integration Test Scenarios

### 1. Frontend-Backend Connectivity
**Test**: Verify frontend can communicate with backend
- Navigate to http://localhost:4200
- Check browser console for any CORS or connection errors
- Verify API calls are reaching the backend

**Expected Result**: No CORS errors, successful API communication

### 2. Repository Scanning Workflow
**Test**: Complete end-to-end repository scan
- Use test repository: `https://github.com/Alan-Babu/testvulnrepo.git`
- Fill in scan form with repository URL
- Select scan options (dependencies, vulnerabilities, license check)
- Submit scan request
- Monitor progress updates
- Verify scan results display

**Expected Result**: 
- Scan progresses through stages
- Results show vulnerabilities and dependencies
- AI services health indicators are displayed

### 3. AI-ML Service Integration
**Test**: Verify AI services are accessible from frontend
- Check services health status on dashboard
- Test vulnerability analysis with AI
- Generate risk predictions
- Create knowledge graphs

**Expected Result**: All AI services respond and provide meaningful results

### 4. Data Flow Verification
**Test**: Ensure data flows correctly through the system
- Backend receives scan requests
- AI services process data
- Results are stored and retrieved
- Frontend displays updated information

**Expected Result**: Data consistency across all layers

### 5. Error Handling
**Test**: Verify graceful error handling
- Test with invalid repository URLs
- Disconnect AI services temporarily
- Test network failures
- Verify user-friendly error messages

**Expected Result**: System remains stable, clear error messages displayed

## Test Commands

### Backend Health Check
```bash
curl http://localhost:8080/actuator/health
```

### AI Services Health Check
```bash
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health
curl http://localhost:8004/health
```

### Frontend Accessibility
```bash
curl http://localhost:4200
```

### Repository Scan Test
```bash
curl -X POST "http://localhost:8080/api/repo/scan?url=https://github.com/Alan-Babu/testvulnrepo.git&scanType=full&includeDependencies=true&includeVulnerabilities=true&includeLicenseCheck=true"
```

## Success Criteria
- [ ] Frontend loads without errors
- [ ] Backend API endpoints respond correctly
- [ ] Repository scanning completes successfully
- [ ] AI services provide meaningful analysis
- [ ] Data persists and displays correctly
- [ ] Error handling works gracefully
- [ ] User experience is smooth and intuitive

## Troubleshooting

### Common Issues
1. **CORS Errors**: Check backend CORS configuration
2. **Port Conflicts**: Verify all services are on correct ports
3. **Database Issues**: Check H2 console at http://localhost:8080/h2-console
4. **AI Service Failures**: Check individual service logs

### Debug Steps
1. Check browser console for frontend errors
2. Check backend logs for API errors
3. Verify AI service endpoints are accessible
4. Test individual components in isolation

## Performance Metrics
- Frontend load time: < 3 seconds
- API response time: < 2 seconds
- Scan completion time: < 30 seconds (depending on repository size)
- AI analysis time: < 10 seconds per vulnerability

## Security Considerations
- Verify authentication bypass is only for testing
- Check input validation on all forms
- Ensure sensitive data is not exposed in logs
- Verify CORS is properly configured for production

## Next Steps
After successful integration testing:
1. Implement proper authentication
2. Add comprehensive error logging
3. Optimize performance bottlenecks
4. Add automated testing suite
5. Prepare for production deployment
