#!/usr/bin/env python3
"""
QuickWish Fulfillment Agent Backend API Tests
Tests the backend API endpoints as specified in the review request.
"""

import requests
import json
from datetime import datetime
import sys
import os

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    base_url = line.split('=')[1].strip()
                    return f"{base_url}/api"
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
    
    # Fallback to localhost for testing
    return "http://localhost:8001/api"

BASE_URL = get_backend_url()
print(f"Testing backend at: {BASE_URL}")

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.results = []
        
    def log_result(self, test_name, success, details, response_code=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "success": success,
            "details": details,
            "response_code": response_code,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)
        print(f"{status} {test_name}: {details}")
        if response_code:
            print(f"    Response Code: {response_code}")
        
    def test_health_check(self):
        """Test 1: Health Check - GET /api/health"""
        try:
            response = self.session.get(f"{BASE_URL}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_result("Health Check", True, "Backend is healthy", response.status_code)
                    return True
                else:
                    self.log_result("Health Check", False, f"Unexpected response: {data}", response.status_code)
            else:
                self.log_result("Health Check", False, f"HTTP {response.status_code}: {response.text}", response.status_code)
                
        except requests.exceptions.RequestException as e:
            self.log_result("Health Check", False, f"Connection error: {str(e)}")
        except Exception as e:
            self.log_result("Health Check", False, f"Unexpected error: {str(e)}")
            
        return False
    
    def test_seed_orders(self):
        """Test 2a: Seed Orders - POST /api/seed/orders"""
        try:
            response = self.session.post(f"{BASE_URL}/seed/orders", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "Created" in data.get("message", ""):
                    self.log_result("Seed Orders", True, f"Successfully created test orders: {data['message']}", response.status_code)
                    return True
                else:
                    self.log_result("Seed Orders", False, f"Unexpected response: {data}", response.status_code)
            else:
                self.log_result("Seed Orders", False, f"HTTP {response.status_code}: {response.text}", response.status_code)
                
        except requests.exceptions.RequestException as e:
            self.log_result("Seed Orders", False, f"Connection error: {str(e)}")
        except Exception as e:
            self.log_result("Seed Orders", False, f"Unexpected error: {str(e)}")
            
        return False
    
    def test_seed_wishes(self):
        """Test 2b: Seed Wishes - POST /api/seed/wishes"""
        try:
            response = self.session.post(f"{BASE_URL}/seed/wishes", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "Created" in data.get("message", ""):
                    self.log_result("Seed Wishes", True, f"Successfully created test wishes: {data['message']}", response.status_code)
                    return True
                else:
                    self.log_result("Seed Wishes", False, f"Unexpected response: {data}", response.status_code)
            else:
                self.log_result("Seed Wishes", False, f"HTTP {response.status_code}: {response.text}", response.status_code)
                
        except requests.exceptions.RequestException as e:
            self.log_result("Seed Wishes", False, f"Connection error: {str(e)}")
        except Exception as e:
            self.log_result("Seed Wishes", False, f"Unexpected error: {str(e)}")
            
        return False
    
    def test_auth_session(self):
        """Test 3: Authentication Flow - POST /api/auth/session"""
        try:
            # Test without session ID (should fail)
            response = self.session.post(f"{BASE_URL}/auth/session", timeout=10)
            
            if response.status_code == 400:
                data = response.json()
                if "Missing X-Session-ID header" in data.get("detail", ""):
                    self.log_result("Auth Session (No Header)", True, "Correctly requires X-Session-ID header", response.status_code)
                else:
                    self.log_result("Auth Session (No Header)", False, f"Unexpected error message: {data}", response.status_code)
            else:
                self.log_result("Auth Session (No Header)", False, f"Expected 400, got {response.status_code}: {response.text}", response.status_code)
            
            # Test with fake session ID (should fail with 401 or 500)
            headers = {"X-Session-ID": "fake_session_id_12345"}
            response = self.session.post(f"{BASE_URL}/auth/session", headers=headers, timeout=10)
            
            if response.status_code in [401, 500]:
                self.log_result("Auth Session (Fake ID)", True, f"Correctly rejects fake session ID with {response.status_code}", response.status_code)
                return True
            else:
                self.log_result("Auth Session (Fake ID)", False, f"Expected 401/500, got {response.status_code}: {response.text}", response.status_code)
                
        except requests.exceptions.RequestException as e:
            self.log_result("Auth Session", False, f"Connection error: {str(e)}")
        except Exception as e:
            self.log_result("Auth Session", False, f"Unexpected error: {str(e)}")
            
        return False
    
    def test_agent_endpoints_unauthorized(self):
        """Test 4: Agent Endpoints (should return 401 without auth)"""
        endpoints = [
            "/agent/available-orders",
            "/agent/available-wishes", 
            "/agent/stats",
            "/agent/earnings"
        ]
        
        all_passed = True
        
        for endpoint in endpoints:
            try:
                response = self.session.get(f"{BASE_URL}{endpoint}", timeout=10)
                
                if response.status_code == 401:
                    data = response.json()
                    if "Not authenticated" in data.get("detail", ""):
                        self.log_result(f"Agent Endpoint {endpoint}", True, "Correctly requires authentication", response.status_code)
                    else:
                        self.log_result(f"Agent Endpoint {endpoint}", False, f"Wrong error message: {data}", response.status_code)
                        all_passed = False
                else:
                    self.log_result(f"Agent Endpoint {endpoint}", False, f"Expected 401, got {response.status_code}: {response.text}", response.status_code)
                    all_passed = False
                    
            except requests.exceptions.RequestException as e:
                self.log_result(f"Agent Endpoint {endpoint}", False, f"Connection error: {str(e)}")
                all_passed = False
            except Exception as e:
                self.log_result(f"Agent Endpoint {endpoint}", False, f"Unexpected error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_additional_endpoints(self):
        """Test additional endpoints for completeness"""
        # Test auth/me without authentication
        try:
            response = self.session.get(f"{BASE_URL}/auth/me", timeout=10)
            if response.status_code == 401:
                self.log_result("Auth Me (Unauthorized)", True, "Correctly requires authentication", response.status_code)
            else:
                self.log_result("Auth Me (Unauthorized)", False, f"Expected 401, got {response.status_code}", response.status_code)
        except Exception as e:
            self.log_result("Auth Me (Unauthorized)", False, f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("=" * 60)
        print("QUICKWISH FULFILLMENT AGENT - BACKEND API TESTS")
        print("=" * 60)
        print()
        
        # Test 1: Health Check
        health_ok = self.test_health_check()
        print()
        
        # Test 2: Seed Data
        seed_orders_ok = self.test_seed_orders()
        seed_wishes_ok = self.test_seed_wishes()
        print()
        
        # Test 3: Authentication
        auth_ok = self.test_auth_session()
        print()
        
        # Test 4: Agent Endpoints
        agent_endpoints_ok = self.test_agent_endpoints_unauthorized()
        print()
        
        # Additional tests
        self.test_additional_endpoints()
        print()
        
        # Summary
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for r in self.results if r["success"])
        total = len(self.results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print()
        
        # Show failed tests
        failed_tests = [r for r in self.results if not r["success"]]
        if failed_tests:
            print("FAILED TESTS:")
            for test in failed_tests:
                print(f"  ❌ {test['test']}: {test['details']}")
        else:
            print("🎉 ALL TESTS PASSED!")
        
        print()
        
        # Critical issues summary
        critical_issues = []
        if not health_ok:
            critical_issues.append("Health check failed - backend may not be running")
        
        connection_errors = [r for r in self.results if "Connection error" in r["details"]]
        if connection_errors:
            critical_issues.append(f"Connection issues detected ({len(connection_errors)} tests)")
        
        if critical_issues:
            print("🚨 CRITICAL ISSUES:")
            for issue in critical_issues:
                print(f"  - {issue}")
        
        return passed == total

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)