# MEDBANK3 - COMPLETE WEBSITE ARCHITECTURE MAP & DOCUMENTATION

**Application Name:** IskyMD Medical QBank Platform  
**Version:** 3.0  
**Last Updated:** February 3, 2026  
**Type:** Full-Stack Medical Education & Testing Platform  
**Framework:** Next.js 16.1.1 with App Router  
**Database:** SQLite (better-sqlite3) with WAL mode  
**Authentication:** Role-based (Student/Author/Admin)  
**State Management:** React Context + localStorage  
**Styling:** Tailwind CSS v4  
**UI Components:** Lucide React icons, Framer Motion animations

---

## TABLE OF CONTENTS
1. [Application Overview](#application-overview)
2. [Public Pages (Non-Authenticated)](#public-pages-non-authenticated)
3. [Authentication Pages](#authentication-pages)
4. [Student Portal & Dashboard Pages](#student-portal--dashboard-pages)
5. [Author Portal & Management Pages](#author-portal--management-pages)
6. [API Endpoints & Backend Routes](#api-endpoints--backend-routes)
7. [Component Architecture](#component-architecture)
8. [Database & Data Models](#database--data-models)
9. [User Flows & Navigation](#user-flows--navigation)

---

## APPLICATION OVERVIEW

### What is IskyMD?
IskyMD is a professional-grade medical education platform that provides:
- **High-yield question banks** for medical students and professionals
- **Clinical assessment tools** for exam preparation
- **Performance analytics** with cognitive behavioral analysis
- **Multi-product ecosystem** where different medical exams/subjects have separate question banks
- **Dual-role system** supporting both students (learners) and authors (content creators)
- **Real-time exam engine** with tutor and exam modes
- **Forensic behavioral tracking** to identify learning patterns
- **Subscription-based access** with trial periods and payment integration
- **Responsive web interface** optimized for desktop and mobile learning

### Core Features
- **Question Bank Management** - Create, edit, and manage medical questions by authors with rich text editing and image support
- **Advanced Test Engine** - Full-featured exam simulator with timer, question navigation, answer tracking, and review modes
- **Performance Analytics** - Real-time analytics showing accuracy, usage patterns, cognitive markers (overthinking, impulsivity, fatigue)
- **Subscription Management** - Product-based access control with trial periods, payment integration, and automatic expiration
- **Role-Based Access** - Separation between student and author portals with appropriate permissions
- **Content Lifecycle** - Question lifecycle management (Draft → Published → Deprecated) with version control
- **Behavioral Forensics** - Track student behavior patterns including second-guessing, impulsivity, and fatigue indicators
- **Multi-Product Support** - Isolate question banks by product/package for different medical specialties
- **Standardized API Layer** - RESTful APIs returning structured JSON responses with consistent error handling
- **Real-Time Progress Sync** - Seamless synchronization between client IndexedDB and server SQLite

---

# PUBLIC PAGES (NON-AUTHENTICATED)

---

## PAGE: / (Home/Landing Page)
**Route:** `/`  
**File:** `src/app/page.jsx`  
**Authentication Required:** No  
**Roles:** All (Public)

### Purpose
The main landing page that introduces IskyMD to new and anonymous visitors. It's the entry point for the entire application and serves as the brand showcase.

### What It Does
- **Hero Section** - Large banner displaying "Isky" branding with call-to-action buttons
- **Navigation Bar** - Top fixed navigation with:
  - Logo and brand name with animated orbital design
  - "Explore Products" button linking to `/products`
  - Shopping cart icon with item count
  - User account dropdown for logged-in users
- **Main Content** - Professional tagline: "The professional-grade suite for medical clinical mastery. High-yield content, rigorous accuracy, and elite performance."
- **Call-to-Action Buttons:**
  - "Explore Products" - Routes to `/products` page
  - "Sign In" / User account menu - Routes to `/auth` or user dashboard
- **Footer** - Copyright, company info, and social links

### Why It Exists
- Serves as the public-facing welcome interface
- Provides easy navigation to explore products or authenticate
- Establishes brand identity and professionalism
- Converts anonymous visitors into product explorers or registered users

### How Navigation Works
- From Home, users can:
  - Click "Explore Products" → Go to `/products`
  - Click cart icon → Open cart dropdown
  - Click profile icon → Login or access account
  - Direct URL access to specific routes (products, auth, etc.)

### Technical Implementation
- Uses React context for global state (cart, authentication)
- Shopping cart icon shows dynamic count from AppContext
- Navigation is responsive with mobile menu support
- Hero section uses Framer Motion for animations

---

## PAGE: /products (Products Catalog)
**Route:** `/products`  
**File:** `src/app/products/page.jsx`  
**Authentication Required:** No  
**Roles:** All (Public)

### Purpose
Display all available medical question banks and products that students can purchase or subscribe to.

### What It Does
- **Product Grid Display** - Shows all published products in a 3-column responsive grid
- **Product Cards** - Each product card displays:
  - Product icon/image
  - Product name and description
  - Key features (e.g., "2500+ Questions", "Clinical Focus")
  - Price and duration (30 days, 90 days, annual)
  - "Learn More" button for detailed view
  - "Add to Cart" button for quick add
- **Loading State** - Shows skeleton loaders while fetching products
- **Cart Integration** - Users can add products directly to cart without viewing details
- **Feature Highlights** - Displays checkmarks for:
  - Rigorous Accuracy
  - High-Yield Content
  - Performance Analytics
  - Elite Support
- **Call-to-Action Sections** - Prompts for signup/login if user not authenticated
- **Responsive Design** - Adapts from 1 column (mobile) to 3 columns (desktop)

### Why It Exists
- Central marketplace for discovering and purchasing products
- Allows anonymous users to browse offerings before committing
- Drives conversion by making products discoverable and accessible
- Simplifies product comparison with consistent card layouts

### How Navigation Works
- Click "Learn More" on any product card → Go to `/products/[id]`
- Click "Add to Cart" → Item added to shopping cart (stored in AppContext)
- Cart icon in header → Open cart dropdown with checkout option
- "Explore Products" button on home page → Come here

### Data Flow
1. Page loads and fetches published products from `/api/products`
2. Products stored in component state
3. Grid renders with product cards
4. User interacts: click "Learn More" or "Add to Cart"
5. Learn More → Route to detail page
6. Add to Cart → Update AppContext cart state

### Technical Details
- Uses `getPublishedProducts()` service to fetch products
- Dynamic routing with product filtering
- Responsive grid using Tailwind CSS
- Cart operations update AppContext state
- Skeleton loaders for better UX during loading

---

## PAGE: /products/[id] (Product Details/Pricing)
**Route:** `/products/[id]`  
**File:** `src/app/products/[id]/page.js`  
**Authentication Required:** No  
**Roles:** All (Public)

### Purpose
Show detailed information about a specific product including pricing tiers, features, and purchase options.

### What It Does
- **Product Header** - Displays:
  - Product name (e.g., "ECG Qbank")
  - Description and key benefits
  - Hero image/icon
- **Pricing Tiers Table** - Shows multiple subscription options:
  - 30-day access
  - 90-day access
  - Annual/lifetime access
  - Price for each tier
  - "Select" button to add to cart
- **Features Section** - Detailed list of what's included:
  - Number of questions
  - Question types
  - Analytics features
  - Support level
  - Access duration
- **Ratings/Reviews** - Social proof elements
- **Add to Cart Interface** - Allows selecting quantity and tier before adding
- **Navigation Back** - Button to return to products catalog

### Why It Exists
- Provides detailed information needed for purchase decisions
- Shows all available pricing options in one place
- Reduces friction by letting users add from detail page
- Builds confidence with feature highlights and social proof

### How Navigation Works
- From `/products` click "Learn More" → Come here
- Select pricing tier and click "Add to Cart" → Item added, can continue shopping
- Click "Proceed to Checkout" → Route to `/checkout`
- Click "Back to Catalog" → Return to `/products`

### Data Flow
1. Route receives product `[id]` from URL params
2. Fetch product details from `/api/products?id=[id]`
3. Render product information with all pricing tiers
4. User selects tier and quantity
5. Click "Add to Cart" → Update AppContext
6. Click "Checkout" → Route to `/checkout`

### Technical Details
- Uses dynamic route parameter `[id]`
- Responsive pricing table
- Cart operations update global AppContext
- Product data includes plans array with different durations/prices
- Error handling for product not found

---

# AUTHENTICATION PAGES

---

## PAGE: /auth (Authentication)
**Route:** `/auth`  
**File:** `src/app/auth/page.jsx` (wrapper) → `src/app/auth/AuthComponent.jsx` (main)  
**Authentication Required:** No  
**Roles:** All (Public)

### Purpose
Central authentication hub where users can log in or create new accounts. Supports both student and author authentication.

### What It Does
- **Tab Interface** - Two main tabs:
  1. **Login Tab**
     - Email input field
     - Password input field
     - "Remember Me" checkbox
     - "Forgot Password" link
     - "Sign In" button
     - Link to create account
  
  2. **Sign Up Tab**
     - Full Name input
     - Email input
     - Password input
     - Confirm Password input
     - Terms checkbox
     - "Create Account" button
     - Link to login

- **Auth Flow Logic:**
  - Validates input fields
  - Checks if email already exists (for signup)
  - Creates new user or validates existing user
  - Sets authentication tokens/session
  - Stores userId in localStorage
  - Redirects to appropriate portal based on role

- **Role Detection** - After successful login:
  - If role = "author" → Redirect to `/author`
  - If role = "student" → Redirect to `/student` or checkout
  
- **Redirect Parameter** - URL can include `?redirect=/target` to send user to specific page after auth

- **Error Handling** - Shows messages for:
  - Invalid credentials
  - Email already exists
  - Password mismatch
  - Network errors

- **Footer** - Links to products and other resources

### Why It Exists
- Single point of entry for all users
- Supports account creation and login
- Manages authentication state
- Routes users to correct portal based on role
- Handles redirect logic for post-auth navigation

### How Navigation Works
- From Home → Click profile icon, not logged in → Come here
- From Products → Try to checkout, not logged in → Come here with `?redirect=/checkout`
- Create account → Validate and redirect to student/author portal
- Login → Validate and redirect to student/author portal or redirect target

### Authentication Flow
```
User Entry → Choose Login/Signup
    ↓
Enter Credentials
    ↓
Client-side Validation
    ↓
API Call to /api/auth/login or /api/auth/register
    ↓
Server validates and returns token/user data
    ↓
Store userId in localStorage
    ↓
Role Check: Author or Student?
    ↓
Redirect to /author/login or /student dashboard
```

### Data Stored
- **localStorage:**
  - `medbank_user` - User ID
  - `medbank-author-unlocked` - Author status (true/false)
  - Various product-related settings

### Technical Details
- Form validation with error display
- Password strength indicators
- Email validation regex
- Session management via localStorage
- API integration for auth endpoints
- Redirect URL parameter handling

---

## PAGE: /author/login (Author Portal Login)
**Route:** `/author/login`  
**File:** `src/app/author/login/page.jsx` → `src/app/author/login/AuthorLoginComponent.jsx`  
**Authentication Required:** No  
**Roles:** Authors (but initially for anyone to attempt)

### Purpose
Specialized login page for authors/content creators with additional security and branding specific to the author portal.

### What It Does
- **Exclusive Branding** - "Authorized Personnel Only" security messaging
- **Login Form:**
  - Email input
  - Password input
  - Sign In button
  - Enhanced security messaging
  - "Access Denied" messaging for non-authors

- **Authentication:**
  - Validates email/password
  - Checks if user role = "author"
  - If not author → Shows error: "Only authors can access this portal"
  - If author → Stores auth token and redirects to `/author`

- **Security Features:**
  - Email/password validation
  - Role-based access control
  - Strict author verification

- **Visual Design** - Dark, professional theme with:
  - Blue accent colors matching brand
  - Minimalist form layout
  - Animated gradient hover effects
  - Secure/institutional appearance

### Why It Exists
- Restricts author portal access to verified authors only
- Prevents students from accidentally accessing author tools
- Creates sense of exclusivity and security
- Provides author-specific onboarding/messaging

### How Navigation Works
- From `/author` route (not logged in) → Redirect here
- Author tries to login → Success → Redirect to `/author`
- Non-author tries to login → Failure → Show error message
- Navigate to student auth → Go to `/auth` instead

### Technical Details
- Custom authentication flow with role checking
- Enhanced error messages for failed author access
- Dedicated styling for author portal aesthetic
- Role validation before redirect

---

# STUDENT PORTAL & DASHBOARD PAGES

---

## PAGE: /student/portal (Student Subscription Management)
**Route:** `/student/portal`  
**File:** `src/app/student/portal/page.jsx`  
**Authentication Required:** Yes (Students)  
**Roles:** Students

### Purpose
Central hub for students to manage their subscriptions, account settings, and access purchased products. This is where students manage their academic "vault" of purchased content.

### What It Does
- **Multi-Tab Interface** - Navigation between sections:
  1. **Subscriptions Tab**
     - Shows all purchased products
     - Displays expiration dates with countdown timer
     - Status: Active, Expiring Soon, Expired
     - Progress bars showing days remaining
     - "Renew" button for expired subscriptions
     - "Explore More Products" button
     - Free trial status if applicable
  
  2. **Profile Tab**
     - User's full name, email, role
     - Account creation date
     - Total tests taken
     - Overall statistics
     - Edit profile option
  
  3. **Billing Tab**
     - Payment history
     - Subscription status
     - Billing address
     - Payment method
     - Invoice download links
  
  4. **Security Tab**
     - Password change section
     - Account security status
     - Login history (if available)
     - "Change Password" button with modal dialog

- **Real-Time Countdown Timer** - For each subscription:
  - Updates every second
  - Shows: X days, Y hours, Z minutes remaining
  - Color coding: Green (plenty time), Yellow (expiring soon), Red (expired)
  - Automatically refreshes when subscription renews

- **Password Change Modal** - When changing password:
  - Old password input (with validation)
  - New password input (with strength indicator)
  - Confirm password input
  - Error messages if:
    - Old password incorrect
    - New passwords don't match
    - Password too weak
  - Success message after change
  - Token refresh to keep session alive

- **Subscription Management Actions:**
  - Click "Renew" on expired product → Adds to cart and goes to checkout
  - Click "Explore More Products" → Goes to `/products`
  - Click "View Dashboard" on active product → Goes to student dashboard
  - Subscription auto-filters into: Active, Expiring, Expired categories

### Why It Exists
- Single place for students to see what they own
- Track subscription expiration dates
- Manage account security (password changes)
- Renew subscriptions before they expire
- Access billing history
- Prevents unauthorized access after expiration

### How Navigation Works
- Login as student → Redirect here (or can navigate from sidebar)
- Click "Explore More Products" → Go to `/products`
- Click "Renew" → Add to cart and go to `/checkout`
- Click "View Dashboard" → Go to `/student/dashboard` for that product
- Click "Change Password" → Modal opens inline
- Logout → Go to home page

### Data Flow
1. User logs in, role = "student"
2. Redirect to `/student/portal`
3. Fetch user data from `/api/users?id=[userId]`
4. Display subscriptions with countdown timers
5. Timers update every second via interval
6. User clicks action buttons
7. Navigate or update state accordingly

### State Management
- **Component State:**
  - `activeTab` - Current tab selection
  - `user` - User data object
  - `timeRemaining` - Countdown timers for each subscription
  - `passwordError`, `passwordSuccess` - Form states
  - `showPasswordModal` - Modal visibility
- **localStorage:**
  - `medbank_portal_active_tab` - Remember last active tab

### Technical Details
- Tabs with tab persistence (remembers last viewed tab)
- Real-time countdown using setInterval with cleanup
- Password validation and change via API
- Subscription filtering and categorization
- Responsive grid layout for subscriptions
- Date formatting and countdown logic

---

## PAGE: /student/(dashboard)/dashboard (Student Home Dashboard)
**Route:** `/student/dashboard`  
**File:** `src/app/student/(dashboard)/dashboard/page.jsx`  
**Authentication Required:** Yes (Students)  
**Roles:** Students

### Purpose
The main landing page after students login to their dashboard. Shows overview of progress, quick stats, and recent activity.

### What It Does
- **Hero/Welcome Section** - Displays:
  - User's first name: "Welcome back, [Name]"
  - Motivational message
  - Current product/vault name
  - Quick action buttons

- **Key Performance Indicators (KPIs)** - Shows 3-4 main metrics:
  1. **Accuracy Score** - Percentage of questions answered correctly
     - Formula: (Correct Answers / Total Attempted) × 100
     - Updates based on test history
     - Color coded: Green (>70%), Yellow (50-70%), Red (<50%)
  
  2. **Usage Rate** - Percentage of question bank covered
     - Formula: (Used Questions / Total Questions) × 100
     - Tracks which questions have been attempted at least once
     - Goal: Increase this percentage
  
  3. **Tests Completed** - Total number of test sessions finished (not suspended)
     - Counts only submitted tests
     - Excludes suspended/in-progress tests

- **Recent Activity Section:**
  - Last 5-10 tests taken with:
    - Test date and time
    - Number of questions in test
    - Score/accuracy for that test
    - Link to view full results
  
- **Suspended Tests Alert** - If student has unfinished tests:
  - Shows most recent suspended test
  - "Resume Test" button to continue
  - "View Suspended Tests" link to see all
  
- **Quick Access Buttons:**
  - "Create New Test" → Go to `/student/qbank/create-test`
  - "View Performance" → Go to `/student/performance`
  - "Test History" → Go to `/student/tests`

### Why It Exists
- Gives students quick overview of progress
- Shows motivation metrics (accuracy, usage)
- Allows resume of suspended tests
- Easy navigation to main features
- Personalized with user's name and product

### How Navigation Works
- Login → Auto-redirect here
- Click "Create New Test" → Go to `/student/qbank/create-test`
- Click "View Performance" → Go to `/student/performance`
- Click "Resume Test" → Go back to `/student/qbank/take-test` with suspended test
- Click test in history → Go to `/student/qbank/test-summary` with results

### Data Aggregation
```
Fetch:
- User data (name, subscription status)
- All questions in current product
- All tests for current product
  
Calculate:
- Accuracy = Correct / (Correct + Incorrect)
- Usage = Questions with status != "unused" / Total Questions
- Completed Tests = Tests where isSuspended = false

Display:
- Format metrics with proper percentages
- Sort tests by date (most recent first)
- Highlight suspended tests
```

### Technical Details
- Uses AppContext for selectedStudentProduct
- Fetches data from `/api/questions` and `/api/tests`
- Aggregates test data to calculate metrics
- Reactive to product selection changes
- Loading state while fetching data
- Error handling with fallback values

---

## PAGE: /student/(dashboard)/performance (Performance Analytics)
**Route:** `/student/performance`  
**File:** `src/app/student/(dashboard)/performance/page.jsx`  
**Authentication Required:** Yes (Students)  
**Roles:** Students

### Purpose
Deep-dive analytics page showing detailed performance metrics, behavioral patterns, and comparative analytics with bell curve distribution.

### What It Does
- **Score Breakdown Cards** - Shows four key metrics:
  1. **Correct** - Questions answered correctly (green)
  2. **Incorrect** - Questions answered incorrectly (red)
  3. **Omitted** - Questions not answered/skipped (gray)
  4. **Accuracy %** - Overall percentage correct (blue prominent)

- **Bell Curve Distribution** - Displays where student ranks:
  - X-axis: Score percentiles (0-100)
  - Y-axis: Distribution curve (normal distribution)
  - Student position: Red dot showing their percentile ranking
  - Label: "You are in the top X percentile"
  - Reference lines: Mean, 1 std dev, 2 std dev

- **Cognitive/Behavioral Metrics** - Shows 4-6 advanced indicators:
  1. **Percentile Score** - Where student ranks among all test-takers
  2. **Readiness Score** - Estimate of exam preparation level (0-100)
  3. **Overthinking Index** - Measure of second-guessing
     - Calculated: Answer changes from correct to incorrect / Total changes
     - High = Student doubts correct answers too much
  
  4. **Impulsivity Index** - How quickly student answers without thinking
     - Measure: Questions answered <10 seconds with incorrect answer
  
  5. **Fatigue Factor** - Decrease in accuracy over time in long tests
     - Calculated: Accuracy first half vs second half
  
  6. **Usage Rate** - Percentage of question bank covered
     - Used Questions / Total Questions

- **Question Bank Statistics:**
  - Total questions in product
  - Questions used/attempted
  - Questions not yet seen
  - Breakdown by:
    - System (Cardiovascular, Respiratory, etc.)
    - Subject (Anatomy, Physiology, etc.)
    - Difficulty (Easy, Medium, Hard)

- **Test History Summary:**
  - Total tests created
  - Tests completed (submitted)
  - Tests suspended (in progress)
  - Average score across all tests
  - Time spent per question average

- **Answer Change Analysis:**
  - Correct → Incorrect: How many times student changed from right to wrong (bad)
  - Incorrect → Correct: How many times student changed from wrong to right (good)
  - Incorrect → Incorrect: Student changed but stayed wrong

- **Expandable System Breakdown** - Click on system name to see:
  - Number of questions in that system
  - Questions attempted vs not attempted
  - Accuracy in that system
  - Performance trend (improving/declining)

- **Print Functionality** - "Print Performance Report" button exports as PDF

### Why It Exists
- Provides actionable insights beyond just accuracy
- Identifies problem areas (weak systems, behavioral issues)
- Helps students understand why they're struggling
- Motivates with percentile/readiness scores
- Allows pattern identification (overthinking, fatigue, impulsivity)
- Tracks progress over time with historical data

### How Navigation Works
- From dashboard → Click "View Performance"
- From sidebar → Click "Performance" icon
- From any page → Click performance button
- Print report → Opens print dialog with formatted data

### Data Aggregation Logic
```
Fetch:
- All questions in product
- All test results for student
  
For each test:
- Extract firstAnswers (initial response)
- Extract finalAnswers (after review/changes)
- Compare question statuses (correct/incorrect/omitted)
  
Calculate Metrics:
1. Accuracy = Correct / (Correct + Incorrect)
2. Second Guessing = Count where First=Correct & Final=Incorrect
3. Recoveries = Count where First=Incorrect & Final=Correct
4. Impulsivity = Count where Time<10s and Final=Incorrect
5. Average Time = Total Time / Total Questions
6. Percentile = Student's score vs distribution of all students
7. Readiness = Weighted formula of accuracy + coverage + consistency
8. Fatigue = (Accuracy in first half) - (Accuracy in second half)

Generate Bell Curve:
- Normal distribution with mean=50, stdDev=15
- Plot 100 data points from 0-100
- Mark student's position on curve
```

### State Management
- `loading` - While fetching data
- `stats` - All calculated metrics
- `hoveredScore` - For interactive chart hover states
- `expandedSystems` - Which systems are expanded in breakdown

### Technical Details
- Uses Recharts for bell curve visualization
- Real-time calculations from test data
- Responsive grid for metric cards
- Color coding for different metrics
- Expandable sections with smooth transitions
- Print styles for PDF export

---

## PAGE: /student/(dashboard)/planner (Study Planner)
**Route:** `/student/planner`  
**File:** `src/app/student/(dashboard)/planner/page.jsx`  
**Authentication Required:** Yes (Students)  
**Roles:** Students

### Purpose
Help students organize and plan their study schedule with goal-setting and progress tracking.

### What It Does
*(Implementation details would include: calendar view, goal setting, schedule management, reminder system, study goals by system/subject, progress tracking towards goals)*

---

## PAGE: /student/(dashboard)/account (Account Settings)
**Route:** `/student/account`  
**File:** `src/app/student/(dashboard)/account/page.jsx`  
**Authentication Required:** Yes (Students)  
**Roles:** Students

### Purpose
Manage account-specific settings within the student dashboard.

### What It Does
*(Likely mirrors some functionality from /student/portal with additional settings specific to dashboard context)*

---

## PAGE: /student/qbank/create-test (Test Builder/Configuration)
**Route:** `/student/qbank/create-test`  
**File:** `src/app/student/(dashboard)/qbank/create-test/page.jsx`  
**Authentication Required:** Yes (Students)  
**Roles:** Students

### Purpose
The test configuration interface where students build custom tests by selecting filters, question types, and test parameters before launching the actual test.

### What It Does
- **Test Mode Selection** - Collapsible section:
  - **Tutor Mode:** 
    - Can review answers immediately
    - Receive explanations after each question
    - Can change answers mid-test
    - Not timed
    - Purpose: Learn
  
  - **Exam Mode:**
    - Cannot review until after submission
    - Timer runs continuously
    - Single answer submission
    - Purpose: Assess readiness

- **Question Mode Selection** - Choose question pool source:
  - **Standard:** Use predefined filters
  - **Custom:** Upload or manually select specific question IDs

- **Subject Filter** - Collapsible checkboxes:
  - Shows all subjects in product (Anatomy, Physiology, etc.)
  - Shows count of available questions per subject
  - Multi-select checkbox interface
  - "Select All" / "Deselect All" buttons
  - Selected subjects highlighted
  - Counts update based on system selection

- **System Filter** - Collapsible checkboxes:
  - Shows all systems (Cardiovascular, Respiratory, etc.)
  - Shows count of available questions per system
  - Multi-select checkbox interface
  - "Select All" / "Deselect All" buttons
  - Selected systems highlighted
  - Counts update based on subject selection

- **Question Status Filters** - 5 filter buttons showing question usage:
  1. **Unused** - Questions never attempted
  2. **Correct** - Answered correctly in past tests
  3. **Incorrect** - Answered incorrectly in past tests
  4. **Omitted** - Skipped/not answered in past tests
  5. **Marked** - Flagged for review in past tests
  
  - Click toggles filter on/off
  - Shows count of questions matching each filter
  - Multiple filters can be active (OR logic)
  - No filter = all questions included

- **Question Count Selector:**
  - Input field or slider
  - Range: 1 to max available (usually 40)
  - Shows: "X questions available"
  - Disabled if 0 questions match filters
  - Defaults to showing how many match filters

- **Pool Summary:**
  - "You will create a test with:"
  - "[X] questions from [Y] subjects and [Z] systems"
  - Color-coded indicators for complexity
  - Estimated time to complete

- **Start Test Button:**
  - Enabled only if:
    - Subject selected
    - System selected
    - Question count > 0 and ≤ max available
  - Click → Validates, then routes to `/student/qbank/take-test`
  - Passes test configuration via URL/state

- **Collapsible Sections:**
  - Click header to expand/collapse
  - Shows/hides content with smooth animation
  - Saves state (which sections expanded)

### Why It Exists
- Allows customization of test experience
- Enables focused studying on weak areas
- Prevents information overload
- Let's students choose difficulty/scope
- Makes testing more adaptive to learning goals
- Filters prevent reviewing questions they know well

### How Navigation Works
- From dashboard → Click "Create Test"
- From sidebar → Click "QBank" → Redirects here
- Configure filters → Click "Start Test"
- Goes to `/student/qbank/take-test` with config
- Can go back to modify filters
- Cannot skip this step

### Data Flow
```
Load Page:
- Fetch all questions for product
- Fetch user's test history/progress
- Calculate status for each question (unused/correct/incorrect/omitted/marked)
  
User Configures:
- Selects mode (tutor/exam)
- Selects subjects (multi-select)
- Selects systems (multi-select)
- Toggles status filters
- Enters question count
  
Real-Time Updates:
- As filters change, recalculate available question count
- Update "questions available" display
- Enable/disable start button
- Update pool summary
  
Start Test:
- Fetch [N] random questions matching filters from eligible pool
- Store config in localStorage: medbank_current_test
- Navigate to /student/qbank/take-test
```

### Filter Logic Details

**Status Calculation per Question:**
```
For each question:
  If question.status = null (in progress):
    Display as "Omitted" (not yet answered)
  Else if question.status = undefined:
    Display as "Unused" (never seen)
  Else:
    Use question.status (correct/incorrect/marked)
```

**Filter Combination:**
```
If NO filters selected:
  Show all questions in selected subjects + systems

If filters ARE selected (e.g., "Unused" and "Incorrect"):
  OR logic: Show questions with status = "unused" OR status = "incorrect"
  In selected subjects + systems

Counts shown update:
- Subject count = questions in subject matching filters
- System count = questions in system matching filters
```

**Max Questions Logic:**
```
Max Available = Count of questions matching all selected filters
Max Allowed = 40 (hardcoded maximum)
Actual Max = Math.min(Max Available, 40)

User can request 1 to Actual Max questions
```

### State Management
```javascript
{
  selectedSubjects: Set(), // Selected subject names
  selectedSystems: Set(), // Selected system names
  activeFilters: ["Unused", "Incorrect"], // Selected status filters
  numQuestions: 20, // How many to include in test
  mode: "tutor" or "exam", // Test mode
  questionMode: "Standard" or "Custom", // Question pool source
  questions: [], // All questions in product (with status)
  allQuestionsInProduct: [], // Full question data
}
```

### Technical Implementation
- useMemo for expensive filter calculations
- Real-time question count updates
- Responsive grid layout
- Animated collapsible sections with Framer Motion
- Icons showing status counts
- Error handling for edge cases
- Product-specific question fetching
- Stores current selection in localStorage for persistence

---

## PAGE: /student/qbank/take-test (Test Execution/Test Engine)
**Route:** `/student/qbank/take-test`  
**File:** `src/app/student/(dashboard)/qbank/take-test/page.jsx`  
**Authentication Required:** Yes (Students)  
**Roles:** Students

### Purpose
The full-featured test engine where students actually take tests. This is the core interactive testing interface with all exam features.

### What It Does

#### Header Section
- **Question Counter:** "Question X of Y"
- **Timer:**
  - For exam mode: Countdown timer showing remaining time
  - For tutor mode: Elapsed time counter
  - Color changes: Green → Yellow → Red as time runs low
  - Auto-ends test if time expires
- **Quick Info Buttons:**
  - Marked count badge showing flagged questions
  - Zoom controls (increase/decrease question text size)
  - Settings menu (sound on/off, other preferences)
  - Full-screen toggle button
- **Navigation Buttons:**
  - Previous question (disabled on first)
  - Next question (disabled on last)
- **Toolbar Buttons:**
  - Flag/Mark question button (toggle)
  - Review mode indicators
  - Help/Reference button
  - Settings (toggle sidebar, zoom, etc.)

#### Main Content Area
- **Question Display:**
  - Full question stem (medical scenario/case)
  - Question images if present (ECG tracings, X-rays, etc.)
  - Question image reveal: Can be image size (small/medium/large)
  
- **Answer Choices:**
  - A, B, C, D, E multiple choice options
  - Clear selection indicator for selected choice
  - Can click any choice to select
  - In exam mode: Single selection, cannot change until end
  - In tutor mode: Can change freely

#### Right Sidebar (Collapsible)
- **Question Navigator Panel:**
  - Grid of all question numbers (1-40 typically)
  - Color coding for each question:
    - White = Not answered
    - Blue = Currently viewing
    - Green = Correct (in tutor mode after answering)
    - Red = Incorrect (in tutor mode)
    - Gray = Omitted (skipped)
    - Yellow Star = Marked for review
  - Click any number to jump to that question
  - Shows overall progress visually

- **Marked Questions List:**
  - Shows all flagged questions with numbers
  - Quick jump to any marked question
  - Count of total marked

- **Answer History (if applicable):**
  - Shows previous answers to current question
  - Timestamps of changes
  - In review mode: Full history visible
  - In exam mode: Locked until submitted

#### Bottom Action Bar
- **Suspend Button:**
  - "Pause/Suspend Test"
  - Saves progress and allows resuming later
  - Confirmation dialog with warning
  - Saves to localStorage and database

- **End Test Button:**
  - "End Test" or "Submit"
  - Available only after all questions viewed
  - Shows confirmation dialog
  - Lists unanswered count with warning
  - Calculates score before submission
  - Auto-submits after time expires in exam mode

- **Review Toggle (in exam mode after submission):**
  - Switches to review mode
  - Can now see answers and explanations
  - Cannot change answers
  - Can still mark for future review

#### Review Mode (After Submission in Exam Mode)
- All answers locked
- Shows correct answer for each
- Displays explanation
- Color-codes: Correct (green), Incorrect (red), Omitted (gray)
- Still allows marking questions
- Can filter by status (correct/incorrect)

#### Tutor Mode (Immediate Feedback)
- After selecting answer:
  - Immediate feedback: "Correct!" or "Incorrect"
  - Shows explanation
  - Can see correct answer
  - Can change answer if desired
  - Explanation includes:
    - Why correct answer is right
    - Why distractors are wrong
    - Key learning points
    - Related concepts

### Why It Exists
- Primary feature of the platform
- Where actual learning and assessment happens
- Provides exam-like experience for preparation
- Tracks performance for analytics
- Allows flexible learning modes (tutor vs exam)
- Records question history for analytics

### How Navigation Works
- From create-test → Click "Start Test" → Come here
- Use question navigator to jump between questions
- Click "Next"/"Previous" to move sequentially
- Click "Suspend" → Saves and returns to dashboard
- Click "End Test" → Submits and goes to `/student/qbank/test-summary`
- Auto-redirect after time expires

### Data Structures & Tracking

**Question Object Structure:**
```javascript
{
  id: "q-001",
  stem: "Question text",
  choices: ["A", "B", "C", "D", "E"],
  correct: 0, // Index of correct choice
  subject: "Anatomy",
  system: "Cardiovascular",
  difficulty: "medium",
  explanation: "Why this answer is correct...",
  explanationCorrect: "...",
  explanationWrong: "..."
}
```

**Session State Tracking:**
```javascript
{
  testId: "test-001",
  questions: [], // All test questions
  currentIndex: 0, // Current question being viewed
  answers: {
    "q-001": 0, // questionId: selected answer index
    "q-002": null, // null = unanswered
  },
  firstAnswers: {
    "q-001": 0, // Initial answer selected
  },
  markedQuestions: Set(["q-003", "q-005"]), // Flagged for review
  questionDurations: {
    "q-001": 45, // Seconds spent on question
  },
  elapsedTime: 1230, // Total seconds elapsed
  sessionState: {
    logs: [ // Forensic log of every action
      { action: "select_answer", questionId: "q-001", answer: 0, timestamp: "..." },
      { action: "flag_question", questionId: "q-003", timestamp: "..." },
      ...
    ]
  }
}
```

**Answer Update Logic:**
- When user clicks answer choice:
  1. Store selection in `answers` object
  2. If first time answering → also store in `firstAnswers`
  3. Log action to `sessionState.logs`
  4. In tutor mode: immediately evaluate correctness
  5. In exam mode: just record selection
  6. Update question navigator colors
  7. Persist to localStorage: `medbank_current_test`

**Marking/Flag Logic:**
- When user clicks "Mark" button:
  1. Toggle question in `markedQuestions` set
  2. Update localStorage
  3. Update database (user_questions table)
  4. Update question navigator (yellow star)
  5. Add/remove from marked list in sidebar

### Test Submission Flow
```
User clicks "End Test"
    ↓
Show confirmation dialog
    ↓
User confirms
    ↓
Calculate scores:
  - For each question in test:
    - Compare user answer to correct answer
    - Determine status (correct/incorrect/omitted)
    - Calculate time spent
  
  - Calculate overall:
    - Total correct
    - Total incorrect
    - Total omitted
    - Overall percentage
    - Average time per question

    ↓
Create result object with:
  - Test metadata (id, date, mode, etc.)
  - All questions with answers
  - All answers keyed by question id
  - All first answers (for change tracking)
  - Timing data
  - Session forensic logs
  - Marked question ids

    ↓
Update user's question progress:
  For each question:
    - Fetch existing user_question record
    - Update status (correct/incorrect/omitted)
    - Update user answer
    - Increment attempt count
    - Add to time spent
    - Add to user history

    ↓
Save test result to database and IndexedDB

    ↓
Store lastTestId in localStorage

    ↓
Navigate to /student/qbank/test-summary
```

### Forensic Logging
Every action is logged for analytics:
```javascript
{
  action: "select_answer" | "flag_question" | "unflag_question" | "navigate_question" | "end_test",
  questionId: "q-001",
  answer: 0, // For select_answer
  timestamp: "2026-01-30T14:23:45.123Z",
  elapsedSeconds: 45, // Since test start
  duration: 12 // Seconds on this question
}
```

These logs enable:
- Identifying overthinking (frequent answer changes)
- Detecting impulsivity (very fast answers)
- Measuring fatigue (slower, less accurate near end)
- Time analysis (which questions take longest)
- Pattern recognition (behavioral markers)

### State Management
```javascript
useState({
  questions: [], // Test questions
  currentIndex: 0,
  selectedAnswer: null,
  answers: {},
  isSubmitted: false,
  mode: "tutor", // or "exam"
  isReviewMode: false,
  elapsedTime: 0,
  markedQuestions: new Set(),
  lockedAnswers: new Set(), // Exam mode
  questionDurations: {},
  modal: { show: false, ... }
})
```

### Technical Details
- Full timer implementation with auto-submit
- Real-time status tracking
- Forensic logging to session state
- Color-coded question navigator
- Seamless mode switching (tutor vs exam)
- Question image lazy loading
- Auto-save to localStorage every 5 seconds
- Database persistence after submission
- Error handling for network failures
- Responsive exam interface
- Keyboard shortcuts support (optional)

---

## PAGE: /student/qbank/test-summary (Test Results & Analysis)
**Route:** `/student/qbank/test-summary`  
**File:** `src/app/student/(dashboard)/qbank/test-summary/page.jsx`  
**Authentication Required:** Yes (Students)  
**Roles:** Students

### Purpose
Display comprehensive results after test completion, including scoring, answer review, and detailed question-by-question breakdown.

### What It Does

#### Header/Navigation
- **Back Button** - "← Previous Tests" links to `/student/tests`
- **Action Buttons:**
  - Print Report button
  - Share Results button
  - Notes button (access question notes)

#### Score Summary Section
- **Large Score Donut Chart:**
  - Displays three-color donut showing breakdown:
    - Green: Correct answers (percentage)
    - Red: Incorrect answers (percentage)
    - Gray: Omitted answers (percentage)
  - Center displays: "XX% Correct" in large font
  - Interactive: Hover over each segment highlights it
  - Shows exact count below chart (e.g., "27 Correct")

- **Detailed Score Cards** - Shows 4 metrics:
  1. **Correct** - Green card with count and percentage
  2. **Incorrect** - Red card with count and percentage
  3. **Omitted** - Gray card with count and percentage
  4. **Overall Score** - Blue card with percentage score

- **Test Metadata:**
  - Test date and time
  - Duration (total time spent)
  - Mode (Tutor vs Exam)
  - Questions in test
  - Product/qbank name

#### Tab Interface - Multiple Views
**Tab 1: Results View**
- Comprehensive breakdown
- Score summary
- Performance compared to class/percentile
- Subject breakdown

**Tab 2: Analysis View**
- Behavioral analytics
- Answer change tracking
- Time spent analytics
- Difficulty analysis

#### Question-by-Question Review
- **Collapsible Questions List:**
  - Each question shows:
    - Question number
    - Status badge (✓ Correct, ✗ Incorrect, − Omitted)
    - Subject and system tags
    - User's answer
    - Correct answer
    - Time spent on question
  
  - Click to expand:
    - Full question stem
    - Question image(s)
    - All answer choices with annotations
    - Explanation of correct answer
    - Why other choices are wrong
    - Related concepts/learning objectives

- **Filtering Options:**
  - "All" - Show all questions
  - "Correct" - Only show questions answered correctly
  - "Incorrect" - Only show questions answered incorrectly
  - "Omitted" - Only show questions not answered

- **Grouping/Sorting:**
  - Group by Subject
  - Group by System
  - Group by Difficulty
  - Sort by: Performance, Time, etc.

#### Answer Change Tracking (if applicable)
- For questions where answer changed from first to final:
  - Show: "You changed your answer from B to D"
  - Evaluate: If original was correct, mark as "Second-guessing"
  - Evaluate: If original was incorrect but final is correct, mark as "Good recovery"
  - Color code appropriately (red for second-guessing, green for recovery)

#### Time Analysis
- **Average Time per Question** - Shows across test
- **Questions Answered Too Quickly** - May indicate carelessness
- **Questions That Took Longest** - May indicate difficulty
- **Time Distribution Chart** - Bar chart of time spent per question

#### Behavioral Insights
- **Cognitive Markers** (if forensic data available):
  - Overthinking score
  - Impulsivity markers
  - Fatigue indicator
  - Confidence level estimation
  
- **Performance Trends:**
  - How this test compares to previous tests
  - Accuracy trend (improving/declining)
  - Speed trend
  - Consistency

#### Subject Breakdown Section
- **Expandable System/Subject Performance:**
  - Cardiovascular: 18/20 (90%)
  - Respiratory: 12/15 (80%)
  - etc.
  - Click to expand and see individual questions in that system
  - Color code by performance (green high, red low)

#### Action Buttons
- **Save to Favorites** - Mark important test for reference
- **Generate PDF Report** - Export full results as PDF
- **Share Results** - Generate shareable link
- **Practice Weak Areas** - Auto-configure create-test page for weak subjects
- **Create New Test** - Back to `/student/qbank/create-test`
- **View All Tests** - Go to `/student/tests` for history

#### Print/Export Functionality
- **Print Report** button generates:
  - Test metadata (date, duration, product)
  - Score summary with donut chart
  - Question-by-question breakdown with answers
  - System/subject breakdown
  - Time analysis
  - Formatted for printing

### Why It Exists
- Provides immediate feedback after test completion
- Enables learning from mistakes
- Tracks performance for future reference
- Motivates with clear success metrics
- Identifies weak areas for targeted studying
- Builds comprehensive performance history

### How Navigation Works
- Auto-navigated here after test submission
- Click "Previous Tests" → Go to `/student/tests`
- Click "Create New Test" → Go to `/student/qbank/create-test`
- Click question → Expand inline details
- Click subject → Expand questions in that subject

### Data Structure
```javascript
testResult = {
  testId: "test-001",
  testNumber: 15,
  userId: "user-001",
  packageId: "14",
  packageName: "Premium Stream",
  date: "2026-01-30T14:23:45Z",
  questions: [
    {
      id: "q-001",
      correct: 0, // Correct answer index
      userAnswer: 0, // User's answer index
      subject: "Anatomy",
      system: "Cardiovascular",
      timeSpent: 45,
      status: "correct" // correct/incorrect/omitted
    },
    ...
  ],
  answers: {
    "q-001": 0,
    "q-002": null, // Omitted
    ...
  },
  firstAnswers: {
    "q-001": 2, // Changed from C to A
    ...
  },
  mode: "tutor",
  pool: "All Questions",
  elapsedTime: 1230, // Seconds
  markedIds: ["q-003", "q-005"],
  isSuspended: false,
  
  // Calculated fields:
  stats: {
    total: 40,
    correct: 27,
    incorrect: 10,
    omitted: 3,
    percentage: 73,
    avgTime: 31
  }
}
```

### State Management
```javascript
useState({
  testResult: null,
  activeTab: "results", // or "analysis"
  copySuccess: null,
  hydratedQuestions: null,
  filter: "all", // or "correct"/"incorrect"/"omitted"
  globalStats: {},
  expandedSubjects: []
})
```

### Calculations Performed

**Score Calculation:**
```
Correct = Count where answer === correctAnswer
Incorrect = Count where answer !== correctAnswer AND answer !== null
Omitted = Count where answer === null
Percentage = (Correct / Total) * 100
```

**Subject Breakdown:**
```
For each subject:
  - Count total questions
  - Count correct
  - Calculate percentage
  - Show as expandable card
```

**Answer Change Analysis:**
```
If firstAnswers[qId] !== answers[qId]:
  If firstAnswers[qId] === correctAnswer:
    Mark as "Second-guessing" (red)
  Else if answers[qId] === correctAnswer:
    Mark as "Good Recovery" (green)
  Else:
    Mark as "Changed but Still Wrong" (gray)
```

**Time Analysis:**
```
For each question:
  timeSpent[qId] = duration tracking from test session
  
Calculate:
  - avgTimePerQuestion = totalTime / totalQuestions
  - slowest = question with max time
  - fastest = question with min time
  - tooFast = questions with time < 10s and incorrect
```

### Technical Details
- Fetches hydrated question data from API
- Real-time calculations from test data
- Expandable/collapsible sections with animation
- Print-specific CSS for PDF export
- Responsive layout for mobile view
- SVG donut chart for score visualization
- Performance optimizations with useMemo
- Hooks for time display formatting
- Historical data persistence

---

## PAGE: /student/tests (Test History)
**Route:** `/student/tests`  
**File:** `src/app/student/(dashboard)/tests/page.jsx`  
**Authentication Required:** Yes (Students)  
**Roles:** Students

### Purpose
Display comprehensive list of all tests taken by student with sorting, filtering, and quick access options.

### What It Does
- **Test List/Table** - Shows all tests with columns:
  - Test # (sequential number)
  - Date (when taken)
  - Subject/Pool (what was tested)
  - Score (accuracy percentage)
  - Duration (time spent)
  - Status (completed/suspended)
  - Actions (view, resume, delete)

- **Sorting Options:**
  - Sort by Date (newest/oldest)
  - Sort by Score (highest/lowest)
  - Sort by Duration
  - Sort by Status

- **Filtering:**
  - Filter by Status: All/Completed/Suspended
  - Filter by Product/Package
  - Filter by Date Range
  - Search by test number or notes

- **Test Row Details:**
  - Click row → Expand to show:
    - Full test configuration
    - Question breakdown (# correct/incorrect/omitted)
    - Average time per question
    - Notes added to test
    - Detailed score breakdown
  - Click "View Results" → Go to `/student/qbank/test-summary?testId=X`
  - Click "Resume" (if suspended) → Go back to `/student/qbank/take-test` with test ID
  - Click "Delete" → Remove test from history (with confirmation)

- **Statistics Summary:**
  - Total tests taken
  - Average score across all tests
  - Total questions attempted
  - Total study time
  - Best score
  - Worst score
  - Improvement trend (if applicable)

- **Suspended Tests Section** (if any):
  - Special list of in-progress tests
  - Shows % completion
  - "Resume" button to continue
  - Hours elapsed since suspension

### Why It Exists
- Provides complete test history reference
- Allows student to track long-term progress
- Enables resuming interrupted tests
- Helps identify patterns (improving vs declining)
- Provides study session documentation

### How Navigation Works
- From sidebar → Click "Tests" / "History"
- From dashboard → Click test in recent activity
- From test summary → Click "Previous Tests"
- Click test in list → Either expand or go to results
- Click "Resume" on suspended → Continue test

### Data Structure
```javascript
tests = [
  {
    testId: "test-001",
    testNumber: 15,
    date: "2026-01-30T14:23:45Z",
    packageId: "14",
    pool: "Cardiovascular System",
    score: 73,
    correct: 27,
    incorrect: 10,
    omitted: 3,
    totalTime: 1230,
    questionsCount: 40,
    isSuspended: false,
    percentComplete: 100
  },
  {
    testId: "test-000",
    testNumber: 14,
    date: "2026-01-29T10:15:00Z",
    packageId: "14",
    pool: "All Questions",
    score: 68,
    correct: 27,
    incorrect: 15,
    omitted: 3,
    totalTime: null,
    questionsCount: 40,
    isSuspended: true,
    percentComplete: 60,
    lastAnswered: 24
  }
]
```

### Technical Details
- Fetches test history from IndexedDB and database
- Sorting and filtering in memory
- Expandable rows with smooth animation
- Responsive table design
- Statistics calculations
- Status badges with icons

---

## PAGE: /checkout (Shopping Cart & Purchase)
**Route:** `/checkout`  
**File:** `src/app/checkout/page.jsx`  
**Authentication Required:** Yes (Students)  
**Roles:** Students

### Purpose
Final step in purchase process where students review their shopping cart and complete payment.

### What It Does
- **Cart Review Section:**
  - List all items in cart with:
    - Product name
    - Subscription duration (30 days / 90 days / annual)
    - Price per item
    - Quantity
    - Total price per item
    - Remove button per item
  
  - Cart Summary:
    - Subtotal
    - Tax (if applicable)
    - Discount code field (if applicable)
    - Total amount due

- **Checkout Form:**
  - Billing Information:
    - Full name
    - Email address
    - Phone number
    - Address fields
  
  - Payment Method:
    - Credit card fields:
      - Card number
      - Expiration date
      - CVC
      - Cardholder name
    - Alternative: PayPal option

- **Order Review:**
  - Summary of what will be purchased
  - Total cost
  - Expected delivery (immediate access)
  - Terms and conditions checkbox
  - "Complete Purchase" button

- **Processing State:**
  - Shows loading spinner while processing
  - "Processing payment..." message
  - Prevents multiple submissions

- **Success Confirmation:**
  - After purchase succeeds:
    - Shows "Purchase Complete!" message
    - Lists purchased products
    - Provides access instructions
    - "Go to Dashboard" button
    - Auto-redirects after 2 seconds

- **Error Handling:**
  - Shows error message if payment fails
  - Allows retry
  - Explains failure reason

### Why It Exists
- Completes the purchase workflow
- Provides payment processing
- Confirms purchase details
- Gives students immediate access
- Handles financial transactions securely

### How Navigation Works
- From `/products/[id]` → Click "Checkout"
- From `/student/portal` → Click "Renew" → Checkout
- Complete payment → Redirect to `/student/portal` or dashboard
- Cancel → Go back to previous page

### Data Flow
```
User arrives with cart items
    ↓
Display cart with totals
    ↓
Fill in billing/payment info
    ↓
Click "Complete Purchase"
    ↓
Validate form data
    ↓
Send payment to payment processor
    ↓
If success:
  - Update user.subscriptions[]
  - Clear cart
  - Show success message
  - Redirect to portal
    
If failure:
  - Show error message
  - Allow retry or cancel
```

### Technical Details
- Payment processing via Stripe or similar
- PCI compliance handling
- Form validation
- Loading states
- Error messaging
- Cart state management via AppContext
- Responsive checkout form

---

# AUTHOR PORTAL & MANAGEMENT PAGES

---

## PAGE: /author/login (Author Authentication)
**Route:** `/author/login`  
**File:** `src/app/author/login/page.jsx`  
**Authentication Required:** No  
**Roles:** Authors (verified)

*(Covered in detail earlier in Authentication Pages section)*

---

## PAGE: /author (Author Dashboard)
**Route:** `/author`  
**File:** `src/app/author/page.jsx`  
**Authentication Required:** Yes (Authors)  
**Roles:** Authors

### Purpose
Main analytics and overview dashboard for authors showing question bank performance, student engagement, and key metrics.

### What It Does
- **Overview Statistics** - Key Performance Indicators:
  1. **Total Questions** - Count of all questions created
  2. **Published Count** - Questions in published status
  3. **Draft Count** - Questions still in draft/editing
  4. **Review Count** - Questions awaiting approval
  5. **Total Users** - How many students have access
  6. **Paid Users** - How many with active subscriptions
  7. **Total Tests** - All tests taken by all students
  8. **Average Session** - Average test duration
  9. **Daily Active Users (DAU)** - Users who took tests today

- **KPI Cards** - Large cards showing each metric with:
  - Metric name
  - Current value
  - Trend indicator (↑ improving, ↓ declining, ↔ stable)
  - Percentage change from last period
  - Mini sparkline chart showing trend

- **Content Breakdown Chart** - Pie chart showing:
  - Questions by System (Cardiovascular, Respiratory, etc.)
  - Color coded for each system
  - Percentage of total per system
  - Click section to drill down

- **Recent Questions List** - Shows 10 most recently created/edited questions:
  - Question ID
  - Subject
  - System
  - Status (Draft/Review/Published/Deprecated)
  - Author
  - Date created/modified
  - Edit button
  - Publish button (if in draft)

- **QBank Activity Chart** - Line graph showing:
  - X-axis: Time (daily over last 30 days)
  - Y-axis: Activity metric
  - Can toggle between:
    - Tests created
    - Questions answered
    - Student registrations
    - Revenue (if applicable)

- **System Breakdown Stats** - Table showing for each system:
  - System name
  - # Questions published
  - # Questions draft
  - # Questions in review
  - Average performance (student accuracy on questions)
  - Popularity (times used in tests)

- **Product Selection Dropdown** - If author manages multiple products:
  - Select which product to view dashboard for
  - All stats update based on selection
  - Persists selection in localStorage

### Why It Exists
- Gives authors bird's-eye view of their content performance
- Shows student engagement with their questions
- Identifies problem areas and success areas
- Motivates with growth metrics
- Helps prioritize content creation efforts
- Tracks quality through review/published rates

### How Navigation Works
- Author logs in → Redirect here
- Click product dropdown → Change product view
- Click recent question → Edit that question
- Click system in chart → See all questions in that system
- Use sidebar to navigate to other author pages

### Data Aggregation
```
Fetch:
- All questions for author's product(s)
- All tests for author's product(s)
- All user data
- Subscription status of all users

Calculate:
- Group questions by status (draft/review/published/deprecated)
- Group questions by system
- Count unique users
- Count paid vs free users
- Count tests per day
- Calculate average test duration
- Calculate performance stats per system
```

### State Management
```javascript
useState({
  stats: {
    totalQuestions: 0,
    publishedCount: 0,
    draftCount: 0,
    reviewCount: 0,
    totalUsers: 0,
    paidUsers: 0,
    dau: 0,
    totalTests: 0,
    avgSession: "0m 0s"
  },
  systemBreakdown: {}, // { systemName: count }
  systemData: [], // For charting
  qbankActivity: [], // Time series data
  recentQuestions: [], // Last 10
  isLoading: true
})
```

### Technical Details
- Uses Recharts for charting
- Real-time data aggregation from multiple sources
- Responsive grid layout for KPI cards
- Color-coded status indicators
- Product filtering with persistence
- Animated metric counters
- Trend indicators with percentage changes

---

## PAGE: /author/manage-questions (Question Bank Management)
**Route:** `/author/manage-questions`  
**File:** `src/app/author/manage-questions/page.jsx`  
**Authentication Required:** Yes (Authors)  
**Roles:** Authors

### Purpose
Comprehensive interface for authors to create, edit, delete, and manage all questions in their question bank.

### What It Does
- **Search & Filter Panel:**
  - Search by question stem (full text search)
  - Filter by System dropdown
  - Filter by Subject dropdown
  - Filter by Topic input
  - Filter by Status (Draft/Review/Published/Deprecated)
  - Filter by Product/Package
  - "Clear Filters" button
  - Real-time filtering as user types

- **Sorting Options:**
  - Sort by: Newest/Oldest
  - Sort by: Most Popular (used in tests)
  - Sort by: Highest Difficulty
  - Toggle view: Grid/List

- **Questions Table/Grid** - Shows paginated list of questions:
  - Question ID
  - Subject tag
  - System tag
  - Stem preview (first 100 characters)
  - Status badge (color-coded)
  - Author name
  - Created/Modified date
  - # of times used in tests
  - Governance status icon
  - Action buttons: Edit, Preview, Delete

- **Question Preview Modal** - Click "Preview" to see:
  - Full question stem
  - Question image(s)
  - All answer choices (A, B, C, D, E)
  - Correct answer (marked)
  - Explanation
  - Metadata (system, subject, difficulty, etc.)
  - Edit button
  - Governance history tab

- **Publication Timeline** - Special tab in preview showing:
  - Creation date
  - Publication date
  - Deprecation date (if applicable)
  - Modification history
  - Complete audit trail

- **Bulk Actions:**
  - Checkbox to select multiple questions
  - "Select All" checkbox
  - Bulk action dropdown:
    - Delete selected
    - Change status (publish/unpublish)
    - Assign to system
    - Add tags
    - Export selected
  - Confirmation dialog before bulk delete

- **Import/Export:**
  - "Import Questions" button → Opens file dialog
  - Supports CSV or JSON format
  - Shows import summary: # new, # updated
  - "Export" button → Downloads all/selected as JSON
  - Export format includes all metadata

- **Create Question Button** - "+" or "Create New" button:
  - Routes to `/author/create-question`
  - Opens question editor

- **Pagination:**
  - Shows 20 questions per page
  - Page navigation: First/Previous/Next/Last
  - Jump to page input
  - Shows "Showing X-Y of Z questions"

### Why It Exists
- Central hub for content management
- Allows bulk operations on questions
- Enables discovery and organization of questions
- Provides full lifecycle management
- Shows question performance metrics
- Tracks governance/approval history

### How Navigation Works
- From sidebar → Click "Manage Questions"
- Click "Create Question" → Go to `/author/create-question`
- Click "Edit" on question → Go to `/author/create-question?id=X`
- Click "Preview" → Open modal with full details
- Bulk select and delete → Confirm deletion
- Import file → Shows results
- Export → Downloads file

### Data Structure
```javascript
question = {
  id: "q-001",
  packageId: "14",
  stem: "Question text here",
  stemImage: { url: "", size: "medium" },
  choices: [
    { label: "A", text: "Choice A", image: null },
    { label: "B", text: "Choice B", image: null },
    { label: "C", text: "Choice C", image: null },
    { label: "D", text: "Choice D", image: null },
    { label: "E", text: "Choice E", image: null }
  ],
  correct: 2, // Index of correct choice (C)
  subject: "Anatomy",
  system: "Cardiovascular",
  topic: "ECG interpretation",
  difficulty: "medium",
  cognitiveLevel: "analysis",
  explanation: "Full explanation text",
  explanationCorrect: "Why C is correct",
  explanationWrong: "Why others are wrong",
  type: "multiple_choice",
  status: "published", // draft/review/published/deprecated
  published: 1, // boolean flag
  createdAt: "2026-01-15T10:30:00Z",
  updatedAt: "2026-01-25T14:20:00Z",
  createdBy: "author-001",
  totalAttempts: 245,
  correctAttempts: 189,
  difficulty: "medium",
  versionNumber: 2,
  isLatest: 1
}
```

### Filtering Logic
```javascript
// Filter combines all criteria (AND logic)
filteredQuestions = questions.filter(q => {
  let matches = true;
  
  if (filterSystem && q.system !== filterSystem) matches = false;
  if (filterSubject && q.subject !== filterSubject) matches = false;
  if (filterTopic && !q.topic.toLowerCase().includes(filterTopic)) matches = false;
  if (filterStem && !q.stem.toLowerCase().includes(filterStem)) matches = false;
  if (packageFilter && q.packageId !== packageFilter) matches = false;
  
  return matches;
});

// Sort
sortedQuestions = [...filteredQuestions].sort((a, b) => {
  if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
  if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
  // ... other sorts
});

// Paginate
paginated = sortedQuestions.slice(
  (currentPage - 1) * pageSize,
  currentPage * pageSize
);
```

### Technical Details
- Real-time search debouncing
- Infinite scroll or pagination
- Bulk operations with confirmation
- CSV/JSON import-export
- Modal preview with tabs
- Governance timeline visualization
- Responsive table design
- Performance optimization for large datasets

---

## PAGE: /author/create-question (Question Editor)
**Route:** `/author/create-question` or `/author/create-question?id=X`  
**File:** `src/app/author/create-question/page.jsx`  
**Authentication Required:** Yes (Authors)  
**Roles:** Authors

### Purpose
Full-featured question creation and editing interface where authors write medical questions.

### What It Does
- **Two-Column Layout:**
  - **Left Column (Metadata Panel):**
    - Question subject dropdown
    - Question system dropdown
    - Question topic input
    - Difficulty selector (Easy/Medium/Hard)
    - Cognitive level selector (Remember/Understand/Apply/Analyze/Evaluate)
    - Question type (Multiple Choice, etc.)
    - Package/Product selector
    - Status (Draft/Ready for Review)
    - Action buttons: Save, Submit for Review, Publish, Delete

  - **Right Column (Question Content):**
    - Stem editor (large text area)
    - Stem image upload/preview
    - Choice editors (A-B-C-D-E):
      - Text input for each choice
      - Image upload per choice
      - Radio button to select correct answer
    - Explanation editor
    - Explanation image upload
    - Additional fields: Tags, References, Learning objectives

- **Stem Editor:**
  - Rich text editor (possibly WYSIWYG)
  - Can include formatting (bold, italic, lists)
  - Character count
  - Preview
  - Image upload with size options (small/medium/large)

- **Choice Editor:**
  - A, B, C, D, E text inputs
  - Each choice can have optional image
  - Radio buttons to select correct answer
  - Drag to reorder choices (optional)
  - Show/hide individual choice images

- **Explanation Editor:**
  - "Explanation" tab for general info
  - "Why Correct" tab explaining correct answer
  - "Why Wrong" tab explaining why others are wrong
  - Rich text formatting
  - Image support in explanations
  - Character count

- **Auto-Save:**
  - Saves draft every 30 seconds
  - Shows "Saving..." indicator
  - Shows last saved timestamp
  - Prevents loss of work

- **Form Validation:**
  - Stem required
  - All 5 choices required
  - One correct answer required
  - Explanation required
  - Subject and system required
  - Error messages for missing fields
  - Cannot submit with errors

- **Workflow Actions:**
  - **Save** - Saves as draft (status = draft)
  - **Publish** - Changes to "published" (live for students)
  - **Deprecate** - Removes from circulation but keeps in history
  - **Revise** - Changes published question to draft for editing
  - **Delete** - Removes draft questions only

- **History/Versioning:**
  - Shows version number
  - Shows edit history
  - Can revert to previous version
  - Shows who made each edit and when

- **Related Questions:**
  - Suggests similar questions
  - Shows linking between related concepts
  - Can mark questions as variants of others

### Why It Exists
- Primary content creation tool
- Authors need comprehensive editing interface
- Multi-step content creation process
- Enforces quality standards through workflow
- Tracks question lifecycle
- Prevents losing work with auto-save

### How Navigation Works
- From manage-questions → Click "Create" → Come here (new)
- From manage-questions → Click "Edit" → Come here (with id parameter)
- Click "Save" → Save as draft, stay on page
- Click "Submit for Review" → Goes to review queue, stays on page
- Click "Delete" → Delete draft, redirect to manage-questions

### Data Flow
```
Load Page:
  If id parameter:
    - Fetch existing question
    - Populate all fields
    - Mark as editing
  Else:
    - Show empty form
    - Mark as creating new

While Editing:
  - Every 30 seconds: Auto-save to database
  - Show "Saving..." indicator
  - Show last saved time

User Actions:
  - Type in fields
  - Upload images
  - Select correct answer (radio)
  - Select status/metadata
  
  On Click Save:
    - Validate all required fields
    - If valid:
      - Save to database
      - Show success message
      - Keep on page for continued editing
    - If invalid:
      - Show error messages
      - Don't save

  On Click Publish:
    - Validate all required fields
    - If valid:
      - Save to database
      - Change status to "published"
      - Make available for student tests
      - Redirect to manage-questions
    - If invalid:
      - Show error messages
```

### State Management
```javascript
const [question, setQuestion] = useState({
  id: null,
  stem: "",
  stemImage: { url: "", size: "medium" },
  choices: ["", "", "", "", ""],
  choiceImages: [{}, {}, {}, {}, {}],
  correct: null, // Index of correct answer
  subject: "",
  system: "",
  topic: "",
  difficulty: "medium",
  cognitiveLevel: "understanding",
  type: "multiple_choice",
  explanation: "",
  explanationCorrect: "",
  explanationWrong: "",
  status: "draft"
});

const [unsavedChanges, setUnsavedChanges] = useState(false);
const [isSaving, setIsSaving] = useState(false);
const [saveSuccess, setSaveSuccess] = useState(false);
const [errors, setErrors] = useState({});
```

### Validation Rules
```javascript
const validateQuestion = (q) => {
  const errors = {};
  
  if (!q.stem.trim()) errors.stem = "Stem required";
  if (!q.subject) errors.subject = "Subject required";
  if (!q.system) errors.system = "System required";
  if (q.correct === null) errors.correct = "Must select correct answer";
  if (q.choices.some(c => !c.trim())) errors.choices = "All choices required";
  if (!q.explanation.trim()) errors.explanation = "Explanation required";
  
  return errors;
};
```

### Technical Details
- Rich text editor (likely Draft.js or Slate)
- Image upload and preview
- Auto-save with debouncing
- Keyboard shortcuts (Ctrl+S to save)
- Unsaved changes warning on navigation
- Responsive two-column layout
- Form validation with error display
- Version history management
- Workflow state transitions

---

## PAGE: /author/manage-products (Product Management)
**Route:** `/author/manage-products`  
**File:** `src/app/author/manage-products/page.jsx`  
**Authentication Required:** Yes (Authors)  
**Roles:** Authors

### Purpose
View product information and statistics for products the author manages.

### What It Does
- **Products List** - Shows all products managed by author:
  - Product name
  - Description
  - # Questions in product
  - # Active subscriptions
  - View details button

- **Product Statistics:**
  - Subscriber count
  - Popular questions
  - Student engagement metrics

---

## PAGE: /author/users (Student/User Insights)
**Route:** `/author/users`  
**File:** `src/app/author/users/page.jsx`  
**Authentication Required:** Yes (Authors)  
**Roles:** Authors

### Purpose
View student accounts that have purchased access to author's products.

### What It Does
- **Users List Table:**
  - User name
  - Email
  - Subscription status
  - Subscription expiry
  - # Tests taken
  - Last active date

- **User Details View:**
  - Profile information
  - Subscription status
  - Test performance summary
  - Engagement metrics

- **Filtering:**
  - Filter by status (active/expired)
  - Filter by subscription type
  - Filter by registration date

---

## PAGE: /author/activity (Activity & Engagement Analytics)
**Route:** `/author/activity`  
**File:** `src/app/author/activity/page.jsx`  
**Authentication Required:** Yes (Authors)  
**Roles:** Authors

### Purpose
View detailed analytics about how students use the author's questions.

### What It Does
- **Activity Analytics:**
  - Student test creation patterns
  - Student test completion metrics
  - Questions used most frequently in tests
  - Most popular questions

- **Performance Analytics:**
  - Questions with highest student success rate
  - Questions with lowest success rate
  - Average time spent per question
  - Most skipped questions
  - Most flagged questions for review

- **Engagement Metrics:**
  - Active students count
  - Test completion rate
  - Average student accuracy
  - Feature usage patterns (tutor vs exam mode)

---

## PAGE: /author/tools (Author Tools & Utilities)
**Route:** `/author/tools`  
**File:** `src/app/author/tools/page.jsx`  
**Authentication Required:** Yes (Authors)  
**Roles:** Authors

### Purpose
Specialized tools for content management and analysis.

### What It Does
- **Bulk Question Operations:**
  - Update multiple questions' systems/subjects
  - Change difficulty for groups
  - Add tags to multiple questions
  - Update explanations in bulk

- **Content Analysis Tools:**
  - Find duplicate questions
  - Identify poorly performing questions
  - Analyze content gaps by system/subject
  - Search for related concepts

- **Reporting Tools:**
  - Export question data
  - Generate performance reports
  - Analytics exports

---

## PAGE: /author/settings (Author Settings)
**Route:** `/author/settings`  
**File:** `src/app/author/settings/page.jsx`  
**Authentication Required:** Yes (Authors)  
**Roles:** Authors

### Purpose
Author account and portal settings.

### What It Does
- **Account Settings:**
  - Change password
  - Update profile (name, email, bio)
  - Profile picture upload

- **Notification Preferences:**
  - Email notifications for question reviews
  - Notification for user activity
  - Summary frequency

- **Portal Settings:**
  - Default product selection
  - Default view preferences (list/grid)
  - Pagination size preferences

- **API Keys** (if applicable):
  - Generate/revoke API keys
  - API documentation link

---

# API ENDPOINTS & BACKEND ROUTES

---

## Authentication APIs

### GET /api/auth/login
- **Purpose:** Health check for login route
- **Output:** { ok: true }
- **Runtime:** Node.js (forced for crypto compatibility)

### POST /api/auth/login
- **Purpose:** Student/Author login
- **Input:** { email, password }
- **Output:** User object (without passwordHash)
- **Error Handling:** JSON responses with stack traces in development
- **Runtime:** Node.js

### POST /api/auth/register
- **Purpose:** Create new user account
- **Input:** { name, email, password, role }
- **Output:** Created user object
- **Runtime:** Node.js

---

## Product APIs

### GET /api/products
- **Purpose:** Get all products or filter by type
- **Query:** ?type=published for published only
- **Output:** Array of product objects

### GET /api/products?id=X
- **Purpose:** Get specific product details
- **Output:** Single product object

### GET /api/products/published
- **Purpose:** Get published products only (standardized route)
- **Output:** { products: [...] }

### POST /api/products (Author only)
- **Purpose:** Create new product
- **Input:** Product data (is_published forced to 1)
- **Output:** Created product object

### PUT /api/products (Author only)
- **Purpose:** Update product
- **Input:** Updated product data
- **Output:** Updated product object

### DELETE /api/products (Author only)
- **Purpose:** Delete product
- **Input:** { id }
- **Output:** { success: true }

---

## Question APIs

### GET /api/questions?packageId=X&includeUnpublished=true/false
- **Purpose:** Get all questions for a product
- **Output:** Array of question objects
- **Filters:** packageId, includeUnpublished

### GET /api/questions/[id]
- **Purpose:** Get specific question details
- **Output:** Single question object

### GET /api/questions/user?userId=X&packageId=Y&includeUnpublished=false
- **Purpose:** Get user's progress on all questions
- **Output:** { questions: [...] } (standardized)

### GET /api/questions/user-sandbox?userId=X&packageId=Y
- **Purpose:** Sandbox version for testing
- **Output:** Array of questions with user progress

### POST /api/questions (Author)
- **Purpose:** Create new question
- **Input:** Full question object with concept linking
- **Output:** Created question object

### PUT /api/questions/[id] (Author)
- **Purpose:** Update question
- **Input:** Updated question data
- **Output:** Updated question object

### DELETE /api/questions/[id] (Author)
- **Purpose:** Delete draft question
- **Output:** Confirmation

### PUT /api/questions/user
- **Purpose:** Update user's answer to a question
- **Input:** { userId, questionId, selectedAnswer, isMarked }
- **Output:** Confirmation
- **Note:** Does not pass status to server (calculated server-side)

### PUT /api/questions/user-sandbox
- **Purpose:** Update user answer in sandbox
- **Input:** Same as user route
- **Output:** Confirmation

### DELETE /api/questions/user
- **Purpose:** Reset all user question progress
- **Input:** { userId }
- **Output:** Confirmation

---

## Test APIs

### GET /api/tests?userId=X&packageId=Y
- **Purpose:** Get all tests for user
- **Output:** Array of test objects

### GET /api/tests/[id]
- **Purpose:** Get specific test details
- **Output:** { test: {...} } (standardized)

### POST /api/tests
- **Purpose:** Create and save new test with assembly engine
- **Input:** { userId, packageId, poolLogic, count, mode }
- **Output:** Saved test with assembled questions
- **Features:** Server-side question assembly, pool sizing, eligibility calculation

### POST /api/tests/pool
- **Purpose:** Calculate pool sizing before test creation
- **Input:** { userId, packageId, filters }
- **Output:** { universeSize, eligiblePoolSize, pool }

### DELETE /api/tests
- **Purpose:** Delete test or clear all user tests
- **Input:** { testId } or { userId, clearAll: true }
- **Output:** { success: true }

---

## User APIs

### GET /api/users?id=X
- **Purpose:** Get user profile
- **Output:** User object (without passwordHash)

### GET /api/users (Admin only)
- **Purpose:** Get all users
- **Output:** Array of user objects (passwordHash stripped)

### PUT /api/users
- **Purpose:** Update user profile
- **Input:** Updated user data
- **Output:** Updated user object
- **Features:** Purchase activation detection, notification creation

### DELETE /api/users (Not implemented)
- **Purpose:** Delete user
- **Status:** 501 Not Implemented

---

## Subscription APIs

### GET /api/users/subscriptions?userId=X
- **Purpose:** Get user subscriptions
- **Output:** { subscriptions: [...] } (standardized)

### POST /api/users/subscriptions
- **Purpose:** Create new subscription
- **Input:** { userId, productId, durationDays, productName, amount }
- **Output:** Created subscription object with purchaseDate

---

## Analytics APIs

### GET /api/analytics/dashboard?productId=X
- **Purpose:** Get dashboard statistics for authors
- **Output:** Stats object with KPIs, engagement data

### GET /api/analytics/engagement?productId=X
- **Purpose:** Get engagement chart data
- **Output:** Array of engagement metrics over time

### GET /api/analytics/student-cognition?userId=X
- **Purpose:** Get student cognitive metrics
- **Output:** Behavioral analysis metrics

---

## Notification APIs

### GET /api/notifications
- **Purpose:** Get system notifications
- **Output:** Array of notification objects

### POST /api/notifications
- **Purpose:** Create system notification
- **Input:** { type, message, userId, metadata }
- **Output:** Created notification

---

## Author Portal APIs

### GET /api/author-portal/stats?productId=X
- **Purpose:** Author-specific statistics
- **Output:** Dashboard stats for author

### GET /api/author-portal/forensics?productId=X
- **Purpose:** Forensic analysis data
- **Output:** Behavioral forensics metrics

---

## API Standardization Notes

- **Response Format:** All standardized routes return objects with keys (e.g., `{ questions: [...] }`)
- **Error Handling:** Consistent JSON error responses with stack traces in development
- **Runtime:** Auth routes forced to Node.js runtime for crypto compatibility
- **CORS:** All API routes excluded from middleware redirects
- **Validation:** Input validation with meaningful error messages
- **Security:** Password hashing, role-based access control, SQL injection prevention

---

# COMPONENT ARCHITECTURE

---

## Core Application Components

### AppProvider (Context Provider)
- **Location:** `src/context/AppContext.js`
- **Purpose:** Global state management for theme, cart, product context
- **State:** Theme, sidebar, cart, selected products (author/student)
- **Used in:** Root layout (`src/app/layout.jsx`)

### ThemeWrapper
- **Location:** `src/components/ThemeWrapper.jsx`
- **Purpose:** Theme switching (light/dark mode) with CSS variables
- **Features:** Persistent theme preference, smooth transitions
- **Used in:** Root layout wrapping entire app

---

## Authentication Components

### AuthComponent
- **Location:** `src/app/auth/AuthComponent.jsx`
- **Purpose:** Unified login/register interface with tabs
- **Features:** Form validation, error handling, role-based redirects
- **Used in:** `/auth` page

### AuthorLoginComponent
- **Location:** `src/app/author/login/AuthorLoginComponent.jsx`
- **Purpose:** Dedicated author login with enhanced security messaging
- **Features:** Role verification, author-specific branding
- **Used in:** `/author/login` page

---

## Student Dashboard Components

### StudentLayout
- **Location:** `src/app/student/(dashboard)/layout.jsx`
- **Purpose:** Dashboard layout with sidebar navigation
- **Features:** Product context, navigation state, responsive sidebar

### Sidebar
- **Location:** `src/components/student/layout/Sidebar.jsx`
- **Purpose:** Main navigation for student dashboard
- **Features:** Collapsible sections, active state indicators, product switching

### CartDropdown
- **Location:** `src/components/student/layout/CartDropdown.jsx`
- **Purpose:** Shopping cart preview and management
- **Features:** Item list, quantity controls, checkout button, animations
- **Used in:** Header navigation across all pages

---

## Exam Engine Components

### useExamEngine (Hook)
- **Location:** `src/hooks/exam/useExamEngine.js`
- **Purpose:** Core exam state management and logic
- **Features:** Timer, answer tracking, review mode, forensic logging
- **State:** Questions, answers, timing, marks, session logs

### ExamHeader
- **Location:** `src/components/student/exam/ExamHeader.jsx`
- **Purpose:** Test header with timer, navigation, and controls
- **Features:** Question counter, timer, mark button, settings menu

### QuestionNavigator
- **Location:** `src/components/student/exam/QuestionNavigator.jsx`
- **Purpose:** Grid navigation for jumping between questions
- **Features:** Color-coded status, marked indicators, progress visualization

### RationalesPanel
- **Location:** `src/components/student/exam/RationalesPanel.jsx`
- **Purpose:** Explanation display in tutor mode
- **Features:** Correct answer explanation, wrong answer explanations, learning points

---

## Author Dashboard Components

### AuthorLayout
- **Location:** `src/app/author/layout.jsx`
- **Purpose:** Author portal layout with navigation
- **Features:** Product context, author-specific navigation, theme

### KPICard
- **Location:** `src/components/author/KPICard.jsx`
- **Purpose:** Display key performance indicators with trends
- **Features:** Metric value, trend indicator, sparkline chart

### QuickInsights
- **Location:** `src/components/author/QuickInsights.jsx`
- **Purpose:** Summary analytics widget
- **Features:** Engagement metrics, performance highlights

### DashboardCharts
- **Location:** `src/components/author/DashboardCharts.jsx`
- **Purpose:** Charting and analytics visualization
- **Features:** Line charts, pie charts, bar charts using Recharts

### BottomStats
- **Location:** `src/components/author/BottomStats.jsx`
- **Purpose:** Detailed statistics table
- **Features:** Sortable columns, filtering, pagination

---

## UI Components

### ThemeWrapper
- **Location:** `src/components/ThemeWrapper.jsx`
- **Purpose:** Theme provider with CSS custom properties
- **Features:** Dark/light mode, system preference detection

### LoadingStates
- **Location:** Various components
- **Purpose:** Skeleton loaders and spinners
- **Features:** Consistent loading experience across app

### Modal Components
- **Location:** `src/components/ui/`
- **Purpose:** Reusable modal dialogs
- **Features:** Backdrop, close on escape, customizable content

---

## Service Layer Components

### API Services
- **Location:** `src/services/`
- **Files:** `user.service.js`, `question.service.js`, `test.service.js`, `product.service.js`, `analytics.service.js`
- **Purpose:** Client-side API integration
- **Features:** Request/response handling, error management, data transformation

### Auth Logic
- **Location:** `src/auth/auth.logic.js`
- **Purpose:** Authentication business logic
- **Features:** Login, register, password change, logout

---

## Database Layer Components

### Server Database
- **Location:** `src/lib/server-db.js`
- **Purpose:** Server-side SQLite operations
- **Features:** CRUD operations, business logic, data aggregation

### Client Database
- **Location:** `src/lib/db.js`
- **Purpose:** Client-side IndexedDB operations
- **Features:** Offline storage, sync with server, schema management

### Cognition Engine
- **Location:** `src/lib/cognition-engine.js`
- **Purpose:** Behavioral analytics calculations
- **Features:** Engagement metrics, readiness scoring, behavioral markers

---

## Utility Components

### Form Components
- **Location:** Throughout app
- **Purpose:** Reusable form inputs with validation
- **Features:** Error states, labels, helper text

### Chart Components
- **Location:** `src/components/ui/`
- **Purpose:** Reusable chart wrappers
- **Library:** Recharts with custom styling

### Icon Components
- **Location:** Throughout app
- **Library:** Lucide React
- **Purpose:** Consistent iconography

---

## Component Patterns

### Higher-Order Components
- **withAuth:** Authentication wrapper
- **withRole:** Role-based access control
- **withProduct:** Product context injection

### Custom Hooks
- **useExamEngine:** Exam state management
- **useProduct:** Product selection and switching
- **useCart:** Shopping cart operations
- **useTheme:** Theme switching

### Context Providers
- **AppContext:** Global application state
- **ExamContext:** Exam session state
- **ProductContext:** Product-specific state

### Data Flow Patterns
1. **Component → Service → API → Server**
2. **Component → Hook → Context → Component**
3. **Component → Local State → API → Update State**

---

## Performance Optimizations

### Code Splitting
- Route-based splitting with Next.js
- Lazy loading of heavy components
- Dynamic imports for large libraries

### Memoization
- React.memo for expensive components
- useMemo for calculations
- useCallback for event handlers

### State Management
- Local state for UI concerns
- Context for global state
- Server state via API calls

### Rendering Optimizations
- Virtual scrolling for large lists
- Debounced search inputs
- Throttled scroll handlers

---

# DATABASE & DATA MODELS

---

## Database Architecture

**Database Engine:** SQLite with better-sqlite3  
**Mode:** WAL (Write-Ahead Logging) for concurrent access  
**Foreign Keys:** Enabled for referential integrity  
**File Location:** Project root as `medbank.db`  

---

## Core Tables

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  role TEXT DEFAULT 'student', -- 'student', 'author', 'admin'
  subscriptionStatus TEXT DEFAULT 'trial', -- 'trial', 'active', 'expired'
  purchased INTEGER DEFAULT 0,
  activatedByPurchase INTEGER DEFAULT 0,
  hasPendingPurchase INTEGER DEFAULT 0,
  trialUsed INTEGER DEFAULT 0,
  activatedAt TEXT,
  expiresAt TEXT,
  lastRenewedAt TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT,
  isBanned INTEGER DEFAULT 0,
  stats TEXT DEFAULT '{"attempted":0,"correct":0,"tests":0}',
  subscriptionDuration INTEGER DEFAULT 3,
  productName TEXT
);
```

### Products Table
```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  color TEXT,
  price REAL,
  duration INTEGER, -- days
  features TEXT, -- JSON array
  is_published INTEGER DEFAULT 1,
  createdAt TEXT,
  updatedAt TEXT
);
```

### Questions Table
```sql
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  packageId TEXT, -- Links to products table
  stem TEXT NOT NULL,
  stemImage JSON, -- { url, size }
  choices JSON, -- Array of choice objects
  correct INTEGER, -- Index of correct choice (0-4)
  explanation TEXT,
  explanationCorrect TEXT,
  explanationWrong TEXT,
  summary TEXT,
  summaryImage JSON,
  system TEXT, -- e.g., 'Cardiovascular'
  subject TEXT, -- e.g., 'Anatomy'
  topic TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'published', 'deprecated'
  published INTEGER DEFAULT 0,
  versionNumber INTEGER DEFAULT 1,
  isLatest INTEGER DEFAULT 1,
  stemImageMode TEXT,
  explanationImageMode TEXT,
  references TEXT, -- JSON
  tags TEXT, -- JSON array
  conceptId TEXT,
  createdAt TEXT,
  updatedAt TEXT
);
```

### Question Concepts Table
```sql
CREATE TABLE question_concepts (
  id TEXT PRIMARY KEY,
  packageId TEXT,
  system TEXT,
  subject TEXT,
  topic TEXT,
  tags TEXT, -- JSON
  createdAt TEXT
);
```

### User Questions Progress Table
```sql
CREATE TABLE user_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT,
  questionId TEXT,
  packageId TEXT,
  status TEXT, -- 'correct', 'incorrect', 'omitted', NULL (unused)
  userAnswer TEXT, -- JSON: { selectedAnswer, isMarked, ... }
  totalAttempts INTEGER DEFAULT 0,
  timeSpent REAL DEFAULT 0,
  lastSeenAt TEXT,
  updatedAt TEXT,
  UNIQUE(userId, questionId, packageId)
);
```

### Tests Table
```sql
CREATE TABLE tests (
  id TEXT PRIMARY KEY,
  userId TEXT,
  packageId TEXT,
  questions JSON, -- Snapshot of questions or IDs
  answers JSON, -- { questionId: answerIndex }
  firstAnswers JSON, -- { questionId: firstAnswerIndex }
  mode TEXT, -- 'tutor', 'exam'
  elapsedTime REAL,
  date TEXT,
  isSuspended INTEGER DEFAULT 0,
  pool TEXT, -- Description of question pool
  markedIds JSON, -- Array of marked question IDs
  universeSize INTEGER,
  eligiblePoolSize INTEGER,
  poolLogic JSON, -- Filter criteria used
  sessionState JSON, -- { logs: [...], answerHistory: [...], ... }
  createdAt TEXT
);
```

### Student Answers Table (Granular)
```sql
CREATE TABLE student_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT,
  testId TEXT,
  questionId TEXT,
  packageId TEXT,
  selectedAnswer INTEGER,
  isCorrect INTEGER,
  timeSpent REAL,
  timestamp TEXT,
  isMarked INTEGER DEFAULT 0
);
```

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  userId TEXT,
  packageId TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'expired', 'canceled'
  purchaseDate TEXT,
  expiresAt TEXT,
  durationDays INTEGER,
  amount REAL,
  productName TEXT,
  createdAt TEXT
);
```

### Subscription Packages Table
```sql
CREATE TABLE subscription_packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  price REAL NOT NULL,
  description TEXT,
  createdAt TEXT
);
```

### Notifications Table
```sql
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  type TEXT, -- 'purchase', 'system', 'alert'
  message TEXT,
  userId TEXT, -- NULL for system-wide
  metadata TEXT, -- JSON
  createdAt TEXT,
  read INTEGER DEFAULT 0
);
```

---

## Database Relationships

```
users (1) → (many) subscriptions
users (1) → (many) tests
users (1) → (many) user_questions
users (1) → (many) student_answers

products (1) → (many) questions
products (1) → (many) subscriptions
products (1) → (many) tests

questions (1) → (many) user_questions
questions (1) → (many) student_answers
questions (1) → (1) question_concepts

tests (1) → (many) student_answers
```

---

## Data Flow Patterns

### Question Progress Tracking
1. Student attempts question → user_questions record created/updated
2. Status determined by comparing answer to correct answer
3. Time spent accumulated
4. Marking flag stored separately from status

### Test Session Management
1. Test created with question snapshot → tests table
2. Each answer recorded → student_answers table
3. Session logs stored in tests.sessionState JSON
4. Suspension/resume handled via isSuspended flag

### Subscription Lifecycle
1. Purchase creates subscription record
2. expiresAt calculated from purchaseDate + durationDays
3. User access validated against active subscriptions
4. Notifications created for purchase events

### Content Governance
1. Questions start as draft (status='draft')
2. Author publishes → status='published', published=1
3. Deprecation removes from circulation but preserves history
4. Version tracking via versionNumber and isLatest

---

## Performance Optimizations

- **Indexes:** Created on frequently queried fields (userId, packageId, status)
- **WAL Mode:** Allows concurrent reads during writes
- **JSON Storage:** Flexible schema for complex data (choices, sessionState)
- **Snapshotting:** Tests store question snapshots to ensure immutability
- **Connection Pooling:** Single database instance reused across requests

---

## Data Integrity Constraints

- **Foreign Keys:** Enforced for relationships (users→subscriptions, etc.)
- **Unique Constraints:** Prevent duplicate user-question progress records
- **Default Values:** Sensible defaults for status flags and timestamps
- **Check Constraints:** Role values limited to valid options
- **Cascade Deletes:** Handled at application level for safety

---

# USER FLOWS & NAVIGATION

---

## New Student Journey
```
Landing Page (/)
    ↓
Click "Explore Products"
    ↓
Products Catalog (/products)
    ↓
Click "Learn More" on product
    ↓
Product Details (/products/[id])
    ↓
Click "Add to Cart" → Add to shopping cart
    ↓
Checkout (/checkout)
    ↓
Click "Complete Purchase"
    ↓
Payment Processing
    ↓
Success → Redirect to Student Portal (/student/portal)
    ↓
Student Portal - can now see active subscription
    ↓
Click "View Dashboard" or navigate to /student/dashboard
    ↓
Student Dashboard - First time, create first test
    ↓
Create Test (/student/qbank/create-test)
    ↓
Select filters, start test
    ↓
Take Test (/student/qbank/take-test)
    ↓
Answer questions in test mode
    ↓
End/Submit Test
    ↓
Test Summary (/student/qbank/test-summary)
    ↓
View results and performance
```

## Returning Student Flow
```
Student visits site
    ↓
Navigate to /student/dashboard (redirects to login if not authenticated)
    ↓
AuthComponent - Login with email/password
    ↓
Dashboard loads with stats and suspended tests
    ↓
Option 1: Create New Test → Test Builder → Test Engine
    ↓
Option 2: View Performance Analytics
    ↓
Option 3: Resume Suspended Test
    ↓
Option 4: View Test History
    ↓
Option 5: Manage Account (at /student/portal)
```

## Author Content Creation Flow
```
Author logs in to /author/login
    ↓
Author Dashboard (/author)
    ↓
Click "Manage Questions"
    ↓
Question Management (/author/manage-questions)
    ↓
Click "Create Question"
    ↓
Question Editor (/author/create-question)
    ↓
Fill out all fields:
  - Stem and image
  - Choices A-E
  - Correct answer
  - Explanation
  - Metadata (system, subject, difficulty)
    ↓
Click "Save" (Auto-saves every 30 sec)
    ↓
Click "Submit for Review"
    ↓
Redirected back to management
    ↓
Admin reviews in review queue
    ↓
Admin publishes → Question goes live
    ↓
Students can now see in their test builders
```

## Question Lifecycle
```
DRAFT
  (Author creating/editing)
  ↓
PUBLISHED
  (Available in test builder)
  (Collecting student performance data)
  ↓
DEPRECATED
  (Removed from circulation but kept in history)
  ↓
DELETED
  (Only if draft - cannot delete published)
```

---

## Technical Architecture Summary

### Frontend Stack
- **Framework:** Next.js 16.1.1 (App Router)
- **Language:** JavaScript/JSX
- **Styling:** Tailwind CSS v4 with custom design system
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Charts:** Recharts
- **State:** React Context + localStorage
- **Routing:** Next.js App Router with dynamic routes

### Backend Stack
- **Runtime:** Node.js (forced for auth routes)
- **Database:** SQLite with better-sqlite3
- **API:** RESTful with standardized JSON responses
- **Authentication:** Role-based with password hashing
- **File Storage:** Local filesystem with WAL mode

### Development Tools
- **Package Manager:** npm
- **Linting:** ESLint with Next.js config
- **Build:** Next.js build system
- **Dev Server:** Next.js dev with Webpack

### Key Architectural Decisions
1. **SQLite over PostgreSQL:** Simpler deployment, sufficient for current scale
2. **App Router over Pages Router:** Latest Next.js features, better layouts
3. **Context over Redux:** Simpler state management for current needs
4. **Server Components:** Used where appropriate for performance
5. **Standardized API Responses:** Consistent `{ key: value }` format
6. **Role-Based Access:** Clean separation between student/author features

### Performance Considerations
- **Database:** WAL mode for concurrent access
- **API:** Response standardization reduces client parsing
- **Frontend:** Code splitting, memoization, lazy loading
- **Images:** Lazy loading with size options
- **State:** Minimal re-renders with careful context usage

### Security Features
- **Authentication:** SHA-256 password hashing
- **Authorization:** Role-based access control
- **API:** Input validation, SQL injection prevention
- **Data:** PasswordHash stripped from responses
- **Sessions:** localStorage with userId tracking

### Scalability Points
- **Database:** Can migrate to PostgreSQL without API changes
- **File Storage:** Can move to S3 with minimal changes
- **Auth:** Can integrate with OAuth providers
- **Analytics:** Can add external analytics services
- **Payments:** Stripe integration ready

---

This comprehensive documentation covers all aspects of the IskyMD platform including every major page, component, API, database model, and user flow. The application is a sophisticated medical education platform with dual-role support, comprehensive analytics, and a full-featured test engine for medical exam preparation.

**Current Status:** Production-ready with active development on advanced analytics and content management features. The platform successfully handles multi-product question banks, real-time exam sessions, and detailed behavioral tracking for medical education.

**Last Updated:** February 3, 2026  
**Maintained by:** IskyMD Development Team

