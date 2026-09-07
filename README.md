
# Typeform Builder

SDE Fullstack Assignment

Typeform Builder is a full-stack web application inspired by Typeform. It allows users to create forms, add and manage different types of questions, reorder questions, publish forms, collect responses through a one-question-at-a-time experience, and view submitted results.

The project was built using Next.js, TypeScript, FastAPI, SQLAlchemy, and SQLite.

## Live Demo

https://typeform-builder-delta.vercel.app/

## GitHub

https://github.com/SHREYANK-RAJ/typeform-builder

## Backend API

https://typeform-builder-1qj4.onrender.com/

## Author

GitHub: https://github.com/SHREYANK-RAJ

LinkedIn: https://www.linkedin.com/in/shreyank-raj/

---

# Overview

The application follows the main workflow of a Typeform-style form platform:

```text
Create Form
     |
     v
Add Questions
     |
     v
Edit and Reorder
     |
     v
Add Logic
     |
     v
Preview
     |
     v
Publish
     |
     v
Share Public Link
     |
     v
Collect Responses
     |
     v
View Results
     |
     v
Export Responses


The project has three main parts:

1. Form Management Dashboard
2. Form Builder
3. Public Form and Results Pages

---

# Features

## Form Builder

The form builder allows a creator to build and edit forms.

### Supported Question Types

* Short Text
* Long Text
* Multiple Choice
* Dropdown
* Email
* Number
* Yes / No
* Rating

### Question Settings

Each question can have:

* Question title
* Description or help text
* Required or optional setting
* Options for Multiple Choice
* Options for Dropdown
* Question position

Users can:

* Add questions
* Edit questions
* Delete questions
* Reorder questions using drag and drop
* Preview the form while building it

---

# Form Management

The dashboard provides a simple way to manage forms.

Users can:

* Create forms
* Rename forms
* Edit forms
* Duplicate forms
* Delete forms
* Publish forms
* Unpublish forms
* Open public forms
* View response counts
* Open the results page

Each form shows its current status:

```text
Draft
Published
```

---

# Public Form Experience

Published forms can be opened using a public link without logging in.

The form uses a one-question-at-a-time layout inspired by Typeform.

Features include:

* One question at a time
* Full-screen form experience
* Progress indicator
* Next and previous navigation
* Enter key navigation
* Keyboard navigation
* Required field validation
* Email validation
* Number validation
* Rating validation
* Choice validation
* Yes / No validation
* Thank-you screen

No authentication is required for respondents.

---

# Logic Jumps

The application supports conditional Logic Jumps.

A Logic Jump can move a respondent to a later question based on their answer.

Example:

```text
Question 1
Are you a student?

        |
        | Answer = Yes
        v

Question 3
What is your university?
```

Supported operators include:

* equals
* not_equals
* contains
* greater_than
* less_than
* is_empty
* is_not_empty

Logic Jump rules are stored in the database and evaluated during the public form experience.

The backend also checks Logic Jump rules when questions are reordered so that invalid question flows are prevented.

---

# Results and Responses

Each form has a Results page.

The Results page provides:

* Total response count
* List of submitted responses
* Individual response details
* Submission date and time
* Basic question statistics
* Choice question counts
* Rating information
* CSV export
* Response refresh

Responses are stored permanently in the database while the application is running with its current deployment setup.

The Results page displays the newest responses first.

Example:

```text
Response #1
Submitted 7 Sept 2026, 2:54 PM

Response #2
Submitted 7 Sept 2026, 2:51 PM
```

---

# CSV Export

The Results page provides a CSV export option.

The exported file can be used for:

* Excel
* Google Sheets
* Data analysis
* Reporting
* Backup of responses

---

# Technologies Used

## Frontend

* Next.js
* React
* TypeScript
* CSS
* dnd-kit
* Lucide React
* Fetch API

## Backend

* Python
* FastAPI
* SQLAlchemy
* Pydantic
* Uvicorn

## Database

* SQLite

## Deployment

* Vercel for the frontend
* Render for the backend

## Version Control

* Git
* GitHub

---

# Architecture

The application uses a separate frontend and backend.

```text
                    User
                      |
                      v
             +----------------+
             |    Vercel      |
             | Next.js App    |
             +-------+--------+
                     |
                     | REST API
                     v
             +----------------+
             |    Render      |
             | FastAPI App    |
             +-------+--------+
                     |
                     | SQLAlchemy
                     v
             +----------------+
             |    SQLite      |
             |    Database    |
             +----------------+
```

The frontend handles:

* User interface
* Form builder
* Public form experience
* Validation before submission
* Results interface
* CSV export

The backend handles:

* Form CRUD
* Question CRUD
* Publishing
* Responses
* Server-side validation
* Logic Jump rules
* Database operations

---

# Project Structure

```text
typeform-builder/
|
├── backend/
│   |
│   ├── app/
│   │   |
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── schemas.py
│   │   |
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── form.py
│   │   │   ├── question.py
│   │   │   ├── response.py
│   │   │   └── logic_rule.py
│   │   |
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── forms.py
│   │       ├── questions.py
│   │       ├── responses.py
│   │       └── logic_rules.py
│   |
│   ├── seed.py
│   └── requirements.txt
│
├── frontend/
│   |
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx
│   │   |
│   │   ├── builder/
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   |
│   │   ├── form/
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   |
│   │   └── results/
│   │       └── [id]/
│   │           └── page.tsx
│   │
│   └── lib/
│       └── api.ts
│
├── .gitignore
└── README.md
```

---

# Database Schema

The project uses SQLite with SQLAlchemy.

The main database tables are:

```text
Form
 |
 +---- Question
 |
 +---- FormResponse
 |
 +---- LogicRule

FormResponse
 |
 +---- Answer
```

## Form

Stores information about each form.

```text
Form
├── id
├── title
├── description
├── is_published
├── public_slug
├── created_at
└── updated_at
```

A form can have multiple questions, responses, and Logic Jump rules.

---

## Question

Stores each question inside a form.

```text
Question
├── id
├── form_id
├── type
├── title
├── description
├── required
├── position
└── options
```

The `position` field is used to keep questions in the correct order.

---

## FormResponse

Stores one complete submission.

```text
FormResponse
├── id
├── form_id
└── submitted_at
```

---

## Answer

Stores an answer belonging to a submitted response.

```text
Answer
├── id
├── response_id
├── question_id
└── value
```

This design allows one response to contain multiple answers.

---

## LogicRule

Stores conditional form rules.

```text
LogicRule
├── id
├── form_id
├── source_question_id
├── operator
├── value
└── target_question_id
```

---

# API

The backend provides REST API endpoints for forms, questions, responses, and Logic Jumps.

## Forms

### Get all forms

```http
GET /api/forms
```

### Create a form

```http
POST /api/forms
```

### Get a form

```http
GET /api/forms/{form_id}
```

### Update a form

```http
PUT /api/forms/{form_id}
```

### Delete a form

```http
DELETE /api/forms/{form_id}
```

### Publish a form

```http
POST /api/forms/{form_id}/publish
```

### Unpublish a form

```http
POST /api/forms/{form_id}/unpublish
```

### Duplicate a form

```http
POST /api/forms/{form_id}/duplicate
```

### Get a public form

```http
GET /api/forms/public/{slug}
```

---

# Questions

### Get questions

```http
GET /api/forms/{form_id}/questions
```

### Create a question

```http
POST /api/forms/{form_id}/questions
```

### Update a question

```http
PUT /api/questions/{question_id}
```

### Delete a question

```http
DELETE /api/questions/{question_id}
```

### Reorder questions

```http
PUT /api/forms/{form_id}/questions/reorder
```

---

# Responses

### Submit a public response

```http
POST /api/public/forms/{form_id}/responses
```

### Get form responses

```http
GET /api/forms/{form_id}/responses
```

### Get an individual response

```http
GET /api/responses/{response_id}
```

---

# Logic Rules

### Get Logic Rules

```http
GET /api/forms/{form_id}/logic-rules
```

### Create Logic Rule

```http
POST /api/forms/{form_id}/logic-rules
```

### Update Logic Rule

```http
PUT /api/logic-rules/{rule_id}
```

### Delete Logic Rule

```http
DELETE /api/logic-rules/{rule_id}
```

---

# Installation

## Requirements

Install the following before running the project:

* Node.js
* npm
* Python 3
* Git

---

# Backend Setup

Clone the repository:

```bash
git clone https://github.com/SHREYANK-RAJ/typeform-builder.git
```

Enter the project:

```bash
cd typeform-builder
```

Go to the backend:

```bash
cd backend
```

Create a virtual environment:

```bash
python3 -m venv .venv
```

Activate the virtual environment.

### macOS / Linux

```bash
source .venv/bin/activate
```

### Windows

```bash
.venv\Scripts\activate
```

Install the backend dependencies:

```bash
pip install -r requirements.txt
```

---

# Seed the Database

The project includes sample data so the application can be tested immediately.

Run:

```bash
python seed.py
```

The seed creates:

* Customer Feedback form
* Software Engineer Application form
* Sample questions
* Sample responses
* Sample Logic Jump

---

# Run the Backend

From the `backend` directory:

```bash
uvicorn app.main:app --reload
```

The backend will run at:

```text
http://127.0.0.1:8000
```

FastAPI documentation is available at:

```text
http://127.0.0.1:8000/docs
```

---

# Frontend Setup

Open another terminal.

From the project root:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will run at:

```text
http://localhost:3000
```

---

# Environment Variables

The frontend uses the following environment variable:

```text
NEXT_PUBLIC_API_URL
```

For local development:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

For production:

```env
NEXT_PUBLIC_API_URL=https://typeform-builder-1qj4.onrender.com
```

The production variable is configured in Vercel.

---

# Sample Forms

The application includes two published sample forms.

## Customer Feedback

Public form:

[https://typeform-builder-delta.vercel.app/form/customer-feedback](https://typeform-builder-delta.vercel.app/form/customer-feedback)

The form contains questions such as:

* Product satisfaction
* Rating
* Improvement feedback
* Email

It also demonstrates a Logic Jump.

---

## Software Engineer Application

Public form:

[https://typeform-builder-delta.vercel.app/form/software-engineer-application](https://typeform-builder-delta.vercel.app/form/software-engineer-application)

The form contains:

* Full Name
* Email
* Experience
* Technical Strength
* Project Description

This form demonstrates multiple question types in one form.

---

# Deployment

## Frontend

The frontend is deployed on Vercel.

Live application:

[https://typeform-builder-delta.vercel.app/](https://typeform-builder-delta.vercel.app/)

The Vercel project uses:

```text
Root Directory: frontend
```

Production API configuration:

```text
NEXT_PUBLIC_API_URL=https://typeform-builder-1qj4.onrender.com
```

---

# Backend

The backend is deployed on Render.

Backend URL:

[https://typeform-builder-1qj4.onrender.com/](https://typeform-builder-1qj4.onrender.com/)

Render uses:

```text
Root Directory: backend
```

Build command:

```bash
pip install -r requirements.txt
```

Start command:

```bash
python seed.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

# Production Architecture

The production application works as follows:

```text
                    Vercel
              Next.js Frontend
                     |
                     |
                 REST API
                     |
                     v
                   Render
             FastAPI Backend
                     |
                     |
                 SQLAlchemy
                     |
                     v
                  SQLite
```

For a public response:

```text
User opens public link
          |
          v
Next.js loads form
          |
          v
User answers questions
          |
          v
Client-side validation
          |
          v
Response sent to FastAPI
          |
          v
Server-side validation
          |
          v
Response stored in SQLite
          |
          v
Thank-you screen
          |
          v
Results page
```

---

# Validation

Validation is implemented on both the frontend and backend.

## Frontend Validation

The frontend checks:

* Required fields
* Email format
* Number values
* Rating values
* Form navigation

## Backend Validation

The backend checks:

* Form exists
* Form is published
* Question belongs to the form
* Required questions are answered
* Duplicate answers are rejected
* Email format is valid
* Number values are valid
* Rating is between 1 and 5
* Yes / No values are valid
* Multiple Choice values are valid
* Dropdown values are valid

This prevents invalid data from being stored by directly calling the backend API.

---

# UI and UX

The application follows the main design ideas of Typeform.

The builder focuses on:

* Simple controls
* Clean layout
* Live preview
* Inline editing
* Drag-and-drop ordering
* Clear question settings

The respondent experience focuses on:

* One question at a time
* Minimal distractions
* Large readable questions
* Progress indication
* Keyboard navigation
* Clear validation
* Smooth movement between questions

The dashboard provides:

* Simple form cards
* Published/draft status
* Response counts
* Quick actions
* Toast notifications

---

# Design Decisions

## Separate Frontend and Backend

The frontend and backend are separated to keep the application easier to maintain.

```text
frontend/
backend/
```

The frontend communicates with the backend using REST APIs.

---

## SQLAlchemy ORM

SQLAlchemy is used to communicate with SQLite.

This keeps database operations separate from the UI and API logic.

---

## Question Position

Each question has a `position` value.

For example:

```text
Question A → position 0
Question B → position 1
Question C → position 2
```

When the user reorders questions, the backend updates these positions.

---

## JSON Options

Multiple Choice and Dropdown options are stored as JSON text.

For example:

```json
[
  "Option 1",
  "Option 2",
  "Option 3"
]
```

This allows each question to have a different number of options without creating another database table.

---

## Public Slugs

Published forms use readable public slugs.

Example:

```text
customer-feedback
```

This creates a public URL such as:

```text
https://typeform-builder-delta.vercel.app/form/customer-feedback
```

---

# Assumptions

The project was built according to the requirements of the SDE evaluation.

Current assumptions include:

* Creator authentication is not implemented.
* A default creator is assumed.
* Respondents do not need an account.
* Published forms are publicly accessible.
* SQLite is used as required by the assignment.
* Forms are not separated by user accounts.
* File upload questions are not implemented.
* Payment questions are not implemented.
* Integrations and webhooks are not implemented.
* Team collaboration is not implemented.

---

# Testing

The main workflows were tested during development.

## Form Management

```text
Create Form
Rename Form
Edit Form
Duplicate Form
Delete Form
Publish Form
Unpublish Form
Open Public Form
View Responses
```

## Form Builder

```text
Add Question
Edit Question
Delete Question
Reorder Questions
Required Question
Optional Question
Question Description
Multiple Choice
Dropdown
Short Text
Long Text
Email
Number
Yes / No
Rating
Live Preview
```

## Respondent Flow

```text
Open Public Form
Answer Question
Use Keyboard Navigation
Move Forward
Move Back
Validate Required Fields
Validate Email
Validate Number
Validate Rating
Validate Choices
Submit Response
Show Thank-you Screen
```

## Logic

```text
Create Logic Jump
Save Logic Jump
Evaluate Logic Jump
Skip Question
Delete Logic Jump
Validate Logic Jump
Protect Logic Jump During Reordering
```

## Results

```text
View Response Count
View Responses
View Individual Response
View Statistics
View Submission Time
Refresh Results
Export CSV
```

## Deployment

```text
Public GitHub Repository
Vercel Frontend
Render Backend
Production API Connection
Production CORS
Seed Data
Public Forms
Response Submission
Results Display
```

---

# Project Links

| Resource                      | Link                                                                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Live Application              | [https://typeform-builder-delta.vercel.app/](https://typeform-builder-delta.vercel.app/)                                                                     |
| Backend API                   | [https://typeform-builder-1qj4.onrender.com/](https://typeform-builder-1qj4.onrender.com/)                                                                   |
| GitHub Repository             | [https://github.com/SHREYANK-RAJ/typeform-builder](https://github.com/SHREYANK-RAJ/typeform-builder)                                                         |
| GitHub Profile                | [https://github.com/SHREYANK-RAJ](https://github.com/SHREYANK-RAJ)                                                                                           |
| LinkedIn                      | [https://www.linkedin.com/in/shreyank-raj/](https://www.linkedin.com/in/shreyank-raj/)                                                                       |
| Customer Feedback             | [https://typeform-builder-delta.vercel.app/form/customer-feedback](https://typeform-builder-delta.vercel.app/form/customer-feedback)                         |
| Software Engineer Application | [https://typeform-builder-delta.vercel.app/form/software-engineer-application](https://typeform-builder-delta.vercel.app/form/software-engineer-application) |

---

# Future Improvements

Possible future improvements include:

* Creator authentication
* User accounts
* Role-based access control
* PostgreSQL
* Cloud database storage
* Advanced Logic Jumps
* More question types
* File uploads
* Partial response saving
* Completion rate tracking
* Dark mode
* More custom themes
* Custom fonts
* Custom form backgrounds
* Advanced analytics
* Response search
* Response filtering
* Pagination
* Webhooks
* Email notifications
* Team collaboration
* Form autosave
* Form templates
* Custom domains

---

# Learning Outcomes

This project provided practical experience with:

* Next.js
* React
* TypeScript
* FastAPI
* Python
* SQLAlchemy
* SQLite
* REST APIs
* CRUD operations
* Database relationships
* Pydantic validation
* Client-side validation
* Server-side validation
* Drag-and-drop interfaces
* Conditional form logic
* Public form URLs
* Response storage
* CSV export
* CORS
* Environment variables
* Git
* GitHub
* Vercel
* Render
* Production debugging

---

# Assignment Requirements Covered

The project covers the main requirements of the SDE Fullstack Assignment.

```text
Form Builder
    Yes

Multiple Question Types
    Yes

Required Questions
    Yes

Question Descriptions
    Yes

Drag-and-Drop Reordering
    Yes

Live Preview
    Yes

Form CRUD
    Yes

Duplicate Forms
    Yes

Publish / Unpublish
    Yes

Public Shareable Forms
    Yes

One-Question-at-a-Time Experience
    Yes

Keyboard Navigation
    Yes

Progress Indicator
    Yes

Client Validation
    Yes

Server Validation
    Yes

Response Persistence
    Yes

Thank-you Screen
    Yes

Results Dashboard
    Yes

Individual Responses
    Yes

Basic Statistics
    Yes

CSV Export
    Yes

Logic Jumps
    Yes

Seed Data
    Yes

GitHub Repository
    Yes

Hosted Application
    Yes
```

---

# Project Status

The application is complete and deployed.

The main end-to-end workflow is working:

```text
Create
   |
   v
Build
   |
   v
Configure
   |
   v
Preview
   |
   v
Publish
   |
   v
Share
   |
   v
Respond
   |
   v
Validate
   |
   v
Store
   |
   v
View Results
   |
   v
Export
```

---

# Author

**Shreyank Raj**

- GitHub: https://github.com/SHREYANK-RAJ
- LinkedIn: https://www.linkedin.com/in/shreyank-raj/

---

# License

This project is licensed under the **MIT License**.

---


```
```
