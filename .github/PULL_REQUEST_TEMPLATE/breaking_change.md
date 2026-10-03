# 💥 Breaking Change 🚨⚠️

> 🛑 **Important:** This PR introduces changes that may affect existing consumers, APIs, contracts, database schemas, integrations, or application behavior. 🔄

## 📝 What is changing and why? 🔍
<!-- 💡 Describe the current behavior, the new behavior, and why we are forcing this breaking change (e.g., security compliance, major architecture overhaul). -->
* 🔴 **Old Behavior:**
* 🟢 **New Behavior:**
* 🎯 **Reason for Change:**
* 📅 **Effective From:**

## 🔍 Impact Analysis 🎯
<!-- 👥 Who or what is affected by this change? (e.g., Mobile App v2.0, Web Portal, external API consumers, database downstream jobs). -->
* 👥 **Affected Consumers / Teams:**
* 🔌 **Affected APIs / Integrations:**
* 🗄️ **Affected Database Objects:**
* 📱 **Affected Applications / Clients:**
* ⚠️ **Potential Risks:**

## 🔄 Migration Path / Instructions 🛠️
<!-- 📖 Provide exact instructions or examples on how consumers of this code/API need to update their systems to avoid breaking. -->
* 🧭 **Migration Steps:**
* 🆚 **Before:**
* 🆕 **After:**
* 📦 **Required Version:**
* ⏳ **Migration Deadline:**

## 🔗 Related Issue(s) 🎫
<!-- 🔗 Link to any related Jira tickets, GitHub issues, architectural decision records (ADRs), or migration tasks. -->
*

## 🌍 Environments Tested In 🧪

* [ ] 💻 Local Development
* [ ] 🧪 QA / Test Environment
* [ ] 🚀 Staging / Pre-Production
* [ ] 🌐 Production-like Environment

## 📋 Production Readiness Checklist 🚦

### 🧪 Testing & Metrics 📊

* [ ] ✅ All Unit Tests (UT) have passed and been updated to reflect the new contracts.
* [ ] 🔄 All Integration Tests (IT) have passed and been updated.
* [ ] 🧪 Regression tests have been added for affected functionality.
* [ ] 📈 Line and Branch Code Coverage is **>= 75%**.
* [ ] 🧬 Mutation Testing score is **>= 75%**.
* [ ] 🔌 All affected API consumers have been tested against the new contract.
* [ ] 🗄️ Database migration and compatibility scenarios have been validated.

### 🧹 Code Quality & Security 🔐

* [ ] 👀 I have performed a self-review of my own code.
* [ ] 🔒 No hardcoded secrets, connection strings, or sensitive data were introduced.
* [ ] 🛡️ Security implications of the breaking change have been reviewed.
* [ ] 📐 The code follows project linting and architectural guidelines.
* [ ] 🧼 Deprecated or obsolete code has been removed where appropriate.

### 📢 Communication & Migration 📣

* [ ] 👥 All affected stakeholders (frontend teams, external clients, etc.) have been notified.
* [ ] 📣 Migration requirements have been communicated to affected teams.
* [ ] 🔢 API versioning strategies have been used if applicable (e.g., bumping from `v1` to `v2`).
* [ ] 📚 API documentation / Swagger / OpenAPI specs have been thoroughly updated.
* [ ] 📝 Release notes / migration notes have been prepared.
* [ ] ⏰ Deprecation timelines have been communicated where applicable.

### 🚀 Deployment & Maintenance 🔄

* [ ] 🗄️ Database migration scripts (if any) have been tested and reviewed.
* [ ] 🔄 Deployment sequencing has been documented where multiple services are involved.
* [ ] 🔙 A clear rollback plan is documented.
* [ ] ⚠️ Rollback limitations for the breaking change have been explicitly documented.
* [ ] 📡 Monitoring and alerting have been configured for potential migration issues.
* [ ] 🏁 Post-deployment validation steps have been documented.

## 📸 Test Evidence / Payloads 🔎
<!-- 📎 Attach before/after API payloads, database schema changes, UI screenshots, logs, or migration evidence below. -->

### 🔴 Before — Existing Contract

* 📤 **Request / Payload:**
* 📥 **Response:**
* 🗄️ **Database Schema:**

### 🟢 After — New Contract

* 📤 **Request / Payload:**
* 📥 **Response:**
* 🗄️ **Database Schema:**

### 🧪 Migration Evidence

* 📊 **Test Results:**
* 🗄️ **Migration Output:**
* 📜 **Logs:**
* 🖼️ **Screenshots / Diagrams:**

## 🚨 Deployment Strategy 🗺️
<!-- 🚀 Explain the recommended deployment sequence, especially when multiple services or consumers must be updated. -->
* 1️⃣ **Phase 1:**
* 2️⃣ **Phase 2:**
* 3️⃣ **Phase 3:**
* 4️⃣ **Post-Deployment Validation:**

## 🔙 Rollback Strategy ♻️
<!-- ⚠️ Explain how the system can be restored if the migration or deployment fails. -->
* 🔄 **Rollback Steps:**
* ⏱️ **Expected Recovery Time:**
* 🚨 **Rollback Trigger:**

## 🏁 Final Approval 🚦

* [ ] 👀 Code Owner Review Completed
* [ ] 🧪 Testing Completed
* [ ] 📢 Stakeholders Notified
* [ ] 📚 Documentation Updated
* [ ] 🔄 Migration Plan Verified
* [ ] 🔙 Rollback Plan Verified
* [ ] 🚀 Deployment Strategy Approved
* [ ] ✅ Ready for Merge
