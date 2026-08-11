## Purpose

Provides the landing page of the app: a dashboard aggregating today's reminders, pending payments, active projects, open negotiations, a monthly money overview, and pending tasks, each linking to its full page.

## ADDED Requirements

### Requirement: Dashboard widgets
The system SHALL display six widgets on the dashboard: reminders due today and overdue, pending and partial payments, active projects, open negotiations with pipeline value, a monthly money overview (received payments vs. expenses per currency), and pending tasks.

#### Scenario: View dashboard
- **WHEN** the admin opens the dashboard
- **THEN** the system shows all six widgets with current data

#### Scenario: Widget links to full page
- **WHEN** the admin clicks a widget heading or its "view all" link
- **THEN** the system navigates to the corresponding full page

### Requirement: Reminders widget
The system SHALL list reminders due today and overdue with a quick-complete action.

#### Scenario: Complete from dashboard
- **WHEN** the admin completes a reminder directly on the dashboard
- **THEN** the reminder is marked done and disappears from the widget without reloading the page

### Requirement: Pending payments widget
The system SHALL list pending and partial payments sorted by overdue first, with per-currency totals of outstanding amounts.

#### Scenario: Outstanding totals per currency
- **WHEN** the admin views the pending payments widget
- **THEN** the system shows the sum of pending and partial amounts grouped by currency

### Requirement: Active projects widget
The system SHALL list active projects with a progress indicator (milestones done vs. total).

#### Scenario: Project progress shown
- **WHEN** the admin views the active projects widget
- **THEN** the system shows each active project with its milestone progress

### Requirement: Open negotiations widget
The system SHALL show the number of open negotiations and the total open pipeline value per currency.

#### Scenario: Pipeline value per currency
- **WHEN** the admin views the open negotiations widget
- **THEN** the system shows the count of open negotiations and the sum of their amounts per currency

### Requirement: Money overview widget
The system SHALL show received payments and expenses for the current month, per currency, with a simple monthly trend.

#### Scenario: Monthly money summary
- **WHEN** the admin views the money widget
- **THEN** the system shows this month's received payments and expenses per currency

### Requirement: Pending tasks widget
The system SHALL list tasks that are `todo` or `in_progress` and are overdue or due within the next 7 days, across all projects, with their project name.

#### Scenario: Pending tasks listed
- **WHEN** the admin views the dashboard
- **THEN** the system shows pending tasks that are overdue or due soon, each with its project

#### Scenario: No pending tasks
- **WHEN** no tasks are overdue or due soon
- **THEN** the widget shows an empty state
