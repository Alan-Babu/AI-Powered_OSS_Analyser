# AI-Powered OSS Analyser - Frontend

A modern, responsive web application built with Angular 19 and Tailwind CSS for analyzing open source software security risks.

## 🚀 Features

### Core Functionality
- **Dashboard**: Overview of security metrics and recent scans
- **Repository Scanning**: Comprehensive analysis of GitHub repositories
- **Risk Assessment**: AI-powered security risk evaluation
- **Vulnerability Management**: Track and manage security vulnerabilities
- **Knowledge Graph**: Visual representation of security relationships
- **AI Chatbot**: Intelligent security assistance
- **Gamified Debugger**: Interactive security learning platform

### Technical Features
- **Modern UI/UX**: Built with Tailwind CSS for beautiful, responsive design
- **Real-time Updates**: Live scanning progress and status updates
- **Interactive Components**: Rich data visualization and user interactions
- **Accessibility**: WCAG compliant with proper ARIA labels
- **Responsive Design**: Mobile-first approach for all devices

## 🛠️ Technology Stack

- **Frontend Framework**: Angular 19 (Standalone Components)
- **Styling**: Tailwind CSS 4.x
- **UI Components**: Custom components with Tailwind
- **State Management**: Angular built-in state management
- **Routing**: Angular Router with lazy loading
- **HTTP Client**: Angular HttpClient for API communication

## 📋 Prerequisites

- Node.js 18+ 
- npm 9+ or yarn
- Angular CLI 19+

## 🚀 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AI-Powered_OSS_Analyser/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:4200`

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── dashboard/           # Main dashboard component
│   │   │   ├── repository-scan/     # Repository scanning interface
│   │   │   ├── risk-assessment/     # Risk evaluation tools
│   │   │   ├── vulnerability-scan/  # Vulnerability management
│   │   │   ├── knowledge-graph/     # Knowledge graph visualization
│   │   │   ├── chatbot/             # AI chatbot interface
│   │   │   └── gamified-debugger/   # Interactive security learning
│   │   ├── services/                # API services and utilities
│   │   ├── app.component.ts         # Main app component
│   │   ├── app.routes.ts            # Application routing
│   │   └── app.config.ts            # App configuration
│   ├── styles.scss                  # Global styles with Tailwind
│   └── index.html                   # Main HTML template
├── angular.json                     # Angular CLI configuration
├── package.json                     # Dependencies and scripts
└── tailwind.config.js              # Tailwind CSS configuration
```

## 🎨 Component Overview

### Dashboard Component
- Security metrics overview
- Recent scan results
- Quick action buttons
- Risk level indicators

### Repository Scan Component
- Repository URL input
- Scan configuration options
- Real-time scan progress
- Comprehensive scan results
- Scan history management

### Risk Assessment Component
- Risk scoring algorithms
- Risk factor analysis
- Security recommendations
- Risk timeline visualization

### Vulnerability Scan Component
- Vulnerability listing and filtering
- CVE information display
- Remediation guidance
- Status management

### Knowledge Graph Component
- Interactive graph visualization
- Security relationship mapping
- Node filtering and search
- Risk-based coloring

### AI Chatbot Component
- Natural language security queries
- Context-aware responses
- Security guidance and tips
- Interactive conversation flow

### Gamified Debugger Component
- Security challenge games
- Code vulnerability identification
- Progressive difficulty levels
- Leaderboard and scoring

## 🎯 Key Features

### Security Analysis
- **Dependency Scanning**: Analyze package dependencies for vulnerabilities
- **Code Quality**: Assess code security practices and patterns
- **License Compliance**: Check open source license compatibility
- **Risk Scoring**: AI-powered risk assessment algorithms

### User Experience
- **Intuitive Interface**: Clean, modern design following Material Design principles
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **Real-time Feedback**: Live updates and progress indicators
- **Accessibility**: Full keyboard navigation and screen reader support

### Data Visualization
- **Interactive Charts**: Dynamic security metrics and trends
- **Knowledge Graphs**: Visual security relationship mapping
- **Progress Indicators**: Real-time scan and analysis progress
- **Status Dashboards**: Comprehensive security overview

## 🔧 Development

### Available Scripts

```bash
# Development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Build with watch mode
npm run watch
```

### Code Style
- Follow Angular style guide
- Use TypeScript strict mode
- Implement proper error handling
- Write comprehensive unit tests
- Follow accessibility guidelines

### Component Development
- Use standalone components (Angular 19)
- Implement proper input/output decorators
- Use OnPush change detection strategy
- Implement proper lifecycle hooks
- Follow single responsibility principle

## 🌐 API Integration

The frontend integrates with the backend OSS Analyser API:

- **Base URL**: `http://localhost:8080`
- **Authentication**: JWT-based authentication
- **Endpoints**: RESTful API for all security operations
- **Real-time**: WebSocket support for live updates

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Configuration
- Configure API endpoints in environment files
- Set production build optimizations
- Configure CDN and asset optimization

### Deployment Options
- **Static Hosting**: Netlify, Vercel, GitHub Pages
- **Container**: Docker containerization
- **Cloud**: AWS S3, Azure Blob Storage
- **Traditional**: Apache, Nginx servers

## 🧪 Testing

### Unit Tests
- Component testing with Angular TestBed
- Service testing with dependency injection
- Mock data and service stubs
- High test coverage requirements

### Integration Tests
- API integration testing
- End-to-end user workflows
- Cross-browser compatibility
- Performance testing

## 📱 Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Progressive Enhancement**: Graceful degradation for older browsers

## 🔒 Security Features

- **Input Validation**: Client-side and server-side validation
- **XSS Protection**: Content Security Policy implementation
- **CSRF Protection**: Cross-site request forgery prevention
- **Secure Headers**: Security-focused HTTP headers
- **Authentication**: JWT token management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests and documentation
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team

## 🔮 Roadmap

### Upcoming Features
- **Advanced Analytics**: Machine learning insights
- **Team Collaboration**: Multi-user support
- **Integration APIs**: Third-party tool integration
- **Mobile App**: Native mobile applications
- **Advanced Reporting**: Custom report generation

### Performance Improvements
- **Lazy Loading**: Component and module lazy loading
- **Caching**: Intelligent data caching strategies
- **Optimization**: Bundle size and performance optimization
- **PWA**: Progressive web app capabilities

---

**Built with ❤️ using Angular 19 and Tailwind CSS**
