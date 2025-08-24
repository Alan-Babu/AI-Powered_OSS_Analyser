#!/usr/bin/env python3
"""
AI-Powered OSS Analyzer - Service Test Script
Tests all services to ensure they are running and functioning correctly.
"""

import requests
import json
import time
import sys
from typing import Dict, List, Any

class ServiceTester:
    def __init__(self):
        self.base_urls = {
            'backend': 'http://localhost:8080',
            'frontend': 'http://localhost:4200',
            'security_scanner': 'http://localhost:8001',
            'nlp_explainer': 'http://localhost:8002',
            'risk_model': 'http://localhost:8003',
            'knowledge_graph': 'http://localhost:8004',
            'chat': 'http://localhost:8000'
        }
        self.results = {}
        
    def test_service_health(self, service_name: str, url: str) -> Dict[str, Any]:
        """Test service health endpoint"""
        try:
            response = requests.get(f"{url}/health", timeout=10)
            if response.status_code == 200:
                return {
                    'status': 'healthy',
                    'response': response.json(),
                    'response_time': response.elapsed.total_seconds()
                }
            else:
                return {
                    'status': 'unhealthy',
                    'error': f"HTTP {response.status_code}",
                    'response_time': response.elapsed.total_seconds()
                }
        except requests.exceptions.RequestException as e:
            return {
                'status': 'error',
                'error': str(e),
                'response_time': None
            }
    
    def test_backend_health(self) -> Dict[str, Any]:
        """Test backend health and AI services"""
        try:
            response = requests.get(f"{self.base_urls['backend']}/api/repo/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                return {
                    'status': 'healthy',
                    'response': data,
                    'ai_services': data.get('aiServices', {}),
                    'response_time': response.elapsed.total_seconds()
                }
            else:
                return {
                    'status': 'unhealthy',
                    'error': f"HTTP {response.status_code}",
                    'response_time': response.elapsed.total_seconds()
                }
        except requests.exceptions.RequestException as e:
            return {
                'status': 'error',
                'error': str(e),
                'response_time': None
            }
    
    def test_repository_scan(self) -> Dict[str, Any]:
        """Test repository scanning functionality"""
        test_repo = "https://github.com/Alan-Babu/testvulnrepo.git"
        
        try:
            response = requests.post(
                f"{self.base_urls['backend']}/api/repo/scan",
                params={'url': test_repo},
                timeout=30
            )
            
            if response.status_code == 200:
                return {
                    'status': 'success',
                    'response_time': response.elapsed.total_seconds(),
                    'data': response.json()
                }
            else:
                return {
                    'status': 'error',
                    'error': f"HTTP {response.status_code}: {response.text}",
                    'response_time': response.elapsed.total_seconds()
                }
        except requests.exceptions.RequestException as e:
            return {
                'status': 'error',
                'error': str(e),
                'response_time': None
            }
    
    def test_ai_risk_model(self) -> Dict[str, Any]:
        """Test AI risk model service"""
        test_dependency = {
            "package_name": "express",
            "version": "4.17.1",
            "ecosystem": "npm",
            "last_updated_days": 30,
            "download_count": 1000000,
            "star_count": 50000,
            "vulnerability_count": 0,
            "outdated_days": 0
        }
        
        try:
            response = requests.post(
                f"{self.base_urls['risk_model']}/risk/assess",
                json=test_dependency,
                timeout=15
            )
            
            if response.status_code == 200:
                return {
                    'status': 'success',
                    'response_time': response.elapsed.total_seconds(),
                    'data': response.json()
                }
            else:
                return {
                    'status': 'error',
                    'error': f"HTTP {response.status_code}: {response.text}",
                    'response_time': response.elapsed.total_seconds()
                }
        except requests.exceptions.RequestException as e:
            return {
                'status': 'error',
                'error': str(e),
                'response_time': None
            }
    
    def test_security_scanner(self) -> Dict[str, Any]:
        """Test security scanner service"""
        test_code = {
            "filename": "test.py",
            "content": "import os\nos.system('ls')\npassword = 'secret123'",
            "language": "python"
        }
        
        try:
            response = requests.post(
                f"{self.base_urls['security_scanner']}/scan/security",
                json=test_code,
                timeout=15
            )
            
            if response.status_code == 200:
                return {
                    'status': 'success',
                    'response_time': response.elapsed.total_seconds(),
                    'data': response.json()
                }
            else:
                return {
                    'status': 'error',
                    'error': f"HTTP {response.status_code}: {response.text}",
                    'response_time': response.elapsed.total_seconds()
                }
        except requests.exceptions.RequestException as e:
            return {
                'status': 'error',
                'error': str(e),
                'response_time': None
            }
    
    def test_nlp_explainer(self) -> Dict[str, Any]:
        """Test NLP explainer service"""
        test_vulnerability = {
            "description": "SQL injection vulnerability in login form allows attackers to bypass authentication by injecting malicious SQL code."
        }
        
        try:
            response = requests.post(
                f"{self.base_urls['nlp_explainer']}/nlp/extract",
                json=test_vulnerability,
                timeout=15
            )
            
            if response.status_code == 200:
                return {
                    'status': 'success',
                    'response_time': response.elapsed.total_seconds(),
                    'data': response.json()
                }
            else:
                return {
                    'status': 'error',
                    'error': f"HTTP {response.status_code}: {response.text}",
                    'response_time': response.elapsed.total_seconds()
                }
        except requests.exceptions.RequestException as e:
            return {
                'status': 'error',
                'error': str(e),
                'response_time': None
            }
    
    def test_knowledge_graph(self) -> Dict[str, Any]:
        """Test knowledge graph service"""
        test_data = {
            "dependencies": [
                {
                    "name": "express",
                    "version": "4.17.1",
                    "ecosystem": "npm",
                    "package_manager": "npm"
                }
            ],
            "relationships": []
        }
        
        try:
            response = requests.post(
                f"{self.base_urls['knowledge_graph']}/graph/build",
                json=test_data,
                timeout=15
            )
            
            if response.status_code == 200:
                return {
                    'status': 'success',
                    'response_time': response.elapsed.total_seconds(),
                    'data': response.json()
                }
            else:
                return {
                    'status': 'error',
                    'error': f"HTTP {response.status_code}: {response.text}",
                    'response_time': response.elapsed.total_seconds()
                }
        except requests.exceptions.RequestException as e:
            return {
                'status': 'error',
                'error': str(e),
                'response_time': None
            }
    
    def test_chat_service(self) -> Dict[str, Any]:
        """Test chat service"""
        test_message = {
            "message": "What are the security risks of using outdated dependencies?"
        }
        
        try:
            response = requests.post(
                f"{self.base_urls['chat']}/chat",
                json=test_message,
                timeout=15
            )
            
            if response.status_code == 200:
                return {
                    'status': 'success',
                    'response_time': response.elapsed.total_seconds(),
                    'data': response.json()
                }
            else:
                return {
                    'status': 'error',
                    'error': f"HTTP {response.status_code}: {response.text}",
                    'response_time': response.elapsed.total_seconds()
                }
        except requests.exceptions.RequestException as e:
            return {
                'status': 'error',
                'error': str(e),
                'response_time': None
            }
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Run all service tests"""
        print("🚀 Starting AI-Powered OSS Analyzer Service Tests...")
        print("=" * 60)
        
        # Test individual AI services
        print("\n📊 Testing AI-ML Services:")
        print("-" * 30)
        
        # Security Scanner
        print("🔍 Testing Security Scanner...")
        self.results['security_scanner'] = self.test_service_health('security_scanner', self.base_urls['security_scanner'])
        print(f"   Status: {self.results['security_scanner']['status']}")
        
        # NLP Explainer
        print("📝 Testing NLP Explainer...")
        self.results['nlp_explainer'] = self.test_service_health('nlp_explainer', self.base_urls['nlp_explainer'])
        print(f"   Status: {self.results['nlp_explainer']['status']}")
        
        # Risk Model
        print("🤖 Testing Risk Model...")
        self.results['risk_model'] = self.test_service_health('risk_model', self.base_urls['risk_model'])
        print(f"   Status: {self.results['risk_model']['status']}")
        
        # Knowledge Graph
        print("🕸️  Testing Knowledge Graph...")
        self.results['knowledge_graph'] = self.test_service_health('knowledge_graph', self.base_urls['knowledge_graph'])
        print(f"   Status: {self.results['knowledge_graph']['status']}")
        
        # Chat Service
        print("💬 Testing Chat Service...")
        self.results['chat'] = self.test_service_health('chat', self.base_urls['chat'])
        print(f"   Status: {self.results['chat']['status']}")
        
        # Test Backend
        print("\n🔧 Testing Backend Service:")
        print("-" * 30)
        self.results['backend'] = self.test_backend_health()
        print(f"   Status: {self.results['backend']['status']}")
        
        # Test Frontend
        print("\n🌐 Testing Frontend Service:")
        print("-" * 30)
        try:
            response = requests.get(self.base_urls['frontend'], timeout=10)
            self.results['frontend'] = {
                'status': 'healthy' if response.status_code == 200 else 'unhealthy',
                'response_time': response.elapsed.total_seconds()
            }
            print(f"   Status: {self.results['frontend']['status']}")
        except requests.exceptions.RequestException as e:
            self.results['frontend'] = {'status': 'error', 'error': str(e)}
            print(f"   Status: {self.results['frontend']['status']}")
        
        # Test functionality
        print("\n🧪 Testing Functionality:")
        print("-" * 30)
        
        # Test repository scan
        print("📦 Testing Repository Scan...")
        self.results['repository_scan'] = self.test_repository_scan()
        print(f"   Status: {self.results['repository_scan']['status']}")
        
        # Test AI risk model
        print("🤖 Testing AI Risk Assessment...")
        self.results['ai_risk_assessment'] = self.test_ai_risk_model()
        print(f"   Status: {self.results['ai_risk_assessment']['status']}")
        
        # Test security scanner
        print("🔍 Testing Security Scanner Functionality...")
        self.results['security_scan'] = self.test_security_scanner()
        print(f"   Status: {self.results['security_scan']['status']}")
        
        # Test NLP explainer
        print("📝 Testing NLP Explainer Functionality...")
        self.results['nlp_extract'] = self.test_nlp_explainer()
        print(f"   Status: {self.results['nlp_extract']['status']}")
        
        # Test knowledge graph
        print("🕸️  Testing Knowledge Graph Functionality...")
        self.results['knowledge_graph_build'] = self.test_knowledge_graph()
        print(f"   Status: {self.results['knowledge_graph_build']['status']}")
        
        # Test chat service
        print("💬 Testing Chat Service Functionality...")
        self.results['chat_functionality'] = self.test_chat_service()
        print(f"   Status: {self.results['chat_functionality']['status']}")
        
        return self.results
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📋 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.results)
        successful_tests = sum(1 for result in self.results.values() 
                             if result.get('status') in ['healthy', 'success'])
        
        print(f"Total Tests: {total_tests}")
        print(f"Successful: {successful_tests}")
        print(f"Failed: {total_tests - successful_tests}")
        print(f"Success Rate: {(successful_tests/total_tests)*100:.1f}%")
        
        print("\n📊 Detailed Results:")
        print("-" * 30)
        
        for test_name, result in self.results.items():
            status = result.get('status', 'unknown')
            status_icon = "✅" if status in ['healthy', 'success'] else "❌"
            response_time = result.get('response_time')
            time_str = f" ({response_time:.2f}s)" if response_time else ""
            
            print(f"{status_icon} {test_name}: {status}{time_str}")
            
            if status not in ['healthy', 'success'] and 'error' in result:
                print(f"   Error: {result['error']}")
        
        print("\n🎯 Recommendations:")
        print("-" * 30)
        
        if successful_tests == total_tests:
            print("✅ All services are running correctly!")
            print("🚀 The AI-Powered OSS Analyzer is ready to use.")
        else:
            print("⚠️  Some services are not working correctly.")
            print("🔧 Please check the service logs and ensure all services are started.")
            
            # Specific recommendations
            if self.results.get('backend', {}).get('status') != 'healthy':
                print("   - Check if the Spring Boot backend is running on port 8080")
            if self.results.get('frontend', {}).get('status') != 'healthy':
                print("   - Check if the Angular frontend is running on port 4200")
            if any(self.results.get(service, {}).get('status') != 'healthy' 
                   for service in ['security_scanner', 'nlp_explainer', 'risk_model', 'knowledge_graph', 'chat']):
                print("   - Check if all AI-ML services are running on their respective ports")

def main():
    """Main function"""
    tester = ServiceTester()
    
    try:
        results = tester.run_all_tests()
        tester.print_summary()
        
        # Exit with appropriate code
        successful_tests = sum(1 for result in results.values() 
                             if result.get('status') in ['healthy', 'success'])
        total_tests = len(results)
        
        if successful_tests == total_tests:
            print("\n🎉 All tests passed! The system is ready.")
            sys.exit(0)
        else:
            print("\n❌ Some tests failed. Please check the service status.")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n⏹️  Testing interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
