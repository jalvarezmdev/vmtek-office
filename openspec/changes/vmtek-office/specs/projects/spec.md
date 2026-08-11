## Purpose

Tracks the delivery work VMWTEK performs: projects with an optional client link, organized into milestones (billed phases), epics (feature blocks), and tasks (work items), with visible progress.

## ADDED Requirements

### Requirement: Project CRUD
The system SHALL allow the admin to create, view, edit, and delete projects. A project SHALL have a name and status (`planning`, `active`, `paused`, `completed`, `archived`). A project MAY be linked to a client and MAY be linked to a negotiation from which it originated. A project MAY have no client (internal or speculative work).

#### Scenario: Create a project with a client
- **WHEN** the admin creates a project with a name, status, and an optional client
- **THEN** the project is created and appears in the projects list

#### Scenario: Create an internal project without a client
- **WHEN** the admin creates a project without selecting a client
- **THEN** the project is created as an internal project and is visible in the projects list

#### Scenario: Create a project from a won negotiation
- **WHEN** the admin creates a project from a negotiation whose status is won
- **THEN** the project is created with a link back to that negotiation and the client of that negotiation

#### Scenario: Edit project status
- **WHEN** the admin changes a project's status (e.g., active to completed)
- **THEN** the change is saved and reflected everywhere the project status is shown

#### Scenario: Delete a project
- **WHEN** the admin deletes a project
- **THEN** the project and its milestones, epics, and tasks are removed

### Requirement: Project list overview
The system SHALL display projects with their status, linked client, and progress (milestones done vs. total).

#### Scenario: View project list
- **WHEN** the admin opens the projects page
- **THEN** the system shows projects with status, client, and a milestone progress indicator

#### Scenario: Filter projects by status
- **WHEN** the admin filters the projects list by status
- **THEN** the system shows only projects in that status

### Requirement: Project detail page
The system SHALL provide a project detail page with tabs for Overview, Milestones, Epics, Tasks, Payments, Expenses, and Notes, including an overall progress indicator.

#### Scenario: Open project detail
- **WHEN** the admin opens a project's detail page
- **THEN** the system shows the project info, progress, and tabs for Milestones, Epics, Tasks, Payments, Expenses, and Notes

#### Scenario: Project not found
- **WHEN** the admin requests a project id that does not exist
- **THEN** the system shows a not-found page

### Requirement: Milestones
The system SHALL allow the admin to create, edit, and mark milestones under a project. A milestone SHALL have a name and status (`planned`, `active`, `done`), MAY have a due date, and MAY link to a payment for milestone-based billing.

#### Scenario: Create a milestone
- **WHEN** the admin creates a milestone under a project with a name and due date
- **THEN** the milestone is created and appears on the project's Milestones tab

#### Scenario: Mark milestone done
- **WHEN** the admin marks a milestone as done
- **THEN** the milestone status becomes done and the project's progress indicator updates

#### Scenario: Link milestone to payment
- **WHEN** the admin links a milestone to a payment
- **THEN** the milestone shows the linked payment and its received status

### Requirement: Epics
The system SHALL allow the admin to create, edit, and mark epics under a project. An epic SHALL have a name and status (`planned`, `active`, `done`) and MAY have a description.

#### Scenario: Create an epic
- **WHEN** the admin creates an epic under a project
- **THEN** the epic is created and appears on the project's Epics tab

#### Scenario: Mark epic done
- **WHEN** the admin marks an epic as done
- **THEN** the epic status becomes done

### Requirement: Tasks
The system SHALL allow the admin to create, edit, and complete tasks. A task SHALL have a title, status (`todo`, `in_progress`, `done`), and priority (`low`, `medium`, `high`, `urgent`). A task SHALL belong to a project and MAY belong to an epic within that project. A task MAY have a due date and description.

#### Scenario: Create a task under an epic
- **WHEN** the admin creates a task under an epic with a title, priority, and due date
- **THEN** the task is created and appears under that epic

#### Scenario: Create a task directly on a project
- **WHEN** the admin creates a task directly on a project without an epic
- **THEN** the task is created and appears in the project's task list

#### Scenario: Complete a task
- **WHEN** the admin marks a task as done
- **THEN** the task disappears from pending-task views and its status is saved

#### Scenario: Task requires a title
- **WHEN** the admin submits a task without a title
- **THEN** the system rejects the submission and shows a validation error
