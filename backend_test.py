#!/usr/bin/env python3
"""
Backend API Testing for Pomodoro Study App with Cosmetics Shop
Tests the cosmetics shop functionality and related APIs
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, List

class CosmeticsAPITester:
    def __init__(self, base_url="https://tier-system-revamp.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            
        result = {
            "test_name": name,
            "success": success,
            "details": details,
            "response_data": response_data if success else None,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, data: Dict = None, headers: Dict = None) -> tuple[bool, Any]:
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        
        # Default headers
        default_headers = {'Content-Type': 'application/json'}
        if self.token:
            default_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            default_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, timeout=10)
            else:
                self.log_test(name, False, f"Unsupported method: {method}")
                return False, {}

            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            if success:
                self.log_test(name, True, f"Status: {response.status_code}", response_data)
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}. Response: {response.text[:200]}")

            return success, response_data

        except requests.exceptions.Timeout:
            self.log_test(name, False, "Request timeout")
            return False, {}
        except requests.exceptions.ConnectionError:
            self.log_test(name, False, "Connection error - backend may be down")
            return False, {}
        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_health_check(self) -> bool:
        """Test if backend is running"""
        success, _ = self.run_test("Health Check", "GET", "health", 200)
        return success

    def test_create_user(self) -> bool:
        """Test user creation"""
        test_user_data = {
            "email": f"test_user_{datetime.now().strftime('%H%M%S')}@test.com",
            "name": "Test User Cosmetics",
            "photo": None
        }
        
        success, response = self.run_test("Create User", "POST", "users", 200, test_user_data)
        
        if success and response:
            self.user_id = response.get('id')
            self.token = self.user_id  # Using user_id as token for this simple auth
            self.log_test("User Creation Setup", True, f"User ID: {self.user_id}")
            return True
        
        return False

    def test_get_cosmetics(self) -> tuple[bool, List[Dict]]:
        """Test getting cosmetics list - main functionality to test"""
        success, response = self.run_test("Get Cosmetics List", "GET", "cosmetics", 200)
        
        if success and response:
            cosmetics = response if isinstance(response, list) else response.get('items', [])
            
            # Validate cosmetics structure
            if not cosmetics:
                self.log_test("Cosmetics Validation", False, "No cosmetics found - expected 87 items")
                return False, []
            
            # Check if we have the expected number of items (87 as mentioned by main agent)
            item_count = len(cosmetics)
            if item_count < 50:  # Allow some flexibility but expect significant number
                self.log_test("Cosmetics Count", False, f"Only {item_count} items found, expected around 87")
            else:
                self.log_test("Cosmetics Count", True, f"Found {item_count} cosmetic items")
            
            # Validate cosmetic item structure
            sample_item = cosmetics[0] if cosmetics else {}
            required_fields = ['id', 'name', 'type', 'price', 'style_data']
            missing_fields = [field for field in required_fields if field not in sample_item]
            
            if missing_fields:
                self.log_test("Cosmetics Structure", False, f"Missing fields: {missing_fields}")
                return False, cosmetics
            else:
                self.log_test("Cosmetics Structure", True, "All required fields present")
            
            # Test different types
            types_found = set(item.get('type') for item in cosmetics)
            expected_types = {'badge', 'border', 'background'}
            
            if not expected_types.issubset(types_found):
                missing_types = expected_types - types_found
                self.log_test("Cosmetics Types", False, f"Missing types: {missing_types}")
            else:
                self.log_test("Cosmetics Types", True, f"Found all types: {types_found}")
            
            # Test rarity system
            rarities_found = set()
            svg_count = 0
            
            for item in cosmetics[:10]:  # Check first 10 items
                style_data = item.get('style_data', {})
                if 'rarity' in style_data:
                    rarities_found.add(style_data['rarity'])
                if 'svg' in style_data:
                    svg_count += 1
            
            if rarities_found:
                self.log_test("Rarity System", True, f"Found rarities: {rarities_found}")
            else:
                self.log_test("Rarity System", False, "No rarity data found in cosmetics")
            
            if svg_count > 0:
                self.log_test("SVG Images", True, f"Found {svg_count} items with SVG data")
            else:
                self.log_test("SVG Images", False, "No SVG data found in cosmetics")
            
            return True, cosmetics
        
        return False, []

    def test_buy_cosmetic(self, cosmetics: List[Dict]) -> bool:
        """Test buying a cosmetic item"""
        if not cosmetics:
            self.log_test("Buy Cosmetic", False, "No cosmetics available to test purchase")
            return False
        
        # Find a cheap item to test purchase
        cheap_item = min(cosmetics, key=lambda x: x.get('price', float('inf')))
        item_id = cheap_item.get('id')
        
        if not item_id:
            self.log_test("Buy Cosmetic", False, "No valid item ID found")
            return False
        
        # First, we need to give the user some coins
        # Since we can't directly modify user coins, we'll test the purchase endpoint
        # and expect it to fail with "Insufficient coins" which proves the endpoint works
        success, response = self.run_test(
            "Buy Cosmetic (Expected Insufficient Coins)", 
            "POST", 
            f"cosmetics/buy/{item_id}", 
            400  # Expecting 400 due to insufficient coins
        )
        
        # Check if the error message is about insufficient coins
        if success and response:
            detail = response.get('detail', '')
            if 'Insufficient coins' in detail or 'coins' in detail.lower():
                self.log_test("Buy Cosmetic Logic", True, "Purchase logic working - insufficient coins error as expected")
                return True
            else:
                self.log_test("Buy Cosmetic Logic", False, f"Unexpected error: {detail}")
                return False
        
        return success

    def test_user_data(self) -> bool:
        """Test getting current user data"""
        if not self.token:
            self.log_test("Get User Data", False, "No authentication token available")
            return False
        
        success, response = self.run_test("Get Current User", "GET", "users/me", 200)
        
        if success and response:
            # Validate user structure
            required_fields = ['id', 'email', 'name', 'coins', 'xp', 'level']
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                self.log_test("User Data Structure", False, f"Missing fields: {missing_fields}")
                return False
            else:
                coins = response.get('coins', 0)
                level = response.get('level', 0)
                xp = response.get('xp', 0)
                self.log_test("User Data Structure", True, f"Coins: {coins}, Level: {level}, XP: {xp}")
                return True
        
        return False

    def run_all_tests(self) -> Dict[str, Any]:
        """Run all cosmetics-related tests"""
        print("🧪 Starting Cosmetics API Testing...")
        print(f"🔗 Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Test 1: Health check
        if not self.test_health_check():
            print("❌ Backend is not responding. Stopping tests.")
            return self.get_summary()
        
        # Test 2: Create user for testing
        if not self.test_create_user():
            print("❌ Cannot create user. Stopping tests.")
            return self.get_summary()
        
        # Test 3: Get user data
        self.test_user_data()
        
        # Test 4: Get cosmetics (main functionality)
        cosmetics_success, cosmetics = self.test_get_cosmetics()
        
        # Test 5: Test purchase functionality
        if cosmetics_success:
            self.test_buy_cosmetic(cosmetics)
        
        return self.get_summary()

    def get_summary(self) -> Dict[str, Any]:
        """Get test summary"""
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        summary = {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": f"{success_rate:.1f}%",
            "test_results": self.test_results,
            "timestamp": datetime.now().isoformat()
        }
        
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
        elif self.tests_passed > 0:
            print("⚠️  Some tests failed - check details above")
        else:
            print("💥 All tests failed - major issues detected")
        
        return summary

def main():
    """Main test execution"""
    tester = CosmeticsAPITester()
    summary = tester.run_all_tests()
    
    # Save results to file
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    # Return appropriate exit code
    return 0 if summary['failed_tests'] == 0 else 1

if __name__ == "__main__":
    sys.exit(main())