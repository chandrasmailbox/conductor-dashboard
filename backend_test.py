import requests
import sys
import json
from datetime import datetime

class ConductorDashboardTester:
    def __init__(self, base_url="https://repo-insight-25.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def test_api_root(self):
        """Test the root API endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/", timeout=30)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                expected_message = "Conductor Progress Dashboard API"
                if data.get("message") == expected_message:
                    self.log_test("API Root Endpoint", True, f"Response: {data}")
                else:
                    self.log_test("API Root Endpoint", False, f"Unexpected message: {data}")
            else:
                self.log_test("API Root Endpoint", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("API Root Endpoint", False, f"Exception: {str(e)}")

    def test_repo_analyze_default(self):
        """Test repository analysis with default repo"""
        default_repo = "https://github.com/chandrasmailbox/conductor-todo"
        return self._test_repo_analyze(default_repo, "Default Repo Analysis")

    def test_repo_analyze_invalid_url(self):
        """Test repository analysis with invalid URL"""
        invalid_repo = "not-a-valid-url"
        try:
            response = requests.post(
                f"{self.base_url}/api/repo/analyze",
                json={"repo_url": invalid_repo},
                timeout=60
            )
            
            # Should return 400 for invalid URL
            success = response.status_code == 400
            if success:
                self.log_test("Invalid URL Handling", True, "Correctly rejected invalid URL")
            else:
                self.log_test("Invalid URL Handling", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Invalid URL Handling", False, f"Exception: {str(e)}")

    def test_repo_analyze_nonexistent(self):
        """Test repository analysis with non-existent repo"""
        nonexistent_repo = "https://github.com/nonexistent/repo-that-does-not-exist"
        result = self._test_repo_analyze(nonexistent_repo, "Non-existent Repo Analysis", expect_success=False)
        return result

    def _test_repo_analyze(self, repo_url, test_name, expect_success=True):
        """Helper method to test repository analysis"""
        try:
            print(f"\n🔍 Testing {test_name} with: {repo_url}")
            response = requests.post(
                f"{self.base_url}/api/repo/analyze",
                json={"repo_url": repo_url},
                timeout=60
            )
            
            if expect_success:
                success = response.status_code == 200
                if success:
                    data = response.json()
                    # Validate response structure
                    required_fields = [
                        "repo_url", "repo_name", "owner", "overall_completion",
                        "total_tasks", "completed_tasks", "in_progress_tasks",
                        "pending_tasks", "blocked_tasks", "last_synced", "commits"
                    ]
                    
                    missing_fields = [field for field in required_fields if field not in data]
                    if missing_fields:
                        self.log_test(test_name, False, f"Missing fields: {missing_fields}")
                        return False
                    
                    # Log some key metrics
                    details = f"Completion: {data['overall_completion']}%, Tasks: {data['total_tasks']}, Commits: {len(data.get('commits', []))}"
                    self.log_test(test_name, True, details)
                    return data
                else:
                    error_detail = ""
                    try:
                        error_data = response.json()
                        error_detail = error_data.get("detail", "Unknown error")
                    except:
                        error_detail = response.text
                    self.log_test(test_name, False, f"Status: {response.status_code}, Error: {error_detail}")
                    return False
            else:
                # For non-existent repos, we might get 200 with empty data or error
                success = response.status_code in [200, 400, 404]
                if success:
                    self.log_test(test_name, True, f"Handled gracefully with status: {response.status_code}")
                else:
                    self.log_test(test_name, False, f"Unexpected status: {response.status_code}")
                return success
                
        except Exception as e:
            self.log_test(test_name, False, f"Exception: {str(e)}")
            return False

    def test_cached_repos(self):
        """Test the cached repositories endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/repo/cached", timeout=30)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.log_test("Cached Repos Endpoint", True, f"Found {len(data)} cached repos")
            else:
                self.log_test("Cached Repos Endpoint", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Cached Repos Endpoint", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Conductor Dashboard Backend Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test API endpoints
        self.test_api_root()
        self.test_cached_repos()
        
        # Test repository analysis
        self.test_repo_analyze_default()
        self.test_repo_analyze_invalid_url()
        self.test_repo_analyze_nonexistent()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return False

def main():
    tester = ConductorDashboardTester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results = {
        "timestamp": datetime.now().isoformat(),
        "total_tests": tester.tests_run,
        "passed_tests": tester.tests_passed,
        "success_rate": round((tester.tests_passed / tester.tests_run) * 100, 1) if tester.tests_run > 0 else 0,
        "test_details": tester.test_results
    }
    
    with open("/app/test_reports/backend_test_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())