# Symptom Savior Tester - External Testing Application Design Specification

## Overview

The **Symptom Savior Tester** is a standalone testing application designed to perform comprehensive automated testing of the deployed Symptom Savior mobile application. This external testing suite ensures production quality, catches regressions early, and provides continuous monitoring of critical user journeys.

## Purpose & Scope

### Primary Objectives
- **Automated Quality Assurance**: Continuous testing of deployed builds without manual intervention
- **Early Regression Detection**: Catch breaking changes before they impact users
- **Production Monitoring**: Ongoing health checks of live application functionality
- **User Journey Validation**: Ensure critical paths work end-to-end
- **Performance Monitoring**: Track application performance metrics over time

### Testing Scope
- **End-to-End (E2E) Testing**: Complete user workflows from sign-up to advanced features
- **Component Testing**: Individual UI component functionality and rendering
- **API Integration Testing**: Backend service connectivity and data flow
- **Voice Feature Testing**: Speech-to-text and text-to-speech functionality
- **Cross-Platform Testing**: Web, iOS, and Android compatibility
- **Performance Testing**: Load times, responsiveness, and resource usage

## Architecture Overview

### Technology Stack
```
Frontend Testing:
├── Playwright (Web E2E)
├── Detox (React Native E2E)
├── Jest (Unit/Component Tests)
└── React Testing Library (Component Testing)

Backend Testing:
├── Supertest (API Testing)
├── Jest (Unit Tests)
└── Artillery (Load Testing)

Infrastructure:
├── Node.js/TypeScript
├── Docker (Containerization)
├── GitHub Actions (CI/CD)
└── PostgreSQL (Test Results Storage)

Monitoring & Alerts:
├── Slack/Discord Webhooks
├── Email Notifications
├── Dashboard (React/Next.js)
└── Metrics Collection (Prometheus/Grafana)
```

### Application Structure
```
symptom-savior-tester/
├── src/
│   ├── tests/
│   │   ├── e2e/
│   │   │   ├── web/           # Playwright web tests
│   │   │   ├── mobile/        # Detox mobile tests
│   │   │   └── shared/        # Common test utilities
│   │   ├── component/         # Component tests
│   │   ├── api/              # API integration tests
│   │   └── performance/       # Performance tests
│   ├── utils/
│   │   ├── test-data/        # Test fixtures and data
│   │   ├── helpers/          # Test helper functions
│   │   └── config/           # Environment configurations
│   ├── reporting/
│   │   ├── dashboard/        # Test results dashboard
│   │   ├── alerts/           # Alert system
│   │   └── metrics/          # Performance metrics
│   └── webhooks/
│       ├── github/           # GitHub webhook handlers
│       ├── netlify/          # Netlify deployment hooks
│       └── manual/           # Manual trigger endpoints
├── config/
│   ├── playwright.config.ts
│   ├── detox.config.js
│   └── jest.config.js
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
└── docs/
    ├── test-scenarios.md
    └── maintenance.md
```

## Core Testing Scenarios

### 1. Authentication Flow Tests
```typescript
// E2E Test Example
describe('Authentication Flow', () => {
  test('User can sign up with email and password', async () => {
    await page.goto('/sign-up');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.click('[data-testid="sign-up-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('User can sign in with existing credentials', async () => {
    await page.goto('/sign-in');
    await page.fill('[data-testid="email-input"]', 'existing@example.com');
    await page.fill('[data-testid="password-input"]', 'ExistingPass123!');
    await page.click('[data-testid="sign-in-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('Invalid credentials show appropriate error', async () => {
    await page.goto('/sign-in');
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="sign-in-button"]');
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });
});
```

### 2. Symptom Tracking Tests
```typescript
describe('Symptom Tracking', () => {
  test('User can log a new symptom with all details', async () => {
    await authenticateUser();
    await page.click('[data-testid="add-symptom-button"]');
    await page.selectOption('[data-testid="symptom-select"]', 'Headache');
    await page.click('[data-testid="severity-7"]');
    await page.fill('[data-testid="description-input"]', 'Throbbing pain on left side');
    await page.click('[data-testid="trigger-stress"]');
    await page.click('[data-testid="save-symptom-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('Symptom appears in history list', async () => {
    await authenticateUser();
    await page.goto('/symptoms');
    await expect(page.locator('[data-testid="symptom-card"]').first()).toBeVisible();
  });

  test('User can edit existing symptom', async () => {
    await authenticateUser();
    await page.goto('/symptoms');
    await page.click('[data-testid="symptom-card"]').first();
    await page.click('[data-testid="edit-button"]');
    await page.click('[data-testid="severity-5"]');
    await page.click('[data-testid="save-button"]');
    await expect(page.locator('[data-testid="severity-badge"]')).toHaveText('5/10');
  });
});
```

### 3. AI Assistant Tests
```typescript
describe('AI Assistant', () => {
  test('User can send text message and receive response', async () => {
    await authenticateUser();
    await page.goto('/assistant');
    await page.fill('[data-testid="message-input"]', 'What could cause a headache?');
    await page.click('[data-testid="send-button"]');
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible();
    await expect(page.locator('[data-testid="medical-disclaimer"]')).toBeVisible();
  });

  test('Emergency detection triggers alert', async () => {
    await authenticateUser();
    await page.goto('/assistant');
    await page.fill('[data-testid="message-input"]', 'I have severe chest pain and difficulty breathing');
    await page.click('[data-testid="send-button"]');
    await expect(page.locator('[data-testid="emergency-banner"]')).toBeVisible();
  });

  test('Voice input works correctly', async () => {
    await authenticateUser();
    await page.goto('/assistant');
    // Mock voice input or use actual audio file
    await page.click('[data-testid="voice-input-button"]');
    // Simulate voice recording
    await page.waitForTimeout(2000);
    await page.click('[data-testid="voice-input-button"]'); // Stop recording
    await expect(page.locator('[data-testid="transcribed-text"]')).toBeVisible();
  });
});
```

### 4. Profile Management Tests
```typescript
describe('Profile Management', () => {
  test('User can update personal information', async () => {
    await authenticateUser();
    await page.goto('/profile/personal-info');
    await page.fill('[data-testid="age-input"]', '30');
    await page.selectOption('[data-testid="gender-select"]', 'female');
    await page.click('[data-testid="save-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('User can add medical conditions', async () => {
    await authenticateUser();
    await page.goto('/profile/medical-history');
    await page.fill('[data-testid="condition-input"]', 'Diabetes');
    await page.click('[data-testid="add-condition-button"]');
    await expect(page.locator('[data-testid="condition-chip"]')).toContainText('Diabetes');
  });
});
```

## Component Testing

### UI Component Tests
```typescript
// Component Test Example
import { render, screen, fireEvent } from '@testing-library/react-native';
import { BaseButton } from '../components/ui/BaseButton';

describe('BaseButton Component', () => {
  test('renders with correct title', () => {
    render(<BaseButton title="Test Button" onPress={() => {}} />);
    expect(screen.getByText('Test Button')).toBeTruthy();
  });

  test('calls onPress when tapped', () => {
    const mockOnPress = jest.fn();
    render(<BaseButton title="Test Button" onPress={mockOnPress} />);
    fireEvent.press(screen.getByText('Test Button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  test('shows loading state correctly', () => {
    render(<BaseButton title="Test Button" onPress={() => {}} loading={true} />);
    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });
});
```

## API Integration Testing

### Supabase Integration Tests
```typescript
describe('Supabase Integration', () => {
  test('User can create symptom record', async () => {
    const response = await request(app)
      .post('/api/symptoms')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({
        symptom_name: 'Test Headache',
        severity: 7,
        description: 'Test description'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.symptom_name).toBe('Test Headache');
  });

  test('RLS prevents access to other users data', async () => {
    const response = await request(app)
      .get('/api/symptoms')
      .set('Authorization', `Bearer ${otherUserToken}`);
    
    expect(response.body.length).toBe(0); // Should not see test user's data
  });
});
```

### TxAgent API Tests
```typescript
describe('TxAgent Integration', () => {
  test('Medical consultation returns valid response', async () => {
    const response = await request(app)
      .post('/api/medical-consultation')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({
        query: 'What could cause a headache?',
        include_voice: false
      });
    
    expect(response.status).toBe(200);
    expect(response.body.response.text).toBeDefined();
    expect(response.body.safety.disclaimer).toBeDefined();
  });
});
```

## Performance Testing

### Load Testing Scenarios
```typescript
// Artillery.js configuration
module.exports = {
  config: {
    target: 'https://symptomsavior.com',
    phases: [
      { duration: 60, arrivalRate: 5 },  // Warm up
      { duration: 120, arrivalRate: 10 }, // Sustained load
      { duration: 60, arrivalRate: 20 }   // Peak load
    ]
  },
  scenarios: [
    {
      name: 'User Journey - Sign up and log symptom',
      weight: 70,
      flow: [
        { post: { url: '/api/auth/signup', json: { email: '{{ $randomEmail() }}', password: 'TestPass123!' } } },
        { post: { url: '/api/symptoms', json: { symptom_name: 'Headache', severity: 5 } } }
      ]
    },
    {
      name: 'AI Consultation',
      weight: 30,
      flow: [
        { post: { url: '/api/auth/signin', json: { email: 'test@example.com', password: 'TestPass123!' } } },
        { post: { url: '/api/medical-consultation', json: { query: 'What causes headaches?' } } }
      ]
    }
  ]
};
```

## Trigger Mechanisms

### 1. Webhook Integration
```typescript
// GitHub Webhook Handler
app.post('/webhooks/github', async (req, res) => {
  const { action, deployment } = req.body;
  
  if (action === 'created' && deployment.environment === 'production') {
    await triggerTestSuite({
      trigger: 'deployment',
      environment: 'production',
      deploymentUrl: deployment.payload.web_url,
      commitSha: deployment.sha
    });
  }
  
  res.status(200).send('OK');
});

// Netlify Webhook Handler
app.post('/webhooks/netlify', async (req, res) => {
  const { state, deploy_url, commit_ref } = req.body;
  
  if (state === 'ready') {
    await triggerTestSuite({
      trigger: 'netlify-deploy',
      environment: 'production',
      deploymentUrl: deploy_url,
      commitSha: commit_ref
    });
  }
  
  res.status(200).send('OK');
});
```

### 2. Scheduled Testing
```typescript
// Cron job for regular health checks
import cron from 'node-cron';

// Run health checks every hour
cron.schedule('0 * * * *', async () => {
  await triggerTestSuite({
    trigger: 'scheduled',
    environment: 'production',
    testType: 'health-check'
  });
});

// Run full test suite daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  await triggerTestSuite({
    trigger: 'scheduled',
    environment: 'production',
    testType: 'full-suite'
  });
});
```

### 3. Manual Triggers
```typescript
// Manual test trigger endpoint
app.post('/api/trigger-tests', authenticateAdmin, async (req, res) => {
  const { testType, environment, targetUrl } = req.body;
  
  const testRun = await triggerTestSuite({
    trigger: 'manual',
    environment,
    testType,
    targetUrl,
    triggeredBy: req.user.email
  });
  
  res.json({ testRunId: testRun.id, status: 'started' });
});
```

## Reporting & Alerting System

### Test Results Storage
```sql
-- Test Results Database Schema
CREATE TABLE test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type VARCHAR(50) NOT NULL,
  environment VARCHAR(50) NOT NULL,
  target_url TEXT NOT NULL,
  commit_sha VARCHAR(40),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'running',
  total_tests INTEGER DEFAULT 0,
  passed_tests INTEGER DEFAULT 0,
  failed_tests INTEGER DEFAULT 0,
  skipped_tests INTEGER DEFAULT 0
);

CREATE TABLE test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_run_id UUID REFERENCES test_runs(id),
  test_suite VARCHAR(100) NOT NULL,
  test_name VARCHAR(200) NOT NULL,
  status VARCHAR(20) NOT NULL,
  duration_ms INTEGER,
  error_message TEXT,
  screenshot_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_run_id UUID REFERENCES test_runs(id),
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL,
  metric_unit VARCHAR(20),
  page_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Alert Configuration
```typescript
interface AlertConfig {
  channels: {
    slack: {
      webhookUrl: string;
      channel: '#alerts';
      mentionUsers: ['@dev-team'];
    };
    email: {
      recipients: ['dev@company.com', 'qa@company.com'];
      smtpConfig: SMTPConfig;
    };
    discord: {
      webhookUrl: string;
      roleId: string;
    };
  };
  triggers: {
    failureThreshold: 10; // Alert if >10% tests fail
    performanceThreshold: 5000; // Alert if page load >5s
    consecutiveFailures: 3; // Alert after 3 consecutive failures
    criticalTestFailure: true; // Alert immediately for critical tests
  };
}

// Alert Handler
async function sendAlert(testRun: TestRun, alertType: AlertType) {
  const message = formatAlertMessage(testRun, alertType);
  
  await Promise.all([
    sendSlackAlert(message),
    sendEmailAlert(message),
    sendDiscordAlert(message)
  ]);
}
```

### Dashboard Interface
```typescript
// React Dashboard Component
function TestDashboard() {
  const [testRuns, setTestRuns] = useState([]);
  const [metrics, setMetrics] = useState({});
  
  return (
    <div className="dashboard">
      <header>
        <h1>Symptom Savior Test Dashboard</h1>
        <div className="status-indicators">
          <StatusBadge status={metrics.overallHealth} />
          <LastRunInfo run={testRuns[0]} />
        </div>
      </header>
      
      <main>
        <section className="test-results">
          <TestRunsList runs={testRuns} />
          <TestTrends data={metrics.trends} />
        </section>
        
        <section className="performance">
          <PerformanceCharts data={metrics.performance} />
          <AlertsPanel alerts={metrics.recentAlerts} />
        </section>
      </main>
    </div>
  );
}
```

## Test Data Management

### Test User Management
```typescript
// Test user creation and cleanup
class TestUserManager {
  async createTestUser(scenario: string): Promise<TestUser> {
    const user = await supabase.auth.signUp({
      email: `test-${scenario}-${Date.now()}@example.com`,
      password: 'TestPassword123!'
    });
    
    // Add test data
    await this.seedUserData(user.id, scenario);
    
    return user;
  }
  
  async seedUserData(userId: string, scenario: string) {
    const testData = getTestDataForScenario(scenario);
    
    // Create test symptoms
    await supabase.from('user_symptoms').insert(
      testData.symptoms.map(s => ({ ...s, user_id: userId }))
    );
    
    // Create test profile
    await supabase.from('user_medical_profiles').insert({
      ...testData.profile,
      user_id: userId
    });
  }
  
  async cleanupTestUsers() {
    // Remove test users older than 24 hours
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await supabase.auth.admin.listUsers().then(users => {
      users.data.users
        .filter(u => u.email?.includes('test-') && new Date(u.created_at) < cutoff)
        .forEach(u => supabase.auth.admin.deleteUser(u.id));
    });
  }
}
```

### Test Data Fixtures
```typescript
// Test data scenarios
export const testScenarios = {
  newUser: {
    profile: null,
    symptoms: [],
    treatments: []
  },
  
  activeUser: {
    profile: {
      full_name: 'Test User',
      age: 30,
      gender: 'female'
    },
    symptoms: [
      { symptom_name: 'Headache', severity: 7, created_at: '2024-01-01' },
      { symptom_name: 'Fatigue', severity: 5, created_at: '2024-01-02' }
    ],
    treatments: [
      { name: 'Ibuprofen', treatment_type: 'medication', doctor_recommended: true }
    ]
  },
  
  emergencyUser: {
    profile: { full_name: 'Emergency Test', age: 45 },
    symptoms: [
      { symptom_name: 'Chest Pain', severity: 9, created_at: '2024-01-01' }
    ]
  }
};
```

## Deployment & Infrastructure

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Install Playwright browsers
RUN npx playwright install --with-deps chromium

# Copy application code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  tester:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: symptom_savior_tester
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  postgres_data:
```

### GitHub Actions CI/CD
```yaml
# .github/workflows/deploy.yml
name: Deploy Tester

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          docker build -t symptom-savior-tester .
          docker push ${{ secrets.DOCKER_REGISTRY }}/symptom-savior-tester:latest
          # Deploy to your hosting provider
```

## Monitoring & Metrics

### Key Performance Indicators (KPIs)
- **Test Success Rate**: Percentage of tests passing over time
- **Mean Time to Detection (MTTD)**: How quickly issues are detected
- **Mean Time to Resolution (MTTR)**: How quickly issues are resolved
- **Application Performance**: Page load times, API response times
- **User Journey Completion**: Success rate of critical user flows
- **Availability**: Uptime percentage of the application

### Metrics Collection
```typescript
// Metrics collector
class MetricsCollector {
  async collectPerformanceMetrics(page: Page): Promise<PerformanceMetrics> {
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        largestContentfulPaint: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime || 0
      };
    });
    
    return metrics;
  }
  
  async recordTestResult(testResult: TestResult) {
    await this.database.testResults.create({
      data: {
        testRunId: testResult.runId,
        testSuite: testResult.suite,
        testName: testResult.name,
        status: testResult.status,
        durationMs: testResult.duration,
        errorMessage: testResult.error?.message,
        screenshotUrl: testResult.screenshotUrl
      }
    });
  }
}
```

## Future Enhancements

### Phase 1: Core Testing (MVP)
- Basic E2E test coverage for critical user journeys
- Component testing for UI elements
- API integration testing
- Simple alerting via Slack/email
- Basic dashboard for test results

### Phase 2: Advanced Testing
- Performance testing and monitoring
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile device testing (iOS/Android simulators)
- Visual regression testing
- Accessibility testing

### Phase 3: User Simulation
- Realistic user behavior simulation
- Load testing with multiple concurrent users
- Chaos engineering (fault injection)
- A/B testing support
- User journey analytics

### Phase 4: AI-Powered Testing
- Intelligent test case generation
- Automatic bug detection and classification
- Predictive failure analysis
- Self-healing tests
- Natural language test creation

## Cost Estimation

### Infrastructure Costs (Monthly)
- **Hosting**: $50-100 (VPS or cloud hosting)
- **Database**: $20-50 (Managed PostgreSQL)
- **Monitoring**: $20-40 (Grafana Cloud or similar)
- **CI/CD**: $0-50 (GitHub Actions minutes)
- **Total**: ~$90-240/month

### Development Time Estimate
- **Initial Setup**: 2-3 weeks
- **Core Test Suite**: 3-4 weeks
- **Dashboard & Alerting**: 1-2 weeks
- **Documentation & Training**: 1 week
- **Total**: 7-10 weeks for full implementation

## Maintenance & Operations

### Daily Operations
- Monitor test results and alerts
- Review failed tests and investigate issues
- Update test data and scenarios as needed
- Check system health and performance

### Weekly Operations
- Review test coverage and add new scenarios
- Update test environment configurations
- Analyze trends and performance metrics
- Plan improvements and optimizations

### Monthly Operations
- Review and update test data retention policies
- Evaluate and update testing tools and frameworks
- Conduct security reviews of test infrastructure
- Plan capacity and scaling requirements

## Security Considerations

### Test Data Security
- Use synthetic test data only
- Implement data encryption for sensitive test information
- Regular cleanup of test users and data
- Secure storage of API keys and credentials

### Access Control
- Role-based access to test dashboard and controls
- Audit logging for all test operations
- Secure webhook endpoints with proper authentication
- Network security for test infrastructure

## Conclusion

The Symptom Savior Tester provides a comprehensive testing solution that ensures the quality and reliability of the main application. By implementing this external testing suite, you'll have:

1. **Confidence in Deployments**: Automated testing catches issues before they reach users
2. **Rapid Issue Detection**: Immediate alerts when critical functionality breaks
3. **Performance Monitoring**: Continuous tracking of application performance
4. **Quality Metrics**: Data-driven insights into application health and user experience
5. **Scalable Testing**: Framework that grows with your application's complexity

This testing application serves as a safety net for your production deployments and provides valuable insights into user experience quality, making it an essential component of a robust development and deployment pipeline.