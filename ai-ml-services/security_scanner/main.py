from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import logging
import re
from typing import List, Dict, Any
from fastapi.middleware.cors import CORSMiddleware
import ast
import astroid
from pylint import epylint as lint

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Security Scanner Service",
    description="AI-powered code security vulnerability detection and analysis",
    version="1.0.0"
)

ORIGINS = [
    "http://localhost:4200",  # Angular dev server
    "http://localhost:8080",  # springboot dev server
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeFile(BaseModel):
    filename: str = Field(..., description="Name of the code file")
    content: str = Field(..., description="Source code content")
    language: str = Field(..., description="Programming language")

class SecurityIssue(BaseModel):
    severity: str = Field(..., description="Severity level (HIGH, MEDIUM, LOW)")
    category: str = Field(..., description="Security issue category")
    description: str = Field(..., description="Description of the security issue")
    line_number: int = Field(..., description="Line number where issue was found")
    recommendation: str = Field(..., description="Recommendation to fix the issue")
    cwe_id: str = Field(..., description="Common Weakness Enumeration ID")

class SecurityScanResult(BaseModel):
    filename: str
    total_issues: int
    high_issues: int
    medium_issues: int
    low_issues: int
    issues: List[SecurityIssue]
    overall_security_score: float = Field(..., ge=0.0, le=100.0)

class BatchScanRequest(BaseModel):
    files: List[CodeFile] = Field(..., max_items=50)

class BatchScanResult(BaseModel):
    results: List[SecurityScanResult]
    total_files_scanned: int
    overall_project_score: float

# Security patterns and rules
SECURITY_PATTERNS = {
    "sql_injection": {
        "patterns": [
            r"execute\s*\(\s*[\"'].*\+.*[\"']",
            r"cursor\.execute\s*\(\s*[\"'].*\+.*[\"']",
            r"db\.execute\s*\(\s*[\"'].*\+.*[\"']"
        ],
        "severity": "HIGH",
        "category": "SQL Injection",
        "cwe_id": "CWE-89",
        "recommendation": "Use parameterized queries or ORM to prevent SQL injection"
    },
    "command_injection": {
        "patterns": [
            r"os\.system\s*\(\s*[\"'].*\+.*[\"']",
            r"subprocess\.call\s*\(\s*[\"'].*\+.*[\"']",
            r"subprocess\.Popen\s*\(\s*[\"'].*\+.*[\"']"
        ],
        "severity": "HIGH",
        "category": "Command Injection",
        "cwe_id": "CWE-78",
        "recommendation": "Avoid command execution with user input, use safe alternatives"
    },
    "path_traversal": {
        "patterns": [
            r"open\s*\(\s*[\"'].*\+.*[\"']",
            r"file\s*\(\s*[\"'].*\+.*[\"']",
            r"os\.path\.join\s*\(\s*.*\+.*[\"']"
        ],
        "severity": "MEDIUM",
        "category": "Path Traversal",
        "cwe_id": "CWE-22",
        "recommendation": "Validate and sanitize file paths, use safe path operations"
    },
    "hardcoded_secrets": {
        "patterns": [
            r"password\s*=\s*[\"'][^\"']+[\"']",
            r"api_key\s*=\s*[\"'][^\"']+[\"']",
            r"secret\s*=\s*[\"'][^\"']+[\"']",
            r"token\s*=\s*[\"'][^\"']+[\"']"
        ],
        "severity": "HIGH",
        "category": "Hardcoded Secrets",
        "cwe_id": "CWE-259",
        "recommendation": "Use environment variables or secure configuration management"
    },
    "weak_crypto": {
        "patterns": [
            r"hashlib\.md5\s*\(",
            r"hashlib\.sha1\s*\(",
            r"cryptography\.hazmat\.primitives\.hashes\.MD5",
            r"cryptography\.hazmat\.primitives\.hashes\.SHA1"
        ],
        "severity": "MEDIUM",
        "category": "Weak Cryptography",
        "cwe_id": "CWE-327",
        "recommendation": "Use strong cryptographic algorithms (SHA-256, SHA-512, etc.)"
    }
}

def scan_code_security(content: str, filename: str) -> SecurityScanResult:
    """Scan code for security vulnerabilities"""
    issues = []
    
    # Pattern-based scanning
    for issue_type, config in SECURITY_PATTERNS.items():
        for pattern in config["patterns"]:
            matches = re.finditer(pattern, content, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                line_number = content[:match.start()].count('\n') + 1
                
                issue = SecurityIssue(
                    severity=config["severity"],
                    category=config["category"],
                    description=f"Potential {config['category'].lower()} vulnerability detected",
                    line_number=line_number,
                    recommendation=config["recommendation"],
                    cwe_id=config["cwe_id"]
                )
                issues.append(issue)
    
    # AST-based analysis for Python
    if filename.endswith('.py'):
        try:
            ast_issues = analyze_python_ast(content)
            issues.extend(ast_issues)
        except Exception as e:
            logger.warning(f"AST analysis failed for {filename}: {e}")
    
    # Calculate security score
    high_count = len([i for i in issues if i.severity == "HIGH"])
    medium_count = len([i for i in issues if i.severity == "MEDIUM"])
    low_count = len([i for i in issues if i.severity == "LOW"])
    
    # Score calculation: 100 - (high*10 + medium*5 + low*2)
    security_score = max(0.0, 100.0 - (high_count * 10 + medium_count * 5 + low_count * 2))
    
    return SecurityScanResult(
        filename=filename,
        total_issues=len(issues),
        high_issues=high_count,
        medium_issues=medium_count,
        low_issues=low_count,
        issues=issues,
        overall_security_score=security_score
    )

def analyze_python_ast(content: str) -> List[SecurityIssue]:
    """Analyze Python code using AST for security issues"""
    issues = []
    
    try:
        tree = ast.parse(content)
        
        for node in ast.walk(tree):
            # Check for eval usage
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == 'eval':
                issues.append(SecurityIssue(
                    severity="HIGH",
                    category="Code Injection",
                    description="Use of eval() function detected - potential code injection risk",
                    line_number=getattr(node, 'lineno', 0),
                    recommendation="Avoid eval() function, use safer alternatives like ast.literal_eval()",
                    cwe_id="CWE-94"
                ))
            
            # Check for pickle usage
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
                if (isinstance(node.func.value, ast.Name) and 
                    node.func.value.id == 'pickle' and 
                    node.func.attr in ['loads', 'load']):
                    issues.append(SecurityIssue(
                        severity="HIGH",
                        category="Deserialization",
                        description="Use of pickle detected - potential deserialization attack risk",
                        line_number=getattr(node, 'lineno', 0),
                        recommendation="Avoid pickle for untrusted data, use JSON or other safe formats",
                        cwe_id="CWE-502"
                    ))
    
    except SyntaxError:
        logger.warning("Syntax error in Python code, skipping AST analysis")
    
    return issues

@app.post("/scan/security", response_model=SecurityScanResult)
async def scan_security_issues(file: CodeFile):
    """Scan a single file for security vulnerabilities"""
    try:
        logger.info(f"Scanning file: {file.filename}")
        result = scan_code_security(file.content, file.filename)
        logger.info(f"Scan completed for {file.filename}: {result.total_issues} issues found")
        return result
    except Exception as e:
        logger.error(f"Error scanning file {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error scanning file: {str(e)}")

@app.post("/scan/batch", response_model=BatchScanResult)
async def batch_scan_security(files: BatchScanRequest):
    """Batch scan multiple files for security vulnerabilities"""
    try:
        logger.info(f"Starting batch scan of {len(files.files)} files")
        results = []
        
        for file in files.files:
            result = scan_code_security(file.content, file.filename)
            results.append(result)
        
        # Calculate overall project score
        total_score = sum(r.overall_security_score for r in results)
        overall_score = total_score / len(results) if results else 100.0
        
        batch_result = BatchScanResult(
            results=results,
            total_files_scanned=len(files.files),
            overall_project_score=overall_score
        )
        
        logger.info(f"Batch scan completed: {len(files.files)} files scanned")
        return batch_result
        
    except Exception as e:
        logger.error(f"Error in batch scan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error in batch scan: {str(e)}")

@app.get("/health")
def health_check():
    """Health check endpoint for service monitoring"""
    return {"status": "healthy", "service": "security-scanner", "version": "1.0.0"}

@app.get("/")
def root():
    """Root endpoint with service information"""
    return {
        "service": "Security Scanner Service",
        "version": "1.0.0",
        "description": "AI-powered code security vulnerability detection",
        "endpoints": {
            "scan": "/scan/security",
            "batch_scan": "/scan/batch",
            "health": "/health",
            "docs": "/docs"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
