# Ojala Healthcare Patient Portal

A secure, modern patient portal built with React, TypeScript, and Material UI for managing health information, appointments, and care coordination.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation & Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Open browser to http://localhost:3000
```

### Available Scripts

- `npm start` - Start development server (port 3000)
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run test:e2e` - Run Cypress E2E tests

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   └── ProtectedRoute.tsx
├── contexts/           # React Context providers
│   └── AuthContext.tsx
├── pages/             # Page components
│   ├── LoginPage.tsx
│   └── DashboardPage.tsx
├── services/          # API clients and utilities
│   └── apiClient.ts
├── theme.ts           # Material UI theme
├── index.tsx          # App entry point
└── App.tsx            # Main app component

public/
└── index.html         # HTML template

cypress/
├── integration/       # E2E test specs
├── support/          # Custom commands
└── fixtures/         # Test data
```

## 🔐 Authentication

The portal uses JWT-based authentication with:
- Patient registration and login
- Automatic token refresh
- Secure token storage
- Role-based access control

## 🎨 UI/UX Features

- **Material UI v5** - Modern, accessible components
- **Responsive Design** - Mobile-first approach
- **Custom Theme** - Healthcare-focused color palette
- **Loading States** - Smooth user experience
- **Error Handling** - Comprehensive error boundaries

## 🔗 API Integration

The portal integrates with the Ojala Healthcare API for:

### Core Features
- **Authentication** - Login, registration, password reset
- **Patient Profile** - Health information management
- **Telemetry** - Device data visualization
- **Telehealth** - Video appointments
- **Messaging** - Secure provider communication
- **Care Plans** - Treatment tracking

### Endpoints
```typescript
// Authentication
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh

// Patient Data
GET /api/patient/profile
GET /api/patient/dashboard
GET /api/patient/health-score

// Telemetry
GET /api/devices/{id}/telemetry
POST /api/telemetry/analyze

// And more...
```

## 🧪 Testing

### E2E Tests (Cypress)
The portal includes comprehensive E2E tests covering:
- **Telemetry Visualization** - Real-time health monitoring
- **Telehealth Integration** - Appointment scheduling
- **Omics Insights** - Genomic data analysis

```bash
# Run E2E tests
npm run cypress:open   # Interactive mode
npm run cypress:run    # Headless mode
```

### Test Configuration
- Base URL: `http://localhost:3000`
- API Mock: `http://localhost:5010`
- Viewport: 1280x720

## 🔧 Configuration

### Environment Variables

**Development (.env.development)**
```
REACT_APP_API_URL=http://localhost:5010
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG_MODE=true
```

**Production (.env.production)**
```
REACT_APP_API_URL=https://api.ojala-healthcare.com
REACT_APP_ENVIRONMENT=production
REACT_APP_DEBUG_MODE=false
```

### TypeScript Configuration
- Strict mode enabled
- Path aliases configured (`@/components/*`)
- Modern ES2020 target

## 🐳 Docker Deployment

```bash
# Build image
docker build -t ojala-patient-portal .

# Run container
docker run -p 80:80 ojala-patient-portal
```

## 🚧 Development Status

### ✅ Completed
- [x] Project scaffolding and structure
- [x] Authentication system (JWT)
- [x] Protected routing
- [x] Material UI theme
- [x] API client with interceptors
- [x] Basic dashboard layout
- [x] Login/registration forms
- [x] Cypress test configuration

### 🚧 In Progress
- [ ] Telemetry visualization
- [ ] Telehealth integration
- [ ] Secure messaging
- [ ] Care plan viewer
- [ ] Profile management

### 📋 Planned Features
- [ ] Omics/genomic insights
- [ ] Real-time notifications
- [ ] Advanced analytics
- [ ] Mobile app support

## 🔒 Security Features

- JWT token management with automatic refresh
- Secure API communication
- Role-based access control
- Content Security Policy headers
- XSS protection
- CSRF protection

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Follow TypeScript strict mode
2. Use Material UI components
3. Write E2E tests for new features
4. Follow the established project structure
5. Ensure responsive design

## 📄 License

Proprietary - Ojala Healthcare

---

**Ready to develop!** Run `npm install && npm start` to begin building the Patient Portal. 
