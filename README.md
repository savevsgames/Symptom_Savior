# Symptom Savior

**Your Personal Health Guardian** 🏥✨

A comprehensive React Native mobile application that empowers patients to track symptoms, receive AI-driven health guidance, and maintain secure personal health records.

**Live App:** [symptomsavior.com](https://symptomsavior.com)  
**Contact:** [info@symptomsavior.com](mailto:info@symptomsavior.com)

---

## 🌟 Vision

Symptom Savior transforms how patients manage their health by providing an intelligent, compassionate digital companion that helps track symptoms, identify patterns, and receive personalized medical guidance—all while maintaining the highest standards of privacy and security.

## 🚀 Core Features

### 📊 **Intelligent Symptom Tracking**
- **Comprehensive Logging**: Record symptoms with severity (1-10), duration, location, triggers, and detailed descriptions
- **Smart Patterns**: AI-powered pattern recognition identifies trends, triggers, and correlations
- **Visual Analytics**: Beautiful charts and graphs showing symptom frequency, severity trends, and health insights
- **Quick Entry**: Voice-to-text input for rapid symptom logging

### 🤖 **AI Health Guardian**
- **Medical RAG System**: Powered by TxAgent, providing evidence-based health guidance
- **Contextual Responses**: AI considers your personal health profile, medical history, and recent symptoms
- **Voice Interaction**: Natural speech-to-text queries and text-to-speech responses
- **Safety First**: Built-in emergency detection with immediate alerts for critical symptoms
- **Medical Disclaimers**: Clear guidance that AI assistance supplements, not replaces, professional medical care

### 👤 **Personal Health Profile**
- **Medical History**: Comprehensive tracking of conditions, medications, and allergies
- **Demographics**: Age, gender, and relevant health information for personalized care
- **Emergency Contacts**: Quick access to important contacts during health emergencies
- **Data Export**: Generate PDF reports for medical appointments

### 🔒 **Privacy & Security**
- **Row Level Security (RLS)**: Your data is completely private and isolated
- **HIPAA-Ready**: Built with healthcare compliance in mind
- **End-to-End Encryption**: All sensitive health data is encrypted
- **Local Control**: You own and control all your health information

### 📱 **Beautiful User Experience**
- **Modern Design**: Clean, medical-grade interface with thoughtful animations
- **Accessibility**: Full screen reader support and high contrast modes
- **Cross-Platform**: Works seamlessly on iOS, Android, and Web
- **Offline Support**: Core features work without internet connection

## 🏗️ Technical Architecture

### **Frontend**
- **Framework**: React Native with Expo SDK 52.0.30
- **Navigation**: Expo Router 4.0.17 with tab-based architecture
- **Language**: TypeScript with strict type checking
- **Styling**: StyleSheet.create with consistent design system
- **Icons**: Lucide React Native for beautiful, consistent iconography
- **Fonts**: Inter font family for medical-grade readability

### **Backend**
- **Database**: Supabase PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth with JWT-based security
- **AI Integration**: TxAgent medical document RAG system
- **Voice Services**: ElevenLabs for speech-to-text and text-to-speech
- **Video Avatars**: TavusAI integration (future feature)

### **Data Models**
- `user_symptoms`: Comprehensive symptom tracking with triggers and metadata
- `user_medical_profiles`: Personal health information and preferences
- `medical_consultations`: AI interaction history with safety tracking
- `documents`: Medical document storage with vector embeddings
- `agents`: AI session management and context tracking

## 📋 Development Roadmap

### **Phase 0: Foundation** ✅
- [x] Centralized logging system for development debugging
- [x] Environment variable management and feature toggles
- [x] Base UI component library with consistent theming
- [x] React Native Reusables integration

### **Phase 1: Authentication & Core Setup** 🚧
- [x] Expo Router project structure with tab navigation
- [x] Supabase client integration with RLS configuration
- [x] User authentication (sign-up/sign-in) with Supabase Auth
- [x] Protected route navigation and session management

### **Phase 2: Symptom Tracking** 📋
- [x] Database schema for user symptoms with RLS policies
- [x] Comprehensive symptom logging form with triggers and severity
- [x] Symptom history screen with real-time data
- [x] Detailed symptom view with edit/delete capabilities

### **Phase 3: AI Integration** 🤖
- [ ] AI Assistant chat interface with beautiful messaging UI
- [ ] TxAgent RAG API integration for medical consultations
- [ ] ElevenLabs text-to-speech for AI response playback
- [ ] Voice input with speech-to-text for hands-free interaction
- [ ] Consultation logging for history and analysis

### **Phase 4: Personal Health Records** 👤
- [ ] Personal information management (age, gender, demographics)
- [ ] Medical history tracking (conditions, medications, allergies)
- [ ] AI context injection using personal health profile
- [ ] Personalized recommendations based on user data

### **Phase 5: Analytics & Insights** 📊
- [ ] Interactive charts showing symptom trends over time
- [ ] AI-powered pattern recognition and health insights
- [ ] Weekly/monthly health summaries and progress tracking
- [ ] Correlation analysis between symptoms, triggers, and treatments

### **Phase 6: Advanced Features** 🔮
- [ ] TavusAI video avatar integration for visual AI responses
- [ ] Emergency symptom detection with automatic alerts
- [ ] Healthcare provider integration and data sharing
- [ ] Advanced analytics and predictive health modeling

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ and npm
- Expo CLI (`npm install -g @expo/cli`)
- Supabase account and project
- Environment variables configured

### Installation
```bash
# Clone the repository
git clone https://github.com/your-org/symptom-savior.git
cd symptom-savior

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials and API keys

# Start development server
npm run dev
```

### Environment Variables
```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Integration
EXPO_PUBLIC_TXAGENT_URL=your_txagent_api_url

# Voice Services
EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Video Avatar Services (Future)
EXPO_PUBLIC_TAVUSAI_API_KEY=your_tavusai_api_key
EXPO_PUBLIC_TAVUSAI_REPLICA_ID=your_tavusai_replica_id

# Feature Toggles
EXPO_PUBLIC_ENABLE_VOICE=true
EXPO_PUBLIC_ENABLE_EMERGENCY_DETECTION=true
EXPO_PUBLIC_ENABLE_VIDEO_AVATAR=false
EXPO_PUBLIC_DEBUG=true

# Emergency Services
EXPO_PUBLIC_EMERGENCY_WEBHOOK_URL=your_emergency_webhook_url
```

## 🎯 Key User Journeys

### **New User Onboarding**
1. **Sign Up**: Create account with email/password
2. **Profile Setup**: Enter basic health information and medical history
3. **First Symptom**: Guided tour of symptom logging features
4. **AI Introduction**: Meet your Health Guardian and ask first question
5. **Dashboard Overview**: Understand analytics and tracking features

### **Daily Symptom Tracking**
1. **Quick Log**: Tap "Log New Symptom" from dashboard
2. **Voice Entry**: Speak symptom details for hands-free logging
3. **Smart Suggestions**: AI suggests related symptoms or triggers
4. **Pattern Recognition**: View insights about symptom trends
5. **AI Consultation**: Ask Guardian about concerning patterns

### **Medical Appointment Preparation**
1. **Export Data**: Generate comprehensive health report
2. **Trend Analysis**: Review symptom patterns over time
3. **Question Preparation**: Use AI to formulate questions for doctor
4. **Medication Tracking**: Update current medications and effects
5. **Follow-up Planning**: Set reminders for post-appointment logging

## 🔐 Privacy & Compliance

- **HIPAA Compliance**: Built with healthcare privacy regulations in mind
- **Data Ownership**: Users maintain complete control over their health data
- **Encryption**: All data encrypted in transit and at rest
- **Audit Logging**: Complete audit trail of all data access and modifications
- **Right to Delete**: Users can permanently delete all their data
- **Minimal Data**: Only collect information necessary for health tracking

## 🤝 Contributing

We welcome contributions from the healthcare technology community! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:

- Code style and standards
- Testing requirements
- Security considerations
- Medical accuracy review process
- Issue reporting and feature requests

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.symptomsavior.com](https://docs.symptomsavior.com)
- **Email Support**: [info@symptomsavior.com](mailto:info@symptomsavior.com)
- **Community**: [GitHub Discussions](https://github.com/your-org/symptom-savior/discussions)
- **Bug Reports**: [GitHub Issues](https://github.com/your-org/symptom-savior/issues)

## ⚠️ Medical Disclaimer

Symptom Savior is designed to help you track and understand your health symptoms, but it is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read in this application.

---

**Built with ❤️ for better health outcomes**

*Empowering patients, supporting healthcare providers, advancing medical understanding.*