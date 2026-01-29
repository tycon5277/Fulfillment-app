#!/usr/bin/env python3
"""
QuickWish Fulfillment Agent Backend API Tests
Tests the backend API endpoints including Deal Negotiation APIs as specified in the review request.
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
        self.session_token = None
        
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
            
            # Test with fake session ID (should fail with 401, 500, or 520)
            headers = {"X-Session-ID": "fake_session_id_12345"}
            response = self.session.post(f"{BASE_URL}/auth/session", headers=headers, timeout=10)
            
            if response.status_code in [401, 500, 520]:
                data = response.json()
                if "Authentication service error" in data.get("detail", "") or "Invalid session" in data.get("detail", ""):
                    self.log_result("Auth Session (Fake ID)", True, f"Correctly rejects fake session ID with {response.status_code}: {data.get('detail')}", response.status_code)
                    return True
                else:
                    self.log_result("Auth Session (Fake ID)", True, f"Correctly rejects fake session ID with {response.status_code}", response.status_code)
                    return True
            else:
                self.log_result("Auth Session (Fake ID)", False, f"Expected 401/500/520, got {response.status_code}: {response.text}", response.status_code)
                
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
    
    def test_seed_culinary_genie(self):
        """Test: Seed Culinary Genie User - POST /api/seed/culinary-genie"""
        try:
            response = self.session.post(f"{BASE_URL}/seed/culinary-genie", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                session_token = data.get("session_token")
                if session_token:
                    self.session_token = session_token
                    # Set authorization header for future requests
                    self.session.headers.update({"Authorization": f"Bearer {session_token}"})
                    self.log_result("Seed Culinary Genie", True, f"Created culinary genie user with session token", response.status_code)
                    return True
                else:
                    self.log_result("Seed Culinary Genie", False, f"No session token in response: {data}", response.status_code)
            else:
                self.log_result("Seed Culinary Genie", False, f"HTTP {response.status_code}: {response.text}", response.status_code)
                
        except requests.exceptions.RequestException as e:
            self.log_result("Seed Culinary Genie", False, f"Connection error: {str(e)}")
        except Exception as e:
            self.log_result("Seed Culinary Genie", False, f"Unexpected error: {str(e)}")
            
        return False
    
    def test_create_deal_from_wish(self):
        """Test: Create Deal from Wish - POST /api/deals/create-from-wish"""
        if not self.session_token:
            self.log_result("Create Deal from Wish", False, "No session token available")
            return None
            
        deal_data = {
            "wish_id": "cul1",
            "price": 1200,
            "scheduled_date": "Tomorrow",
            "scheduled_time": "3:00 PM",
            "notes": "I am interested!"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/deals/create-from-wish", json=deal_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                deal_id = data.get("deal_id")
                room_id = data.get("room_id")
                status = data.get("status")
                
                if deal_id and room_id and status == "pending":
                    self.log_result("Create Deal from Wish", True, f"Deal created: {deal_id}, Room: {room_id}, Status: {status}", response.status_code)
                    return deal_id
                else:
                    self.log_result("Create Deal from Wish", False, f"Missing required fields: {data}", response.status_code)
            else:
                self.log_result("Create Deal from Wish", False, f"HTTP {response.status_code}: {response.text}", response.status_code)
                
        except requests.exceptions.RequestException as e:
            self.log_result("Create Deal from Wish", False, f"Connection error: {str(e)}")
        except Exception as e:
            self.log_result("Create Deal from Wish", False, f"Unexpected error: {str(e)}")
            
        return None
    
    def test_get_my_deals(self):
        """Test: Get My Deals - GET /api/deals/my-deals"""
        if not self.session_token:
            self.log_result("Get My Deals", False, "No session token available")
            return False
            
        try:
            response = self.session.get(f"{BASE_URL}/deals/my-deals", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                deals = data.get("deals", [])
                count = data.get("count", 0)
                
                self.log_result("Get My Deals", True, f"Retrieved {count} deals", response.status_code)
                return True
            else:
                self.log_result("Get My Deals", False, f"HTTP {response.status_code}: {response.text}", response.status_code)
                
        except requests.exceptions.RequestException as e:
            self.log_result("Get My Deals", False, f"Connection error: {str(e)}")
        except Exception as e:
            self.log_result("Get My Deals", False, f"Unexpected error: {str(e)}")
            
        return False
    
    def test_send_counter_offer(self, deal_id):
        """Test: Send Counter Offer - POST /api/deals/{deal_id}/send-offer"""
        if not self.session_token or not deal_id:
            self.log_result("Send Counter Offer", False, "No session token or deal ID available")
            return False
            
        counter_data = {
            "wish_id": "cul1",
            "price": 1500
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/deals/{deal_id}/send-offer", json=counter_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                new_price = data.get("new_price")
                
                if new_price == 1500:
                    self.log_result("Send Counter Offer", True, f"Counter offer sent: ₹{new_price}", response.status_code)
                    return True
                else:
                    self.log_result("Send Counter Offer", False, f"Unexpected price: {data}", response.status_code)
            else:
                self.log_result("Send Counter Offer", False, f"HTTP {response.status_code}: {response.text}", response.status_code)
                
        except requests.exceptions.RequestException as e:
            self.log_result("Send Counter Offer", False, f"Connection error: {str(e)}")
        except Exception as e:
            self.log_result("Send Counter Offer", False, f"Unexpected error: {str(e)}")
            
        return False
    
    def test_accept_deal(self, deal_id):
        """Test: Accept Deal - POST /api/deals/{deal_id}/accept"""
        if not self.session_token or not deal_id:
            self.log_result("Accept Deal", False, "No session token or deal ID available")
            return False
            
        try:
            response = self.session.post(f"{BASE_URL}/deals/{deal_id}/accept", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                status = data.get("status")
                
                if status == "accepted":
                    self.log_result("Accept Deal", True, f"Deal accepted, status: {status}", response.status_code)
                    return True
                else:
                    self.log_result("Accept Deal", False, f"Unexpected status: {status}", response.status_code)
            else:
                self.log_result("Accept Deal", False, f"HTTP {response.status_code}: {response.text}", response.status_code)
                
        except requests.exceptions.RequestException as e:
            self.log_result("Accept Deal", False, f"Connection error: {str(e)}")
        except Exception as e:
            self.log_result("Accept Deal", False, f"Unexpected error: {str(e)}")
            
        return False
    
    def test_start_job(self, deal_id):
        """Test: Start Job - POST /api/deals/{deal_id}/start"""
        if not self.session_token or not deal_id:
            self.log_result("Start Job", False, "No session token or deal ID available")
            return False
            
        try:
            response = self.session.post(f"{BASE_URL}/deals/{deal_id}/start", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                status = data.get("status")
                
                if status == "in_progress":
                    self.log_result("Start Job", True, f"Job started, status: {status}", response.status_code)
                    return True
                else:
                    self.log_result("Start Job", False, f"Unexpected status: {status}", response.status_code)
            else:
                self.log_result("Start Job", False, f"HTTP {response.status_code}: {response.text}", response.status_code)
                
        except requests.exceptions.RequestException as e:
            self.log_result("Start Job", False, f"Connection error: {str(e)}")
        except Exception as e:
            self.log_result("Start Job", False, f"Unexpected error: {str(e)}")
            
        return False
    
    def test_complete_job(self, deal_id):
        """Test: Complete Job - POST /api/deals/{deal_id}/complete"""
        if not self.session_token or not deal_id:
            self.log_result("Complete Job", False, "No session token or deal ID available")
            return False
            
        try:
            response = self.session.post(f"{BASE_URL}/deals/{deal_id}/complete", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                status = data.get("status")
                earnings = data.get("earnings")
                
                if status == "completed" and earnings is not None:
                    self.log_result("Complete Job", True, f"Job completed, status: {status}, earnings: ₹{earnings}", response.status_code)
                    return True
                else:
                    self.log_result("Complete Job", False, f"Missing status or earnings: {data}", response.status_code)
            else:
                self.log_result("Complete Job", False, f"HTTP {response.status_code}: {response.text}", response.status_code)
                
        except requests.exceptions.RequestException as e:
            self.log_result("Complete Job", False, f"Connection error: {str(e)}")
        except Exception as e:
            self.log_result("Complete Job", False, f"Unexpected error: {str(e)}")
            
        return False
    
    def test_reject_deal(self):
        """Test: Reject Deal - POST /api/deals/{deal_id}/reject (creates new deal first)"""
        if not self.session_token:
            self.log_result("Reject Deal", False, "No session token available")
            return False
            
        # First create a new deal for rejection
        deal_data = {
            "wish_id": "cul2",
            "price": 800,
            "scheduled_date": "Next Week",
            "scheduled_time": "2:00 PM",
            "notes": "Testing rejection flow"
        }
        
        try:
            # Create new deal
            response = self.session.post(f"{BASE_URL}/deals/create-from-wish", json=deal_data, timeout=10)
            
            if response.status_code != 200:
                self.log_result("Reject Deal", False, "Failed to create new deal for rejection test")
                return False
            
            data = response.json()
            new_deal_id = data.get("deal_id")
            
            if not new_deal_id:
                self.log_result("Reject Deal", False, "No deal ID returned from new deal creation")
                return False
            
            # Now reject the deal
            response = self.session.post(f"{BASE_URL}/deals/{new_deal_id}/reject", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                status = data.get("status")
                
                if status == "rejected":
                    self.log_result("Reject Deal", True, f"Deal rejected, status: {status}", response.status_code)
                    return True
                else:
                    self.log_result("Reject Deal", False, f"Unexpected status: {status}", response.status_code)
            else:
                self.log_result("Reject Deal", False, f"HTTP {response.status_code}: {response.text}", response.status_code)
                
        except requests.exceptions.RequestException as e:
            self.log_result("Reject Deal", False, f"Connection error: {str(e)}")
        except Exception as e:
            self.log_result("Reject Deal", False, f"Unexpected error: {str(e)}")
            
        return False
    
    def run_deal_negotiation_tests(self):
        """Run Deal Negotiation API tests as requested in the review"""
        print("=" * 60)
        print("DEAL NEGOTIATION BACKEND API TESTS")
        print("=" * 60)
        print()
        
        # Test 1: Seed culinary genie user
        seed_ok = self.test_seed_culinary_genie()
        print()
        
        if not seed_ok:
            print("❌ Cannot proceed without session token")
            return False
        
        # Test 2: Create deal from wish
        deal_id = self.test_create_deal_from_wish()
        print()
        
        # Test 3: Get my deals
        self.test_get_my_deals()
        print()
        
        if deal_id:
            # Test 4: Send counter offer
            self.test_send_counter_offer(deal_id)
            print()
            
            # Test 5: Accept deal
            self.test_accept_deal(deal_id)
            print()
            
            # Test 6: Start job
            self.test_start_job(deal_id)
            print()
            
            # Test 7: Complete job
            self.test_complete_job(deal_id)
            print()
        
        # Test 8: Reject deal (creates new deal)
        self.test_reject_deal()
        print()
        
        return True
    
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