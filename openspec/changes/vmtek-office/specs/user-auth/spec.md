## Purpose

Enables the single admin user of VMWTEK Office to authenticate with email and password, maintain a persistent session, and access protected pages. This capability is the security boundary for the entire application.

## ADDED Requirements

### Requirement: Admin login with credentials
The system SHALL allow the admin user to authenticate with email and password. The initial admin account SHALL be created from environment configuration on first setup. Passwords SHALL be stored hashed with a strong one-way algorithm (bcrypt).

#### Scenario: Successful login
- **WHEN** the admin submits a valid email and password on the login page
- **THEN** the system creates a session and redirects to the dashboard

#### Scenario: Invalid credentials
- **WHEN** the admin submits an unknown email or wrong password
- **THEN** the system shows a generic "invalid credentials" error and does not create a session

#### Scenario: First admin is seeded
- **WHEN** the system runs its seed step with `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables set
- **THEN** an admin user with the hashed password is created and can log in

### Requirement: Session persistence
The system SHALL maintain the admin's session across page requests and browser restarts until it expires or is signed out.

#### Scenario: Session survives page navigation
- **WHEN** the admin logs in and then navigates between pages
- **THEN** the admin remains authenticated on every page

#### Scenario: Explicit sign out
- **WHEN** the admin clicks "Sign out"
- **THEN** the session is destroyed and the admin is redirected to the login page

### Requirement: Route protection
The system SHALL require an active session for every page except the login page. Unauthenticated requests SHALL be redirected to the login page.

#### Scenario: Unauthenticated user hits a protected page
- **WHEN** an unauthenticated visitor requests any page other than `/login`
- **THEN** the system redirects the visitor to the login page

#### Scenario: Authenticated user hits the login page
- **WHEN** an authenticated user requests `/login`
- **THEN** the system redirects the user to the dashboard
