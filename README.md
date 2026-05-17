# SACCO Manager - System Documentation

## 1. Project Overview

SACCO Manager is a comprehensive web-based application for managing Savings and Credit Cooperative (SACCO) operations. It provides a complete suite of tools for managing members, loans, savings accounts, fines, complaints, and notifications. The application is built with modern web technologies and supports offline functionality through Progressive Web App (PWA) capabilities.

**Key Characteristics:**
- **Type**: Full-stack web application (Next.js)
- **Target Users**: SACCO administrators, tellers, and managers
- **Deployment**: Can be deployed to Vercel or similar platforms
- **Architecture**: Multi-tenant capable (single SACCO by default)

## 2. Technology Stack

### Core Framework
- **Next.js 16.1.7** - React framework with App Router
- **React 19.2.4** - UI library
- **TypeScript 5.9.3** - Type safety

### Database
- **PostgreSQL** - Primary database
- **Drizzle ORM 0.45.2** - Database ORM with type-safe queries
- **Drizzle Kit 0.18.1** - Database migration and seeding
- **@neondatabase/serverless** - Serverless PostgreSQL driver (Neon)

### Authentication
- **Clerk 7.0.7** - Authentication and user management
- Custom mobile OTP support (SMS-based)

### UI & Styling
- **Tailwind CSS 4.2.1** - Utility-first CSS
- **shadcn/ui 4.1.1** - Component library
- **Lucide React 1.7.0** - Icon library
- **Recharts 3.8.0** - Data visualization
- **@react-pdf/renderer 4.3.2** - PDF generation

### PWA Support
- **next-pwa 2.0.2** - Service worker generation
- Offline page support
- Network status monitoring

### Integrations
- **EGO SMS API** - SMS notifications
- **MTN Mobile Money** - Payment processing
- **Airtel Money** - Payment processing
- **Vercel Blob** - File storage for documents
- **comms-sdk** - Communication services

### Additional Libraries
- **Zod 4.3.6** - Schema validation
- **React Hook Form 7.72.0** - Form handling
- **TanStack Query 5.95.2** - Server state management
- **TanStack Table 8.21.3** - Data tables
- **date-fns 4.1.0** - Date utilities
- **xlsx 0.18.5** - Excel file handling

## 3. Database Schema Overview

### Core Tables

**saccos** - SACCO/organization configuration
- Primary organization settings, branding, contact info

**members** - Member records
- Member codes, personal details, status tracking
- Links to: saccos (many-to-one)

**loanCategories** - Loan product types
- Configurable loan products with interest rates and limits

**interestRates** - Dynamic interest rate configuration
- Rate tiers based on loan amount ranges

**loans** - Loan applications and accounts
- Status tracking (pending → verified → approved → disbursed → settled)
- Interest calculations, payment schedules

**loanExtensions** - Loan term extensions
- Due date modifications

**loanGuarantors** - Loan guarantor associations

**savingsCategories** - Savings account types
- Regular and fixed deposit categories

**savingsAccounts** - Member savings accounts
- Balance tracking, account locking

**transactions** - Financial transactions
- All monetary movements (deposits, withdrawals, loan disbursements)

**fineCategories** - Fine type definitions
**fines** - Member fines and penalties

**documents** - File attachments
- National IDs, registration forms, loan contracts

**notifications** - SMS and in-app notifications
- Delivery tracking, retry logic

**complaints** - Member feedback/tickets
- Status workflow (open → in_progress → resolved)

**auditLogs** - Activity tracking
- User actions for compliance

### Data Types
- All monetary values stored in **cents** (integer)
- UUIDs for primary keys
- Enums for status fields
- JSON fields for flexible configuration

## 4. Key Features

### Member Management
- Add/edit/archive members
- Member profile with photo
- Member code generation
- Import from Excel
- Search and filtering
- PDF membership certificates and ID cards

### Loan Management
- Loan application workflow
- Category-based loan products
- Dynamic interest rates (amount-based)
- Loan calculator with amortization
- Payment tracking and schedules
- Loan extensions and restructuring
- Guarantor management
- Contract PDF generation

### Savings Management
- Multiple savings accounts per member
- Regular and fixed deposit accounts
- Account locking (time-based)
- Interest tracking
- Deposit/withdrawal transactions
- Loan offset (trim loan with savings)

### Fines Management
- Fine categories and default amounts
- Issue fines to members
- Payment processing
- Waiver functionality

### Notifications
- SMS notifications via EGO SMS API
- In-app notifications
- Bulk messaging to all/active members
- Scheduled notifications
- Retry logic for failed deliveries

### Complaints Handling
- Member complaint submission
- Category and priority assignment
- Status workflow tracking
- Resolution notes
- Satisfaction rating system
- SMS notifications on status changes

### Documents
- File upload to Vercel Blob
- Document categorization
- Member document association
- Preview functionality

### Reports & Analytics
- Dashboard with KPIs
- Loan status distribution
- Savings vs loans comparison
- Transaction history
- PDF report generation

### Settings
- General SACCO configuration
- Loan category management
- Savings category management
- Fine category management
- Interest rate configuration
- Payment gateway settings (MTN/Airtel)

## 5. API Endpoints Structure

### Route Organization
The application uses Next.js App Router with route groups:

```
app/
├── (auth)/              # Authentication pages
│   ├── sign-in/         # Clerk sign-in
│   └── sign-up/        # Clerk sign-up
├── (dashboard)/         # Authenticated dashboard
│   ├── dashboard/      # Overview & KPIs
│   ├── members/        # Member management
│   ├── loans/          # Loan operations
│   ├── savings/        # Savings accounts
│   ├── fines/          # Fine management
│   ├── complaints/     # Complaint handling
│   ├── notifications/  # SMS & alerts
│   ├── documents/      # File management
│   ├── reports/       # Analytics
│   └── settings/      # Configuration
├── api/                # API routes
│   └── notifications/
│       └── latest/    # Latest notifications
└── offline/           # Offline fallback page
```

### Server Actions
All data mutations use Next.js Server Actions:
- Direct database operations via Drizzle ORM
- Form submissions with Zod validation
- Revalidation for cache updates

### Key Data Flows
1. **Member Creation** → Member record + savings account auto-created
2. **Loan Application** → Loan record with interest calculation
3. **Payment Processing** → Transaction + balance updates
4. **Notification** → Database record + SMS API call

## 6. Authentication

### Clerk Integration
- Email/password authentication
- OAuth providers (Google, etc.)
- Session management
- Role-based access ready

### Mobile OTP Flow (Custom)
- SMS-based OTP verification
- Phone number registration
- One-time password validation
- Falls back to Clerk on failure

### Security Features
- Password requirements (configurable)
- Session timeout
- Protected routes via Clerk middleware
- Audit logging for sensitive operations

## 7. SMS & Payment Integrations

### EGO SMS API
- **Endpoint**: `https://comms.egosms.co/api/v1/json/`
- **Authentication**: Username + API key
- **Features**:
  - Single SMS sending
  - Bulk messaging
  - Delivery tracking
  - Sender ID configuration

### MTN Mobile Money
- **Base URL**: Configurable (sandbox/production)
- **OAuth2** authentication
- **Features**:
  - Collection (payment request)
  - Disbursement
  - Transaction status checks
- **Phone formatting**: Strip prefix, add 256 country code

### Airtel Money
- **Endpoint**: `${baseUrl}/merchant/v2/payments/`
- **OAuth2** client credentials
- **Features**:
  - Merchant payments
  - Subscriber validation

### Environment Variables Required
```env
# Database
DATABASE_URL=

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# SMS (EGO)
COMMS_SDK_USERNAME=
COMMS_SDK_API_KEY=
EGOSMS_SENDER_ID=

# MTN Momo
MTN_MOMO_BASE_URL=
MTN_MOMO_SUBSCRIPTION_KEY=
MTN_MOMO_API_USER=
MTN_MOMO_API_KEY=
MTN_MOMO_ENVIRONMENT=

# Airtel
AIRTEL_BASE_URL=
AIRTEL_CLIENT_ID=
AIRTEL_CLIENT_SECRET=

# Vercel Blob
BLOB_READ_WRITE_TOKEN=

# App Config
NEXT_PUBLIC_SACCO_ID=
NEXT_PUBLIC_SACCO_NAME=
```

## 8. PWA Support

### Service Worker
- Generated via `next-pwa` plugin
- Caches static assets
- Offline page handling
- Network-first strategy for API

### Offline Features
- `/offline` page for lost connectivity
- Network status indicator in UI
- Graceful degradation for non-critical features

### Manifest Configuration
- App name: "SACCO Manager"
- Theme color: #0f172a
- Standalone display mode
- Splash screen configuration

## 9. Security Notes

### Identified Issues & Recommendations

1. **Hardcoded SACCO ID**
   - Location: `lib/constants.ts` - `SACCO_ID` constant
   - Issue: Default UUID is hardcoded; multi-tenant isolation relies on this single value
   - Recommendation: Implement proper tenant context from Clerk user metadata

2. **Environment Variable Validation**
   - Location: `drizzle.config.ts`
   - Issue: Uses non-null assertion (`!`) without runtime validation
   - Recommendation: Add startup validation for required env vars

3. **Database Adapter Returns False**
   - Location: `lib/db/database-adapter.ts` - `isUsingLocalDatabase()`
   - Issue: Hardcoded to return `false` - no actual local DB detection
   - Recommendation: Implement actual detection or remove unused code

4. **No CSRF Protection on Server Actions**
   - Location: All `actions.ts` files
   - Issue: Server Actions don't have explicit CSRF tokens; Next.js provides some built-in
   - Recommendation: Verify Next.js built-in protection is sufficient; add explicit if needed

5. **Missing Input Sanitization**
   - Location: Form handlers
   - Issue: Some user inputs may not be sanitized before storage
   - Recommendation: Add Zod validation at all entry points, implement output encoding

6. **SMS API Error Handling**
   - Location: `lib/sms.ts`
   - Issue: Silently returns success when credentials not configured
   - Recommendation: Fail explicitly in development; add monitoring in production

7. **Payment Integration Security**
   - Location: `lib/payments/mtn.ts`, `lib/payments/airtel.ts`
   - Issue: Credentials in environment variables; no request signing verification
   - Recommendation: Add request/response logging, implement idempotency keys

8. **Document Upload Size Limits**
   - Location: Various upload components
   - Issue: No explicit client-side validation before upload
   - Recommendation: Add size validation before upload, show clear error messages

9. **Missing Rate Limiting**
   - Location: API routes and Server Actions
   - Issue: No rate limiting on sensitive operations (login, payments)
   - Recommendation: Implement rate limiting middleware

10. **Audit Log Gaps**
    - Location: `auditLogs` table
    - Issue: Not all operations are logged consistently
    - Recommendation: Add audit logging to all CRUD operations

### General Recommendations

- Implement comprehensive test coverage
- Add security headers (CSP, HSTS, etc.)
- Enable database connection pooling limits
- Add request/response logging for debugging
- Implement proper error boundaries
- Add health check endpoint

## 10. Setup Instructions

### Prerequisites
- Node.js 20+
- PostgreSQL database (Neon recommended)
- Clerk account
- EGO SMS account (optional for development)
- MTN/Airtel merchant accounts (production)

### Installation

1. **Clone and install dependencies**
   ```bash
   cd sacco-manager
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

3. **Database setup**
   ```bash
   # Push schema to database
   npm run db:push
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm run start
   ```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run db:push` - Push schema to database
- `npm run db:generate` - Generate migrations
- `npm run db:studio` - Open Drizzle Studio
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Project Structure

```
sacco-manager/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group
│   ├── (dashboard)/       # Protected dashboard
│   ├── api/               # API routes
│   └── offline/           # Offline page
├── components/            # React components
│   ├── ui/                # shadcn components
│   └── layout/            # Layout components
├── db/                    # Database
│   ├── schema.ts          # Drizzle schema
│   └── index.ts           # DB client
├── lib/                   # Utilities
│   ├── db/                # Database adapter
│   ├── payments/          # Payment integrations
│   ├── pdf/               # PDF generators
│   └── sms.ts             # SMS service
└── public/                # Static assets
```

---

*Document generated for SACCO Manager v0.0.1*
*Last updated: April 2026*