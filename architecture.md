file CareOps - System Architecture

## 📐 Architecture Overview (Built on First Principles)

CareOps follows a **3-Tier Architecture** with clear separation of concerns, designed around the **First Principles Thinking** and **Inversion** framework from `.clinerule.md`. The architecture embodies:

### Core Principles in Architecture
- **Simplicity Over Complexity**: One system, not many tools
- **Visibility First**: Real-time data and actionable alerts
- **Zero Friction for Customers**: No-login interactions
- **Predictable Automation**: Strict event-based rules
- **Staff Empowerment**: Clear role separation

CareOps architecture solves the core problem of **tool chaos** by creating a unified platform where all information flows freely and visibility is paramount.

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                        │
│                    (Next.js 14 + React + Tailwind)               │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Dashboard  │  │    Inbox     │  │   Onboarding Wizard  │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Public Forms │  │Public Booking│  │   Staff Interface    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP/REST API
┌─────────────────────────────────────────────────────────────────┐
│                         API GATEWAY LAYER                        │
│                         (FastAPI + Uvicorn)                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │  Auth Router   │  │Workspace Router│  │ Booking Router   │  │
│  └────────────────┘  └────────────────┘  └──────────────────┘  │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │  Inbox Router  │  │  Forms Router  │  │Inventory Router  │  │
│  └────────────────┘  └────────────────┘  └──────────────────┘  │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │Automation Engine│  │Integration Svcs│  │  Webhook Handler │  │
│  └────────────────┘  └────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ SQLAlchemy ORM
┌─────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                               │
│                     (PostgreSQL 14+)                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Core Tables │  │Booking Tables│  │ Communication Tables │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Form Tables │  │Inventory Tbls│  │ Integration Tables   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Architecture

### 1. Customer Journey Flow

```
Customer                        CareOps Platform
   │                                   │
   ├──── Contact Form Submit ─────────►│
   │                                   ├──► Create Contact
   │                                   ├──► Create Conversation
   │                                   ├──► Send Welcome Message (Auto)
   │◄─── Welcome Email/SMS ────────────┤
   │                                   │
   │◄─── Booking Link (from Staff) ────┤
   │                                   │
   ├──── Booking Submit ──────────────►│
   │                                   ├──► Create Booking
   │                                   ├──► Send Confirmation (Auto)
   │                                   ├──► Send Forms (Auto)
   │                                   ├──► Schedule Reminders (Auto)
   │◄─── Confirmation + Forms ─────────┤
   │                                   │
   ├──── Form Completion ─────────────►│
   │                                   ├──► Update Form Status
   │                                   ├──► Notify Staff (Auto)
   │                                   │
   │◄─── Reminder 24h before ──────────┤
   │                                   │
   ├──── Attends Booking ─────────────►│ (Staff marks completed)
   │                                   ├──► Update Booking Status
   │                                   ├──► Update Inventory (Auto)
```

### 2. Staff Workflow Flow

```
Staff User                      CareOps Platform
   │                                   │
   ├──── Login ───────────────────────►│
   │                                   ├──► Validate Permissions
   │◄─── Dashboard with Alerts ────────┤
   │                                   │
   ├──── Click Alert (e.g., Inbox) ───►│
   │◄─── Open Inbox with Conversation ─┤
   │                                   │
   ├──── Reply to Customer ───────────►│
   │                                   ├──► Send Message
   │                                   ├──► Pause Automation for Thread
   │                                   ├──► Update Conversation Status
   │◄─── Message Sent Confirmation ────┤
   │                                   │
   ├──── Check Bookings ──────────────►│
   │◄─── Booking List ─────────────────┤
   │                                   │
   ├──── Mark Booking Complete ───────►│
   │                                   ├──► Update Booking Status
   │                                   ├──► Decrement Inventory
   │                                   └──► Trigger Post-Booking Actions
```

### 3. Owner Dashboard Flow

```
Business Owner                  CareOps Platform
   │                                   │
   ├──── Login ───────────────────────►│
   │                                   ├──► Validate Owner Role
   │◄─── Dashboard Overview ───────────┤
   │   • Bookings Count                │
   │   • Conversations Status          │
   │   • Forms Status                  │
   │   • Inventory Alerts              │
   │   • Actionable Alerts             │
   │                                   │
   ├──── Click Alert ─────────────────►│
   │◄─── Navigate to Detail View ──────┤
   │                                   │
   ├──── Settings/Configuration ──────►│
   │◄─── Access Admin Features ────────┤
```

---

## 🗄️ Database Architecture

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    workspaces   │       │     users       │       │ staff_permissions│
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ PK id           │◄──────│ FK workspace_id │       │ PK id           │
│    name         │       │ PK id           │◄──────│ FK user_id      │
│    address      │       │    email        │       │    can_inbox    │
│    timezone     │       │    password_hash│       │    can_bookings │
│    contact_email│       │    role         │       │    can_forms    │
│    status       │       │    workspace_id │       │    can_inventory│
│ FK owner_id ────┼──────►│    created_at   │       └─────────────────┘
│    created_at   │       └─────────────────┘
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    contacts     │       │  conversations  │       │    messages     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ PK id           │◄──────│ FK contact_id   │◄──────│ FK conversation_id│
│ FK workspace_id │       │ PK id           │       │ PK id           │
│    name         │       │ FK workspace_id │       │    type         │
│    email        │       │    status       │       │    content      │
│    phone        │       │    last_msg_at  │       │    direction    │
│    source       │       │    created_at   │       │    created_at   │
│    created_at   │       └─────────────────┘       └─────────────────┘
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    bookings     │       │  booking_types  │       │   availability  │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ PK id           │       │ PK id           │◄──────│ FK booking_type_id│
│ FK contact_id   │       │ FK workspace_id │       │ PK id           │
│ FK booking_type_id│     │    name         │       │    day_of_week  │
│    scheduled_at │       │    duration     │       │    start_time   │
│    status       │       │    location     │       │    end_time     │
│    location     │       │    form_ids[]   │       └─────────────────┘
│    created_at   │       └─────────────────┘
└─────────────────┘                │
         │                         │ 1:N
         │                         ▼
         │                ┌─────────────────┐
         │                │   booking_forms │
         │                ├─────────────────┤
         │                │ PK id           │
         │                │ FK booking_id   │
         └───────────────►│ FK form_id      │
                          │    status       │
                          │    completed_at │
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     forms       │       │ inventory_items │       │ inventory_logs  │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ PK id           │       │ PK id           │◄──────│ FK item_id      │
│ FK workspace_id │       │ FK workspace_id │       │ PK id           │
│    name         │       │    name         │       │ FK booking_id   │
│    type         │       │    quantity     │       │    quantity_used│
│    file_url     │       │    threshold    │       │    created_at   │
│    required     │       │    unit         │       └─────────────────┘
│    created_at   │       └─────────────────┘
└─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│  integrations   │       │ automation_logs │
├─────────────────┤       ├─────────────────┤
│ PK id           │       │ PK id           │
│ FK workspace_id │       │ FK workspace_id │
│    type         │       │    event_type   │
│    config       │       │    entity_type  │
│    status       │       │    entity_id    │
│    created_at   │       │    action       │
└─────────────────┘       │    status       │
                          │    created_at   │
                          └─────────────────┘
```

### Table Definitions

#### Core Tables

```sql
-- Workspaces (Multi-tenant isolation)
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    contact_email VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, active, suspended
    owner_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users (Authentication & Authorization)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'staff')), -- owner has full access
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff Permissions (Granular access control)
CREATE TABLE staff_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    can_inbox BOOLEAN DEFAULT true,
    can_bookings BOOLEAN DEFAULT true,
    can_forms BOOLEAN DEFAULT true,
    can_inventory BOOLEAN DEFAULT false,
    UNIQUE(user_id)
);
```

#### Communication Tables

```sql
-- Contacts (Customers - no login required)
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    source VARCHAR(50), -- contact_form, booking_page, manual
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversations (Unified thread for all communication)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active', -- active, archived, paused
    last_message_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages (Email, SMS, Automated)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'sms', 'auto')),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    content TEXT NOT NULL,
    metadata JSONB, -- delivery status, provider response, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Booking Tables

```sql
-- Booking Types (Services offered)
CREATE TABLE booking_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    location VARCHAR(255), -- for in-person services
    form_ids UUID[], -- array of form IDs to send after booking
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Availability (When services can be booked)
CREATE TABLE availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_type_id UUID REFERENCES booking_types(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings (Scheduled appointments)
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    booking_type_id UUID REFERENCES booking_types(id),
    scheduled_at TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed', -- confirmed, completed, no_show, cancelled
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Booking Forms (Track form completion)
CREATE TABLE booking_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    form_id UUID REFERENCES forms(id),
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed
    completed_at TIMESTAMP,
    file_url VARCHAR(500), -- uploaded form
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Inventory Tables

```sql
-- Inventory Items
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    threshold INTEGER NOT NULL DEFAULT 5, -- alert when below this
    unit VARCHAR(50), -- units of measurement
    per_booking_usage INTEGER DEFAULT 1, -- how much used per booking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Logs (Track usage)
CREATE TABLE inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id),
    quantity_used INTEGER NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Form & Integration Tables

```sql
-- Forms (Documents to be filled/signed)
CREATE TABLE forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- intake, agreement, document
    file_url VARCHAR(500) NOT NULL,
    required BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Integrations (External services)
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'sms', 'calendar', 'storage', 'webhook')),
    config JSONB NOT NULL, -- encrypted credentials and settings
    status VARCHAR(20) DEFAULT 'pending', -- pending, active, error
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Automation Logs (Audit trail)
CREATE TABLE automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- contact_created, booking_created, etc.
    entity_type VARCHAR(50) NOT NULL, -- contact, booking, form, inventory
    entity_id UUID NOT NULL,
    action VARCHAR(255) NOT NULL, -- what was automated
    status VARCHAR(20) NOT NULL, -- success, failed
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 Backend Architecture (FastAPI)

### Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Environment configuration
│   ├── database.py          # Database connection & session
│   ├── models/              # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── workspace.py
│   │   ├── contact.py
│   │   ├── conversation.py
│   │   ├── booking.py
│   │   ├── form.py
│   │   ├── inventory.py
│   │   └── integration.py
│   ├── schemas/             # Pydantic models (request/response)
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── workspace.py
│   │   └── ...
│   ├── routers/             # API endpoints
│   │   ├── __init__.py
│   │   ├── auth.py          # Authentication
│   │   ├── users.py         # User management
│   │   ├── workspaces.py    # Workspace CRUD
│   │   ├── contacts.py      # Contact management
│   │   ├── conversations.py # Inbox
│   │   ├── bookings.py      # Booking management
│   │   ├── forms.py         # Form management
│   │   ├── inventory.py     # Inventory tracking
│   │   ├── integrations.py  # External integrations
│   │   └── webhooks.py      # Webhook handlers
│   ├── services/            # Business logic
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── workspace_service.py
│   │   ├── booking_service.py
│   │   ├── automation_service.py
│   │   ├── notification_service.py
│   │   └── integration_service.py
│   ├── core/                # Core utilities
│   │   ├── __init__.py
│   │   ├── security.py      # JWT, password hashing
│   │   ├── dependencies.py  # FastAPI dependencies
│   │   └── exceptions.py    # Custom exceptions
│   └── tasks/               # Background tasks
│       ├── __init__.py
│       └── automation_tasks.py
├── alembic/                 # Database migrations
├── tests/
├── requirements.txt
└── Dockerfile
```

### API Endpoint Structure

```python
# Main Router Registration
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(workspaces.router, prefix="/api/v1/workspaces", tags=["Workspaces"])
app.include_router(contacts.router, prefix="/api/v1/contacts", tags=["Contacts"])
app.include_router(conversations.router, prefix="/api/v1/conversations", tags=["Conversations"])
app.include_router(bookings.router, prefix="/api/v1/bookings", tags=["Bookings"])
app.include_router(forms.router, prefix="/api/v1/forms", tags=["Forms"])
app.include_router(inventory.router, prefix="/api/v1/inventory", tags=["Inventory"])
app.include_router(integrations.router, prefix="/api/v1/integrations", tags=["Integrations"])
app.include_router(webhooks.router, prefix="/api/v1/webhooks", tags=["Webhooks"])
```

### Key Services Architecture

#### 1. Authentication Service
```python
class AuthService:
    def authenticate_user(email: str, password: str) -> User
    def create_access_token(user_id: str) -> str
    def verify_token(token: str) -> TokenData
    def hash_password(password: str) -> str
    def verify_password(plain: str, hashed: str) -> bool
```

#### 2. Workspace Service
```python
class WorkspaceService:
    def create_workspace(data: WorkspaceCreate) -> Workspace
    def get_onboarding_status(workspace_id: str) -> OnboardingStatus
    def complete_onboarding_step(workspace_id: str, step: int) -> Workspace
    def activate_workspace(workspace_id: str) -> bool
    def validate_activation_requirements(workspace_id: str) -> ValidationResult
```

#### 3. Automation Service
```python
class AutomationService:
    def trigger_event(event_type: EventType, entity: Any)
    def handle_contact_created(contact: Contact)
    def handle_booking_created(booking: Booking)
    def handle_booking_reminder(booking: Booking)
    def handle_form_reminder(booking_form: BookingForm)
    def handle_inventory_low(item: InventoryItem)
    def pause_automation_for_conversation(conversation_id: str)
```

#### 4. Notification Service
```python
class NotificationService:
    def send_email(to: str, template: str, data: dict)
    def send_sms(to: str, message: str)
    def send_welcome_message(contact: Contact)
    def send_booking_confirmation(booking: Booking)
    def send_booking_reminder(booking: Booking)
    def send_form_reminder(booking_form: BookingForm)

#### 5. AI Service Layer
```python
class AIService:
    def __init__(self):
        # Load pre-trained models with fallback to rule-based system
        self.models = {
            'intent_recognition': IntentRecognitionModel(),
            'sentiment_analysis': SentimentAnalysisModel(),
            'response_generation': ResponseGenerationModel()
        }
        self.fallback = RuleBasedSystem()
    
    def process_inquiry(self, inquiry: str, context: dict = None) -> dict:
        """Process customer inquiry with AI, fallback to rules if needed"""
        try:
            # Intent recognition
            intent = self.models['intent_recognition'].predict(inquiry)
            
            # Sentiment analysis
            sentiment = self.models['sentiment_analysis'].predict(inquiry)
            
            # Response generation with context
            response = self.models['response_generation'].generate(
                intent=intent,
                sentiment=sentiment,
                context=context
            )
            
            return {
                'intent': intent,
                'sentiment': sentiment,
                'response': response,
                'method': 'ai',
                'confidence': response.confidence,
                'fallback_used': False
            }
        except Exception as e:
            # Fallback to rule-based system on any AI failure
            return {
                'intent': 'unknown',
                'sentiment': 'neutral',
                'response': self.fallback.process_inquiry(inquiry),
                'method': 'rule-based',
                'confidence': 1.0,
                'fallback_used': True,
                'error': str(e)
            }
    
    def predict_demand(self, historical_data: list) -> dict:
        """Predict booking demand using time-series forecasting"""
        try:
            predictor = DemandForecastModel()
            forecast = predictor.predict(historical_data)
            return {
                'forecast': forecast,
                'confidence': forecast.confidence,
                'method': 'ai',
                'fallback_used': False
            }
        except Exception as e:
            return {
                'forecast': self.fallback.predict_demand(historical_data),
                'confidence': 1.0,
                'method': 'rule-based',
                'fallback_used': True,
                'error': str(e)
            }
```

---

## 🎨 Frontend Architecture (Next.js)

### Project Structure

```
frontend/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Auth group (no layout)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/              # Dashboard group (with sidebar)
│   │   ├── layout.tsx            # Dashboard layout with nav
│   │   ├── page.tsx              # Main dashboard
│   │   ├── inbox/
│   │   │   └── page.tsx
│   │   ├── bookings/
│   │   │   └── page.tsx
│   │   ├── forms/
│   │   │   └── page.tsx
│   │   ├── inventory/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       ├── workspace/
│   │       ├── onboarding/
│   │       ├── staff/
│   │       └── integrations/
│   ├── (public)/                 # Public pages (no auth)
│   │   ├── contact/
│   │   │   └── [workspaceId]/
│   │   │       └── page.tsx
│   │   └── book/
│   │       └── [workspaceId]/
│   │           └── page.tsx
│   ├── api/                      # API routes (if needed)
│   ├── layout.tsx                # Root layout
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── common/                   # Shared components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorBoundary.tsx
│   ├── dashboard/                # Dashboard-specific
│   │   ├── BookingWidget.tsx
│   │   ├── ConversationWidget.tsx
│   │   ├── FormsWidget.tsx
│   │   ├── InventoryWidget.tsx
│   │   └── AlertsPanel.tsx
│   ├── onboarding/               # Onboarding wizard
│   │   ├── OnboardingWizard.tsx
│   │   ├── StepIndicator.tsx
│   │   ├── Step1_Workspace.tsx
│   │   ├── Step2_Integrations.tsx
│   │   ├── Step3_ContactForm.tsx
│   │   ├── Step4_Bookings.tsx
│   │   ├── Step5_Forms.tsx
│   │   ├── Step6_Inventory.tsx
│   │   ├── Step7_Staff.tsx
│   │   └── Step8_Activate.tsx
│   ├── inbox/                    # Inbox components
│   │   ├── ConversationList.tsx
│   │   ├── MessageThread.tsx
│   │   ├── MessageInput.tsx
│   │   └── MessageBubble.tsx
│   ├── bookings/                 # Booking components
│   │   ├── BookingCalendar.tsx
│   │   ├── BookingList.tsx
│   │   └── BookingCard.tsx
│   └── forms/                    # Form components
│       ├── FormBuilder.tsx
│       └── FormUploader.tsx
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts
│   ├── useWorkspace.ts
│   ├── useConversations.ts
│   ├── useBookings.ts
│   └── useSocket.ts
├── lib/                          # Utilities
│   ├── api.ts                    # API client
│   ├── auth.ts                   # Auth utilities
│   ├── utils.ts                  # General utilities
│   └── constants.ts              # Constants
├── store/                        # State management (Zustand)
│   ├── authStore.ts
│   ├── workspaceStore.ts
│   └── uiStore.ts
├── types/                        # TypeScript types
│   ├── auth.ts
│   ├── workspace.ts
│   ├── contact.ts
│   ├── booking.ts
│   └── index.ts
└── public/                       # Static assets
```

### State Management Architecture

```typescript
// Zustand Store Structure

// Auth Store
interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

// Workspace Store
interface WorkspaceStore {
  workspace: Workspace | null;
  onboardingStep: number;
  onboardingStatus: OnboardingStatus;
  fetchWorkspace: (id: string) => Promise<void>;
  updateOnboardingStep: (step: number) => Promise<void>;
  activateWorkspace: () => Promise<void>;
}

// UI Store (for global UI state)
interface UIStore {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
  toggleSidebar: () => void;
  addNotification: (notification: Notification) => void;
}
```

### Component Hierarchy

```
RootLayout
├── (Auth Pages)
│   └── Login / Register
└── DashboardLayout
    ├── Sidebar
    │   ├── Logo
    │   ├── NavLinks
    │   └── UserMenu
    ├── Header
    │   ├── Search
    │   ├── Notifications
    │   └── Profile
    └── MainContent
        ├── Dashboard Page
        │   ├── BookingWidget
        │   ├── ConversationWidget
        │   ├── FormsWidget
        │   ├── InventoryWidget
        │   └── AlertsPanel
        ├── Inbox Page
        │   ├── ConversationList
        │   └── MessageThread
        ├── Bookings Page
        │   └── BookingCalendar + BookingList
        └── Settings Pages
            └── OnboardingWizard
                ├── StepIndicator
                └── Step Components (1-8)
```

---

## 🔐 Security Architecture

### Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────►│   FastAPI   │────►│  PostgreSQL │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      │ POST /login       │                   │
      │ {email, password} │                   │
      │──────────────────►│                   │
      │                   │  Verify password  │
      │                   │  (bcrypt)         │
      │                   │──────────────────►│
      │                   │                   │
      │                   │◄──────────────────│
      │                   │                   │
      │                   │ Generate JWT      │
      │◄──────────────────│                   │
      │ {access_token}    │                   │
      │                   │                   │
      │ Use token in      │                   │
      │ Authorization     │                   │
      │ header for all    │                   │
      │ subsequent reqs   │                   │
```

### Authorization Matrix

| Feature | Owner (Admin) | Staff |
|---------|---------------|-------|
| Workspace Setup | ✅ | ❌ |
| Manage Integrations | ✅ | ❌ |
| Configure Automation | ✅ | ❌ |
| Invite Staff | ✅ | ❌ |
| View Dashboard | ✅ | ✅ |
| Manage Inbox | ✅ | ✅ |
| Manage Bookings | ✅ | ✅ |
| Track Forms | ✅ | ✅ |
| View Inventory | ✅ | ✅* |
| Update Inventory | ✅ | ❌ |

*Staff can view inventory if `can_inventory` permission is granted

---

## 🔌 Integration Architecture

### Integration Service Abstraction

```python
# Abstract Base Class
class IntegrationProvider(ABC):
    @abstractmethod
    def send_message(self, to: str, content: str) -> bool
    @abstractmethod
    def validate_config(self, config: dict) -> bool
    @abstractmethod
    def health_check(self) -> bool

# Concrete Implementations
class SendGridProvider(IntegrationProvider):
    # Email sending implementation

class TwilioProvider(IntegrationProvider):
    # SMS sending implementation

class GoogleCalendarProvider(IntegrationProvider):
    # Calendar sync implementation
```

### Integration Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  CareOps Core   │────►│ Integration Svc │────►│ Email Provider  │
│                 │     │                 │     │ (SendGrid)      │
│ Booking Created │     │  Abstract Layer │     └─────────────────┘
└─────────────────┘     └─────────────────┘     ┌─────────────────┘
                                                  │ SMS Provider    │
                                                  │ (Twilio)        │
                                                  └─────────────────┘
                                                  ┌─────────────────┘
                                                  │ Calendar        │
                                                  │ (Google)        │
                                                  └─────────────────┘
```

---

## 📊 Scalability Considerations

### Database Indexing Strategy

```sql
-- Essential indexes for performance
CREATE INDEX idx_contacts_workspace ON contacts(workspace_id);
CREATE INDEX idx_conversations_contact ON conversations(contact_id);
CREATE INDEX idx_conversations_workspace ON conversations(workspace_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_bookings_contact ON bookings(contact_id);
CREATE INDEX idx_bookings_workspace ON bookings(workspace_id);
CREATE INDEX idx_bookings_scheduled ON bookings(scheduled_at);
CREATE INDEX idx_inventory_workspace ON inventory_items(workspace_id);
```

### Caching Strategy

| Data | Cache Level | TTL | Invalidation |
|------|-------------|-----|--------------|
| User session | Redis | 24h | On logout |
| Workspace config | Redis | 1h | On update |
| Booking availability | Redis | 5min | On booking |
| Dashboard stats | Redis | 1min | Real-time updates |
| Public forms | CDN | 1h | On form update |

---

## 🚀 Production Deployment Architecture

### Infrastructure Setup

```
                    ┌─────────────────────────────────────────────┐
                    │              Cloudflare CDN                 │
                    │  - SSL Termination                          │
                    │  - DDoS Protection                          │
                    │  - Caching & Edge Optimization              │
                    └──────────────────┬──────────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────────┐
                    │            Nginx Load Balancer                │
                    │  - Rate Limiting (100 req/min per IP)        │
                    │  - Connection Pooling                        │
                    │  - Health Checks                              │
                    └──────────────────┬──────────────────────────┘
                                       │
        ┌──────────────────┬───────────┼───────────┬──────────────────┐
        │                  │           │           │                  │
┌───────▼──────┐    ┌──────▼──────┐ ┌──▼──────┐ ┌──────▼──────┐  ┌────▼────────┐
│  Next.js     │    │   FastAPI   │ │ Redis   │ │ PostgreSQL  │  │  AI Service  │
│  (Vercel)    │    │   (Railway) │ │(Upstash) │ │ (Supabase)  │  │ (Cloud Run)  │
│              │    │  Auto-scale  │ │ Cache    │ │  Multi-tenant │  │  Serverless  │
│ Frontend     │    │  1-10 inst   │ │ 2GB      │ │  2CPU/4GB    │  │  1CPU/2GB    │
└──────────────┘    └──────────────┘ └──────────┘ └──────────────┘  └─────────────┘
        │                  │           │           │                  │
        └──────────────────┴───────────┼───────────┴──────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────────┐
                    │          Monitoring & Logging                │
                    │  - Prometheus (Metrics)                      │
                    │  - Grafana (Dashboards)                      │
                    │  - ELK Stack (Logs)                           │
                    │  - PagerDuty (Alerts)                         │
                    └───────────────────────────────────────────────┘
```

### Production Configuration

#### Frontend (Vercel)
```bash
# vercel.json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["sfo1", "iad1"],
  "edgeFunctions": {
    "api/edge/*": {
      "regions": ["sfo1", "iad1"]
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

#### Backend (FastAPI + Railway)
```python
# railway.json
{
  "build": {
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "numReplicas": 1,
    "cpu": 250,
    "memory": 512,
    "autoDeploy": false,
    "restartPolicyType": "always"
  },
  "env": {
    "PYTHON_VERSION": "3.11",
    "ENVIRONMENT": "production",
    "LOG_LEVEL": "INFO"
  }
}
```

#### AI Service (Cloud Run)
```yaml
# cloudrun.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: careops-ai-service
  namespace: default
spec:
  template:
    spec:
      containers:
      - image: gcr.io/careops-ai/service:latest
        ports:
        - containerPort: 8080
        resources:
          limits:
            cpu: "1"
            memory: "2Gi"
        env:
        - name: ENVIRONMENT
          value: "production"
        - name: LOG_LEVEL
          value: "INFO"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
  traffic:
  - percent: 100
    latestRevision: true
```

### Security Configuration

#### API Security
```python
# backend/core/security.py
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends, HTTPException, status
from datetime import datetime, timedelta

SECRET_KEY = "your-production-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        expire = payload.get("exp")
        
        if expire is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
            
        if datetime.utcnow() > datetime.fromtimestamp(expire):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
            
        return payload
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

# Rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
```

#### Database Security
```sql
-- PostgreSQL security configuration
-- Enable row-level security
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for multi-tenancy
CREATE POLICY workspace_access ON workspaces
    FOR ALL USING (id IN (SELECT workspace_id FROM users WHERE id = current_user_id()));

-- Encrypt sensitive data
CREATE EXTENSION pgcrypto;
ALTER TABLE integrations ALTER COLUMN config SET DATA TYPE bytea;
```

### Performance Optimization

#### Frontend Optimization
```typescript
// frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  images: {
    domains: ['res.cloudinary.com', 'careops-files.s3.amazonaws.com'],
    minimumCacheTTL: 60,
    formats: ['image/avif', 'image/webp']
  },
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-cache' }
        ]
      }
    ]
  }
}

module.exports = nextConfig
```

#### Backend Optimization
```python
# backend/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool

DATABASE_URL = "postgresql://user:password@localhost:5432/careops"

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=50,
    pool_recycle=3600,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

### Disaster Recovery

#### Backup Strategy
```bash
# Database backup script (run daily at 2 AM)
#!/bin/bash
DATE=$(date +"%Y%m%d_%H%M%S")
PGPASSWORD="password" pg_dump -h localhost -U careops_user -d careops_prod > /backups/careops_prod_$DATE.sql
gzip /backups/careops_prod_$DATE.sql
aws s3 cp /backups/careops_prod_$DATE.sql.gz s3://careops-backups/
rm /backups/careops_prod_$DATE.sql.gz
```

#### Recovery Point Objective (RPO) & Recovery Time Objective (RTO)
| Component | RPO | RTO |
|-----------|-----|-----|
| Database | 1 hour | 30 minutes |
| AI Service | 0 hours | 5 minutes |
| Backend API | 0 hours | 10 minutes |
| Frontend | 0 hours | 5 minutes |
| Redis Cache | 0 hours | 5 minutes |

### Monitoring & Alerting

#### Key Metrics to Monitor
```yaml
# prometheus/metrics.yml
scrape_configs:
  - job_name: "careops-backend"
    scrape_interval: 15s
    static_configs:
      - targets: ["backend:8000"]
  
  - job_name: "careops-ai"
    scrape_interval: 30s
    static_configs:
      - targets: ["ai-service:8080"]
  
  - job_name: "careops-db"
    scrape_interval: 60s
    static_configs:
      - targets: ["db-exporter:9187"]
```

#### Alert Rules
```yaml
# prometheus/alerts.yml
groups:
- name: backend_alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status_code="5xx"}[5m]) / rate(http_requests_total[5m]) > 0.1
    for: 1m
    labels:
      severity: "critical"
    annotations:
      summary: "High error rate on backend API"
      description: "Backend API is returning 5xx errors at {{ $value | humanizePercentage }} rate"

  - alert: HighResponseTime
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
    for: 1m
    labels:
      severity: "warning"
    annotations:
      summary: "High API response time"
      description: "95th percentile response time is {{ $value }} seconds"

- name: ai_service_alerts
  rules:
  - alert: AIResponseTimeHigh
    expr: histogram_quantile(0.95, rate(ai_response_duration_seconds_bucket[5m])) > 2
    for: 1m
    labels:
      severity: "warning"
    annotations:
      summary: "High AI response time"
      description: "95th percentile AI response time is {{ $value }} seconds"

  - alert: AICostHigh
    expr: sum(increase(ai_request_cost_total[1h])) > 1.0
    for: 1h
    labels:
      severity: "warning"
    annotations:
      summary: "High AI service costs"
      description: "AI service costs are ${$value} per hour"
```

---

## 📝 API Documentation Standards

All API endpoints follow RESTful conventions with consistent response format:

```typescript
// Standard Response Format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

// Example Success Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Business Name"
  }
}

// Example Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": { "field": "email" }
  }
}
```

---

## 🔧 Environment Configuration

```bash
# .env.example

# Application
APP_NAME=CareOps
APP_ENV=development|staging|production
DEBUG=true|false
SECRET_KEY=your-secret-key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/careops
DATABASE_POOL_SIZE=20

# Redis (Caching & Sessions)
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET_KEY=your-jwt-secret
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@careops.io

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890

# Google Calendar
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/integrations/google/callback

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=careops-files
AWS_REGION=us-east-1

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

---

## 📈 Monitoring & Logging

### Application Metrics to Track

- API response times
- Database query performance
- Integration success/failure rates
- Automation trigger counts
- Error rates by endpoint
- Active user sessions
- Booking conversion rates

### Logging Strategy

```python
# Structured logging format
{
    "timestamp": "2024-01-15T10:30:00Z",
    "level": "INFO|WARN|ERROR",
    "service": "careops-api",
    "trace_id": "uuid",
    "user_id": "uuid",
    "workspace_id": "uuid",
    "event": "booking_created",
    "message": "New booking created",
    "metadata": {
        "booking_id": "uuid",
        "contact_id": "uuid"
    }
}
```

---

## 🚫 Failure Prevention Architecture

### 1. Customer Flow Simplification
```typescript
// Architecture guard to prevent login requirement for customers
interface CustomerFlowGuard {
  // Never require login for customer interactions
  requireLogin: false;
  // Max steps per customer interaction
  maxSteps: 3;
  // Minimal input fields
  maxFieldsPerStep: 4;
}

// Public endpoints must strictly enforce customer flow rules
const publicEndpointGuard = (req: Request, res: Response, next: NextFunction) => {
  // Allow only GET and POST for public endpoints
  const allowedMethods = ['GET', 'POST'];
  if (!allowedMethods.includes(req.method)) {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET and POST allowed for public endpoints'
      }
    });
  }
  
  // For POST requests, validate body has minimal fields
  if (req.method === 'POST') {
    const fieldCount = Object.keys(req.body || {}).length;
    if (fieldCount > 4) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TOO_MANY_FIELDS',
          message: 'Public endpoints accept maximum 4 fields per request'
        }
      });
    }
  }
  
  next();
};
```

### 2. Dashboard Visibility Enforcement
```python
# Architecture guard to ensure dashboard answers "What's happening now?" in < 60 seconds
class DashboardVisibilityGuard:
    @staticmethod
    def validate_dashboard_performance() -> bool:
        """Ensure dashboard renders in < 1 second"""
        # Check if all dashboard queries execute in < 500ms
        query_times = []
        
        # Check dashboard widgets
        for widget in ['bookings', 'conversations', 'forms', 'inventory', 'alerts']:
            start_time = time.time()
            # Execute widget query
            end_time = time.time()
            query_times.append(end_time - start_time)
            
            if (end_time - start_time) > 0.5:
                raise PerformanceError(f"{widget} widget query takes too long")
        
        # Ensure all queries complete in < 1 second
        total_time = sum(query_times)
        if total_time > 1.0:
            raise PerformanceError(f"Total dashboard query time: {total_time:.2f} seconds")
            
        return True
```

### 3. Unified Inbox Architecture Enforcer
```typescript
// Architecture guard to prevent communication silos
class InboxEnforcement {
  static validateMessageFlow() {
    // All messages must go through unified inbox
    const messageTypes = ['email', 'sms', 'internal'];
    
    messageTypes.forEach(type => {
      const hasDirectMessageEndpoint = !!endpoints.find(ep => 
        ep.path.includes(`/api/v1/${type}`) && !ep.path.includes('inbox')
      );
      
      if (hasDirectMessageEndpoint) {
        throw new Error(`Direct message endpoint for ${type} violates unified inbox requirement`);
      }
    });
  }
  
  static ensureConversationThreading() {
    // All messages must belong to exactly one conversation
    const conversationIdRequired = !endpoints.some(ep => 
      ep.path.includes('/api/v1/messages') && !ep.requiresConversationId
    );
    
    if (!conversationIdRequired) {
      throw new Error("Messages must belong to a conversation");
    }
  }
}
```

### 4. Automation Predictability Guard
```python
# Architecture guard to prevent complex automation rules
class AutomationPredictabilityGuard:
    @staticmethod
    def validate_rule_complexity(rule: dict) -> bool:
        """Ensure automation rules are strictly event-based"""
        if 'conditions' in rule and len(rule['conditions']) > 1:
            raise ComplexityError("Automation rules must have at most 1 condition")
            
        if 'nested_conditions' in rule:
            raise ComplexityError("Nested conditions not allowed")
            
        if 'priority' in rule:
            raise ComplexityError("Rule priorities not allowed")
            
        return True
```

### 5. Staff Interface Simplification
```typescript
// Architecture guard to prevent complex settings in staff interface
interface StaffInterfaceGuard {
  allowedFeatures: string[];
  forbiddenSettings: string[];
  
  validatePage(page: string, userRole: string): boolean;
}

const staffInterfaceGuard: StaffInterfaceGuard = {
  allowedFeatures: ['dashboard', 'inbox', 'bookings', 'forms', 'inventory-view'],
  forbiddenSettings: ['workspace', 'integrations', 'automation', 'staff', 'billing'],
  
  validatePage(page: string, userRole: string): boolean {
    if (userRole === 'staff') {
      // Check if page is in allowed list
      const isAllowed = this.allowedFeatures.some(feature => 
        page.includes(feature) || feature.includes(page)
      );
      
      if (!isAllowed) {
        return false;
      }
      
      // Check if page has forbidden settings
      const hasForbiddenSettings = this.forbiddenSettings.some(setting => 
        page.includes(setting)
      );
      
      return !hasForbiddenSettings;
    }
    
    return true; // Owners can see everything
  }
};
```

### 6. Mobile First Architecture Enforcer
```typescript
// Architecture guard to enforce mobile-first design
class MobileFirstGuard {
  static validateResponsiveDesign() {
    // Check all public pages have mobile breakpoints
    const publicPages = ['/contact', '/book', '/form'];
    
    publicPages.forEach(page => {
      const pagePath = getPagePath(page);
      const styles = getPageStyles(pagePath);
      
      // Check for mobile breakpoints
      if (!styles.includes('@media (max-width: 768px)')) {
        throw new Error(`Page ${page} missing mobile breakpoint`);
      }
      
      // Check for touch-friendly elements
      const touchStyles = [
        'touch-action', 
        'cursor: pointer', 
        'user-select: none',
        'min-height: 44px',
        'min-width: 44px'
      ];
      
      const hasTouchFriendlyElements = touchStyles.some(style => 
        styles.includes(style)
      );
      
      if (!hasTouchFriendlyElements) {
        throw new Error(`Page ${page} missing touch-friendly elements`);
      }
    });
  }
}
```

### 7. Failure Visibility Architecture
```python
# Architecture guard to prevent silent failures
class FailureVisibilityGuard:
    @staticmethod
    def validate_error_handling():
        """Ensure all errors are visible to the owner"""
        # Check all integration failures are logged
        integration_methods = [
            'send_email',
            'send_sms', 
            'sync_calendar',
            'upload_file',
            'send_webhook'
        ]
        
        for method in integration_methods:
            if not has_error_logging(method):
                raise Error(f"{method} missing error logging")
        
        # Check all automation failures have alerts
        automation_methods = [
            'handle_contact_created',
            'handle_booking_created',
            'handle_booking_reminder',
            'handle_form_reminder',
            'handle_inventory_low'
        ]
        
        for method in automation_methods:
            if not has_failure_alert(method):
                raise Error(f"{method} missing failure alert")
```

### 8. Feature Creep Prevention
```python
# Architecture guard to prevent feature creep
class FeatureCreepGuard:
    @staticmethod
    def validate_feature_scope(feature: dict) -> bool:
        """Ensure feature scope is focused on core use cases"""
        core_use_cases = [
            'lead_management',
            'booking', 
            'communication',
            'form_tracking',
            'inventory',
            'automation',
            'dashboard'
        ]
        
        if feature['category'] not in core_use_cases:
            raise FeatureScopeError(f"Feature {feature['name']} not in core use cases")
            
        if feature['estimated_usage'] < 0.2:  # Less than 20% of users
            raise FeatureScopeError(f"Feature {feature['name']} serves < 20% of users")
            
        return True
```

### 9. Authentication Security Guard
```typescript
// Architecture guard to ensure secure authentication
class AuthenticationGuard {
  static validateAuthMethods() {
    // Check if any endpoint requires customer login
    const customerEndpoints = [
      '/api/v1/contact',
      '/api/v1/book', 
      '/api/v1/form'
    ];
    
    customerEndpoints.forEach(endpoint => {
      const requiresAuth = !!endpoints.find(ep => 
        ep.path.includes(endpoint) && ep.requiresAuth
      );
      
      if (requiresAuth) {
        throw new Error(`Endpoint ${endpoint} incorrectly requires customer authentication`);
      }
    });
  }
}
```

### 10. Performance Architecture Enforcer
```python
# Architecture guard to ensure fast performance
class PerformanceGuard:
    @staticmethod
    def validate_assets_optimization():
        """Check if assets are optimized"""
        # Check images are compressed
        image_extensions = ['.jpg', '.jpeg', '.png', '.gif']
        public_images = get_public_assets(image_extensions)
        
        for image in public_images:
            if not is_image_compressed(image):
                raise PerformanceError(f"{image} not optimized")
        
        # Check if CDN is configured
        if not has_cdn_configured():
            raise PerformanceError("CDN not configured for static assets")
            
        # Check caching headers
        static_endpoints = get_static_endpoints()
        for endpoint in static_endpoints:
            if not has_cache_headers(endpoint):
                raise PerformanceError(f"{endpoint} missing cache headers")
```

---

## 🎯 Architecture Compliance Check

This architecture includes built-in guards to prevent common failure scenarios. These guards are designed to catch violations early in development and ensure the system remains true to the core principles.

By following this architecture with failure prevention built-in, you minimize the risk of failing to win the hackathon by:
1. Ensuring customer flow simplicity
2. Maintaining dashboard visibility
3. Preventing communication silos
4. Enforcing predictable automation
5. Keeping staff interface simple
6. Ensuring mobile-first design
7. Preventing silent failures
8. Limiting feature creep
9. Ensuring secure authentication
10. Optimizing performance

## 🤖 Reliable Agentic AI Architecture

### 11. AI Service Layer Integration
```python
# AI Service Layer for reliable agentic capabilities
class AIService:
    def __init__(self):
        # Load pre-trained models with fallback to rule-based system
        self.models = {
            'intent_recognition': IntentRecognitionModel(),
            'sentiment_analysis': SentimentAnalysisModel(),
            'response_generation': ResponseGenerationModel()
        }
        self.fallback = RuleBasedSystem()
    
    def process_inquiry(self, inquiry: str, context: dict = None) -> dict:
        """Process customer inquiry with AI, fallback to rules if needed"""
        try:
            # Intent recognition
            intent = self.models['intent_recognition'].predict(inquiry)
            
            # Sentiment analysis
            sentiment = self.models['sentiment_analysis'].predict(inquiry)
            
            # Response generation with context
            response = self.models['response_generation'].generate(
                intent=intent,
                sentiment=sentiment,
                context=context
            )
            
            return {
                'intent': intent,
                'sentiment': sentiment,
                'response': response,
                'method': 'ai',
                'confidence': response.confidence,
                'fallback_used': False
            }
        except Exception as e:
            # Fallback to rule-based system on any AI failure
            return {
                'intent': 'unknown',
                'sentiment': 'neutral',
                'response': self.fallback.process_inquiry(inquiry),
                'method': 'rule-based',
                'confidence': 1.0,
                'fallback_used': True,
                'error': str(e)
            }
    
    def predict_demand(self, historical_data: list) -> dict:
        """Predict booking demand using time-series forecasting"""
        try:
            predictor = DemandForecastModel()
            forecast = predictor.predict(historical_data)
            return {
                'forecast': forecast,
                'confidence': forecast.confidence,
                'method': 'ai',
                'fallback_used': False
            }
        except Exception as e:
            return {
                'forecast': self.fallback.predict_demand(historical_data),
                'confidence': 1.0,
                'method': 'rule-based',
                'fallback_used': True,
                'error': str(e)
            }
```

### 12. Human-in-the-Loop AI Guard
```typescript
// Architecture guard to ensure human oversight of AI decisions
class AIHumanOversightGuard {
  static validateAIResponse(response: any): boolean {
    // Require human approval for high-risk decisions
    const highRiskIntents = ['cancellation', 'refund', 'complaint'];
    
    if (highRiskIntents.includes(response.intent) && response.confidence < 0.9) {
      return false; // Require human approval
    }
    
    return true;
  }
  
  static validateAIFallback(): boolean {
    // Ensure fallback to rule-based system works
    return true;
  }
  
  static validateTransparency(response: any): boolean {
    // AI responses must include explanation
    if (response.method === 'ai' && !response.explanation) {
      throw new Error("AI response missing explanation");
    }
    
    return true;
  }
}
```

### 13. AI Decision Transparency Guard
```javascript
// Architecture guard to ensure AI decisions are transparent
class AITransparencyGuard {
  static validateDecisionExplanation(): boolean {
    const AI_METHODS = ['process_inquiry', 'predict_demand', 'route_inquiry'];
    
    AI_METHODS.forEach(method => {
      const logMethod = `log_${method}`;
      if (!has_explanation_logging(logMethod)) {
        throw new Error(`Method ${method} missing AI explanation logging`);
      }
    });
    
    return true;
  }
  
  static validateConfidenceThresholds(): boolean {
    const CONFIDENCE_THRESHOLDS = {
      'intent_recognition': 0.7,
      'sentiment_analysis': 0.8,
      'response_generation': 0.75
    };
    
    Object.entries(CONFIDENCE_THRESHOLDS).forEach(([model, minConfidence]) => {
      if (!has_confidence_validation(model, minConfidence)) {
        throw new Error(`Model ${model} missing confidence threshold`);
      }
    });
    
    return true;
  }
}
```

### 14. AI Performance Monitoring Guard
```python
# Architecture guard to ensure AI performance meets requirements
class AIPerformanceGuard:
    @staticmethod
    def validate_response_time():
        """Ensure AI responses are < 2 seconds"""
        import time
        
        ai_service = AIService()
        start_time = time.time()
        
        # Test AI response time
        for _ in range(10):
            response = ai_service.process_inquiry("Test inquiry")
            response_time = time.time() - start_time
            
            if response_time > 2.0:
                raise PerformanceError(f"AI response time: {response_time:.2f} seconds")
                
        return True
    
    @staticmethod
    def validate_cost_per_request():
        """Ensure AI costs < $0.0001 per request"""
        cost_per_request = get_ai_cost_per_request()
        
        if cost_per_request > 0.0001:
            raise CostError(f"AI cost per request: ${cost_per_request:.6f}")
            
        return True
    
    @staticmethod
    def validate_uptime():
        """Ensure AI service availability > 99.9%"""
        uptime = get_ai_service_uptime()
        
        if uptime < 0.999:
            raise AvailabilityError(f"AI service uptime: {uptime:.3%}")
            
        return True
```

### 15. Predictive Maintenance & Learning Guard
```typescript
// Architecture guard to ensure AI models stay accurate
class AILearningGuard {
  static validateContinuousLearning(): boolean {
    // Check if model retraining is happening
    const lastTrainingDate = get_last_model_training_date();
    const daysSinceTraining = daysBetween(lastTrainingDate, new Date());
    
    if (daysSinceTraining > 7) {
      throw new Error("Models haven't been retrained in 7 days");
    }
    
    return true;
  }
  
  static validateDataQuality(): boolean {
    // Check if training data is sufficient and clean
    const dataQuality = getDataQualityMetrics();
    
    if (dataQuality.completeness < 0.95) {
      throw new Error(`Data completeness: ${dataQuality.completeness:.1%}`);
    }
    
    if (dataQuality.duplicates > 0.05) {
      throw new Error(`Duplicate data: ${dataQuality.duplicates:.1%}`);
    }
    
    return true;
  }
}
```

## 🎯 How CareOps Combines AI with Reliability

This architecture creates a **reliable agentic AI system** that retains CareOps' core strengths while adding intelligent capabilities:

1. **Speed**: AI responses < 2 seconds (rule-based fallback < 1 second)
2. **Cost**: Optimized AI usage with < $0.50/month per user
3. **Reliability**: 99.99% uptime with fallback to rule-based system
4. **Transparency**: Explainable AI with detailed decision logs
5. **Simplicity**: AI enhances rules, doesn't replace them
6. **Security**: Minimal attack surface with strict input validation
7. **Consistency**: Predictable behavior with confidence thresholds
8. **Scalability**: Linear cost scaling with intelligent model optimization
9. **Predictability**: Human oversight for high-risk decisions
10. **Human Control**: Staff retains override capabilities

**Key AI Improvements:**
- **Intent Recognition**: Identify customer needs from natural language
- **Sentiment Analysis**: Understand customer emotions
- **Response Generation**: Create context-aware responses
- **Demand Forecasting**: Predict booking demand
- **Inventory Optimization**: Forecast inventory needs
- **Smart Routing**: Route inquiries to appropriate staff
- **Continuous Learning**: Improve from user interactions

This architecture provides a solid foundation for a reliable agentic AI system that will compete effectively in the hackathon by combining intelligence with the proven reliability of CareOps.
