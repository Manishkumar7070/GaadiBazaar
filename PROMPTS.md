# Master Prompts for Secure & Scalable App Development

## 🔒 SECURITY ANALYSIS PROMPTS

### 1. **Security Vulnerability Audit Prompt**
```
You are a senior security auditor. Analyze this code for security vulnerabilities:

[PASTE YOUR CODE]

Check for:
- SQL Injection vulnerabilities
- Cross-Site Scripting (XSS) attacks
- Cross-Site Request Forgery (CSRF)
- Authentication/Authorization flaws
- Insecure direct object references (IDOR)
- Hardcoded credentials or secrets
- Unsafe deserialization
- Buffer overflow risks
- Insecure API endpoints
- Input validation issues

For each vulnerability found:
1. Location in code
2. Severity level (Critical/High/Medium/Low)
3. Attack scenario
4. Fix with code example
```

### 2. **Security Requirements Review Prompt**
```
Design security requirements for [APP_TYPE] application with:
- User authentication method (JWT, OAuth2, Session-based)
- Password policy and storage (bcrypt/Argon2)
- Data encryption (at-rest and in-transit)
- API rate limiting strategy
- Input sanitization approach
- CORS policy
- HTTPS enforcement
- Logging and monitoring

Provide specific implementation code for each.
```

### 3. **OWASP Top 10 Prevention Prompt**
```
My app handles [DESCRIBE_FUNCTIONALITY]. 
Map vulnerabilities to OWASP Top 10 and provide:

For each relevant vulnerability:
1. What the vulnerability is
2. How it could affect my app
3. Code example of the vulnerability
4. Secure code implementation
5. Testing approach to verify the fix

Vulnerabilities: Injection, Broken Auth, Sensitive Data Exposure, 
XML External Entities, Broken Access Control, Security Misconfiguration, 
Cross-Site Scripting, Insecure Deserialization, Using Components with 
Known Vulnerabilities, Insufficient Logging
```

---

## ⚡ SCALABILITY & PERFORMANCE PROMPTS

### 4. **Load Testing Strategy Prompt**
```
My app [DESCRIBE_CURRENT_STATE] is expected to scale from 
[CURRENT_USERS] users to [TARGET_USERS] users.

Create a comprehensive load testing strategy:
1. Identify bottlenecks at current scale
2. Database query optimization
3. Caching strategy (Redis/Memcached)
4. CDN implementation
5. Horizontal scaling approach
6. Database scaling (read replicas, sharding)
7. Message queue implementation (RabbitMQ, Kafka)
8. API rate limiting and throttling
9. Load testing tools and scripts
10. Monitoring metrics to track

Provide specific code/configuration examples for each.
```

### 5. **Database Optimization Prompt**
```
Database performance: My [SQL/NoSQL] database with [DESCRIBE_TABLES/COLLECTIONS]:
[SCHEMA]

This handles [PEAK_LOAD] requests/second. Optimize for:
1. Slow query identification and fixes
2. Index strategy
3. Query optimization
4. Connection pooling configuration
5. Caching layer integration
6. Replication setup
7. Backup strategy
8. Horizontal scaling approach

Provide: Query plans, index definitions, and configuration code.
```

### 6. **API Rate Limiting Prompt**
```
Implement rate limiting for my [LANGUAGE] API that:
- Prevents DoS attacks
- Protects expensive endpoints
- Allows different limits per user tier
- Includes progressive backoff
- Provides clear error messages

Provide:
1. Algorithm (token bucket / sliding window)
2. Complete implementation code
3. Configuration for different endpoints
4. Monitoring and alerting setup
5. Client-side handling example
```

---

## 🛡️ RESILIENCE & ERROR HANDLING PROMPTS

### 7. **Crash Prevention & Error Handling Prompt**
```
Prevent crashes in my [LANGUAGE] app during high load:

[PASTE CRITICAL CODE SECTIONS]

Implement:
1. Try-catch with specific error types
2. Graceful degradation
3. Circuit breaker pattern
4. Retry logic with exponential backoff
5. Timeout handling
6. Memory leak prevention
7. Resource cleanup
8. Error logging and alerting
9. User-friendly error messages
10. Fallback mechanisms

Show code examples for production-ready error handling.
```

### 8. **Database Connection Resilience Prompt**
```
My [DATABASE] connection in [LANGUAGE] crashes under load.

Implement resilience for:
1. Connection pooling configuration
2. Connection timeout and retry
3. Failover to read replicas
4. Connection reuse strategy
5. Monitoring pool health
6. Graceful connection draining
7. Deadlock prevention
8. Transaction management
9. Error recovery
10. Load balancing across replicas

Provide full implementation with configuration.
```

### 9. **Circuit Breaker Pattern Prompt**
```
Implement circuit breaker pattern for:
- External API calls to [SERVICE_NAME]
- Database queries under load
- Payment processing
- Third-party integrations

Requirements:
1. Closed state (normal operation)
2. Open state (fail fast)
3. Half-open state (recovery attempt)
4. Configurable thresholds
5. Monitoring and metrics
6. Fallback behavior
7. Alert conditions

Provide complete implementation in [LANGUAGE].
```

---

## 🔍 MONITORING & DETECTION PROMPTS

### 10. **Security Monitoring Setup Prompt**
```
Set up comprehensive security monitoring for [APP_TYPE]:

Implement detection for:
1. Failed login attempts and brute force
2. Unauthorized access attempts
3. SQL injection attempts
4. XSS attack patterns
5. Unusual API usage patterns
6. Data exfiltration signs
7. Configuration changes
8. Privilege escalation attempts
9. Malware indicators
10. DDoS patterns

For each:
- Logging format
- Alert thresholds
- Detection code
- Response action
- Escalation procedure

Provide: ELK stack / Splunk / CloudWatch configuration examples.
```

### 11. **Performance Monitoring Prompt**
```
Monitor app health during traffic spikes from [CURRENT] to [PEAK] requests/sec:

Track:
1. API response times (p50, p95, p99)
2. Database query performance
3. Memory usage and leaks
4. CPU utilization
5. Disk I/O patterns
6. Network bandwidth
7. Error rates by endpoint
8. User experience metrics
9. Cache hit rates
10. Queue depths

Setup:
- Metrics collection (Prometheus, New Relic, Datadog)
- Dashboards
- Alert thresholds
- Auto-scaling triggers

Provide configuration code and alert rules.
```

### 12. **Security Incident Response Prompt**
```
Create incident response procedure for [APP_TYPE]:

For each scenario:
- Active attack/intrusion
- Data breach
- DDoS attack
- Database corruption
- API compromise
- Credential leak

Provide:
1. Detection indicators
2. Immediate response steps
3. Investigation process
4. Communication plan
5. Remediation steps
6. Post-incident review
7. Code/documentation templates
8. Contact escalation path
```

---

## 🧪 TESTING & VALIDATION PROMPTS

### 13. **Security Testing Strategy Prompt**
```
Create security testing plan for [APP_DESCRIPTION]:

Include:
1. Unit tests for security functions (auth, encryption, validation)
2. Integration tests for security flows
3. SAST (Static Application Security Testing) implementation
4. DAST (Dynamic Application Security Testing)
5. Penetration testing approach
6. Security regression tests
7. Dependency vulnerability scanning
8. Secret scanning in code
9. Load-based security testing
10. Data privacy testing

Provide:
- Test code examples
- CI/CD pipeline integration
- Tools configuration (OWASP ZAP, Burp Suite)
- Coverage targets
- Reporting format
```

### 14. **Load & Stress Testing Prompt**
```
Create load testing suite for my [LANGUAGE] app:

[PROVIDE ARCHITECTURE]

Requirements:
1. Simulate [TARGET_USER_COUNT] concurrent users
2. Test critical user flows
3. Identify breaking point
4. Memory leak detection
5. Database connection limits
6. Cache performance
7. API response degradation
8. Error handling under stress

Provide:
- Apache JMeter / Locust / K6 script
- Test scenarios
- Metrics collection
- Results analysis
- Reporting
```

### 15. **Input Validation Testing Prompt**
```
Validate input handling for [ENDPOINT/FEATURE]:

Test cases for:
1. SQL injection payloads
2. XSS vectors
3. Command injection
4. Path traversal
5. XXE attacks
6. LDAP injection
7. Buffer overflow attempts
8. Unicode/encoding attacks
9. Type confusion
10. Business logic bypass

Provide:
- Test payloads
- Validation code
- Sanitization functions
- Expected outputs
- Test automation code
```

---

## 📋 CODE REVIEW PROMPTS

### 16. **Security Code Review Prompt**
```
Review this code for security issues, scalability, and production readiness:

[PASTE ENTIRE CODE FILE]

Analyze:
1. Authentication/Authorization logic
2. Data validation and sanitization
3. Error handling and logging
4. Resource management
5. Dependency vulnerabilities
6. Hardcoded values or secrets
7. Race conditions or concurrency issues
8. Performance bottlenecks
9. Caching strategy
10. Third-party integration risks

For each issue:
- Location
- Severity
- Explanation
- Fixed code
- Testing approach
```

### 17. **API Security Review Prompt**
```
Security review of my [REST/GraphQL/gRPC] API:

[PROVIDE API ENDPOINTS, METHODS, AUTHENTICATION]

Check:
1. Authentication method (is it secure?)
2. Authorization (least privilege?)
3. Input validation on all endpoints
4. Output encoding
5. Error messages (information leakage?)
6. API versioning
7. CORS configuration
8. Rate limiting
9. Logging (sensitive data?)
10. Documentation accuracy

Provide fixes and secure code examples.
```

### 18. **Dependency Vulnerability Audit Prompt**
```
Audit my [LANGUAGE] project dependencies:

[PASTE package.json / requirements.txt / Cargo.toml / pom.xml]

Identify:
1. Known vulnerabilities (CVE)
2. Outdated packages
3. Abandoned packages
4. License compliance issues
5. Supply chain risks
6. Dependency conflicts

Provide:
- Update plan with compatibility checks
- Workarounds for breaking changes
- Timeline for upgrades
- Testing strategy
- Automated scanning setup (Snyk, Dependabot)
```

---

## 🚀 DEPLOYMENT & INFRASTRUCTURE PROMPTS

### 19. **Secure Deployment Pipeline Prompt**
```
Create secure CI/CD pipeline for [PLATFORM]:

Stages:
1. Code commit and scanning
   - SAST tools (SonarQube)
   - Secret scanning (git-secrets, TruffleHog)
   - Dependency scanning
   
2. Build
   - Secure dependency resolution
   - Container scanning (if Docker)
   - Binary signing
   
3. Test
   - Unit + integration tests
   - Security tests
   - Load tests
   
4. Deploy
   - Infrastructure as Code validation
   - Blue-green or canary deployment
   - Post-deployment security tests
   
5. Monitor
   - Security alerts
   - Performance monitoring
   - Audit logging

Provide: GitHub Actions / GitLab CI / Jenkins configuration.
```

### 20. **Container Security Prompt**
```
Secure my Docker/Kubernetes deployment:

Implement:
1. Base image selection and scanning
2. Multi-stage builds
3. Non-root user execution
4. Resource limits (CPU, memory)
5. Network policies
6. Secrets management (not in images)
7. Image signing and verification
8. Registry scanning
9. Runtime monitoring
10. Pod security policies

Provide:
- Dockerfile best practices
- Kubernetes YAML configurations
- Security scanning setup
- Deployment checklist
```

---

## 🔐 AUTHENTICATION & DATA PROTECTION PROMPTS

### 21. **Authentication System Design Prompt**
```
Design authentication system for [APP_TYPE]:

Support:
1. User/password with secure storage
2. OAuth2/OIDC (Google, GitHub, etc.)
3. Multi-factor authentication (MFA)
4. Session management
5. Token refresh strategy
6. Account lockout after failed attempts
7. Password reset securely
8. Remember device functionality
9. Audit logging of auth events
10. Rate limiting on auth endpoints

Provide:
- Architecture diagram (ASCII/text)
- Implementation code in [LANGUAGE]
- Database schema
- Security considerations
- Testing approach
```

### 22. **Data Encryption Strategy Prompt**
```
Implement encryption for sensitive data in [APP_TYPE]:

For:
1. Passwords: Hashing algorithm (bcrypt/Argon2)
2. PII: Encryption at rest (AES-256)
3. Tokens: Signing and verification (JWT)
4. Transmission: TLS/SSL configuration
5. Database fields: Column-level encryption
6. Backups: Encrypted storage
7. Key management: Rotation strategy
8. Data deletion: Secure wiping

Provide:
- Implementation code
- Key management setup
- Configuration for [LANGUAGE]
- Performance impact analysis
- Compliance mapping (GDPR, PCI-DSS)
```

---

## 📊 PERFORMANCE OPTIMIZATION PROMPTS

### 23. **Caching Strategy Prompt**
```
Optimize caching for [APP_DESCRIPTION]:

Implement:
1. Browser caching headers
2. CDN caching for static assets
3. Server-side caching (Redis/Memcached)
   - Cache invalidation strategy
   - TTL configuration
   - Cache warming
4. Query result caching
5. API response caching
6. Database query caching
7. Distributed caching for [MICROSERVICES/LOAD_BALANCED]
8. Cache monitoring and metrics

Provide:
- Code implementation
- Configuration
- Cache hit/miss optimization
- Monitoring setup
- Performance benchmark
```

### 24. **Query Optimization Prompt**
```
Optimize slow queries in my [DATABASE]:

Slow queries:
[PASTE SQL QUERIES]

For each:
1. Execution plan analysis
2. Index recommendations
3. Query rewrite suggestions
4. Caching opportunities
5. Denormalization options
6. Query splitting strategy
7. Pagination approach
8. Aggregation optimization

Provide:
- EXPLAIN output analysis
- Index definitions (CREATE INDEX)
- Rewritten queries
- Performance comparison before/after
```

---

## ✅ CHECKLISTS & COMPLIANCE PROMPTS

### 25. **Production Readiness Checklist Prompt**
```
Verify app is production-ready before deployment:

Security:
☐ All inputs validated
☐ No hardcoded secrets
☐ Authentication working
☐ Rate limiting enabled
☐ Error messages don't leak info
☐ HTTPS configured
☐ CORS policy set correctly

Performance:
☐ Database indexes optimized
☐ Caching configured
☐ API response times acceptable
☐ Memory usage stable
☐ Load tested
☐ Auto-scaling configured

Reliability:
☐ Error handling comprehensive
☐ Logging configured
☐ Monitoring active
☐ Alerts configured
☐ Backup strategy verified
☐ Disaster recovery tested

Compliance:
☐ Privacy policy updated
☐ GDPR compliance verified
☐ Data retention policy set
☐ Audit logging enabled

For each unchecked item, provide implementation steps.
```,Overwrite:true,TargetFile:
