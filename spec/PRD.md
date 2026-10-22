# Product Requirements Document (PRD) — טריוויקיד (Trivikid)

## 1. Background and Objectives

### a. Product Purpose
טריוויקיד is a Hebrew trivia game for children in which a child types any topic and gets AI-generated multiple-choice trivia questions about it.

### b. Problem Statement
Children aged 8–12 are curious about many different subjects, but most trivia games offer a fixed set of topics and questions. Children cannot easily get a quiz on exactly the subject that interests them at that moment, in Hebrew, at a level that suits their age.

### c. Proposed Solution
A simple, mobile-friendly web app (installable as a PWA) where the child enters a topic of their choice. The app uses AI to generate an age-appropriate trivia question with 4 answer options in Hebrew. After the child answers, the app shows whether the answer was correct and the correct answer if it was not, plus a short explanation or fun fact. The child can then continue with another question on the same topic or switch to a new topic.

## 2. Target Audience and User Needs

### a. User Personas
- **The curious child (primary user):** Aged 8–12, a confident Hebrew reader, using a mobile phone or tablet (and sometimes a computer). Wants a quick, fun game on topics they personally care about, with simple, clear screens and immediate feedback.

### b. User Stories
- As a child, I want to type any topic I'm interested in, so that I can get trivia questions about exactly what I like.
- As a child, I want to see a question with 4 answer options and choose one, so that I can test my knowledge.
- As a child, I want to know right away whether I was right, and see the correct answer if I was wrong, so that I can learn the right answer.
- As a child, I want to read a short explanation or fun fact after each answer, so that I can learn something new whether or not I was right.
- As a child, I want to ask for another question on the same topic, without getting a question I've already seen, so that I can keep playing on a subject I enjoy.
- As a child, I want to change the topic at any time, so that I can explore different subjects.
- As a child, I want to read what the app is about, so that I can understand how to use it.
- As a child, I want to install the app on my phone's home screen, so that I can open it easily like a regular app.

## 3. User Flows and Experience

### a. User Journey
A child is curious about a subject (e.g., dinosaurs, space, football) and wants to play a quick game about it. They open טריוויקיד on their phone or computer, or from the home-screen icon if installed. They tap the start button on the Home screen and type their topic. They answer a question and immediately see whether they were right, the correct answer, and a short fun fact. Then they keep going with more questions on the same topic or switch to a new topic until they're done playing.

### b. User Flows

**Flow 1 — Playing trivia**
1. Home screen → the child taps **"בואו נשחק!"**.
2. Trivia Questions screen → the child types a topic in the text box and taps **"שאלה חדשה"**.
3. The app shows a loading indication while the question is generated.
4. The app displays one question with 4 answer options.
5. The child taps one answer (one attempt only).
6. The answer options are replaced, below the question, by the feedback:
   - On success: a success message (e.g., **"כל הכבוד! תשובה נכונה 🎉"**).
   - On failure: a failure message (e.g., **"לא נורא! התשובה הנכונה היא:"**) followed by the correct answer.
   - In both cases: a short explanation or fun fact about the correct answer.
7. The child chooses one of the following:
   - Taps **"שאלה חדשה"** again → a new question on the same topic (returns to step 3).
   - Edits the topic in the text box and taps **"שאלה חדשה"** → a question on the new topic (returns to step 3).

**Flow 2 — Reading about the app**
1. Home screen → the child taps **"אודות"**.
2. About screen → the child reads the explanation.
3. The child taps the back/home button → returns to the Home screen.

**Flow 3 — Navigation back to Home**
- From the Trivia Questions screen or the About screen, the child taps the back/home button to return to the Home screen.

> Note: The Hebrew UI texts above are suggested wording and can be refined during design.

### c. UX Requirements
- **Hebrew RTL throughout:** All UI text is in Hebrew, and the layout is right-to-left.
- **Child-friendly:** Simple, clear language suited to ages 8–12, with large, easy-to-tap buttons and a cheerful, inviting look.
- **Mobile-first and responsive:** The app works well on phones, tablets, and desktop screens.
- **Immediate, clear feedback:** Success and failure are clearly distinguishable (e.g., by color and icon, not color alone), and messages are encouraging, never discouraging.
- **Minimal steps:** Getting from opening the app to the first question takes as few actions as possible.
- **Visible loading state:** While a question is being generated, the child sees a friendly loading indication, and the button cannot be tapped repeatedly.
- **Simplicity:** There are only three screens, with no accounts, settings, or scores.

## 4. Functional Requirements

### a. Features & Functional Requirements

- **Home Screen**
  - Displays the app name **"טריוויקיד"** and an image related to a trivia quiz.
  - Contains a **"בואו נשחק!"** button that navigates to the Trivia Questions screen.
  - Contains an **"אודות"** button that navigates to the About screen.

- **Topic Input**
  - The Trivia Questions screen contains a text box for typing a topic and a single **"שאלה חדשה"** button that requests a question on the topic currently in the text box. It is the only request button: the same button asks for the first question, another question on the same topic, and a question on an edited topic.
  - The child may type any topic, in free text.
  - The button does not send a request when the text box is empty (or contains only spaces); a friendly prompt asks the child to type a topic.
  - The topic text stays in the text box after a question is shown, so the child can edit it to change the topic.

- **AI Question Generation**
  - Each question is generated by AI in real time based on the entered topic.
  - Each question includes: the question text, exactly 4 answer options, exactly one correct answer, and a short explanation or fun fact (1–2 simple sentences) about the correct answer.
  - All generated content is in Hebrew and suited to children aged 8–12 in difficulty and wording.
  - **Child-safe content:** If the entered topic is inappropriate for children (e.g., violence, adult content), the app does not refuse. It generates a question on a related, child-safe angle of the topic instead.
  - **No repeats:** Within the current visit, the app does not repeat a question that was already shown for the same topic. The history resets when the app is closed or refreshed.

- **Answering and Feedback**
  - The child can select only one answer per question (a single attempt).
  - Once an answer is selected, the answer options are removed and replaced, below the question, by the feedback:
    - On a correct answer: a success message.
    - On a wrong answer: a failure message that includes the correct answer.
    - In both cases: the explanation or fun fact.
  - After feedback, the child taps **"שאלה חדשה"** for another question on the same topic, or edits the topic first to get a question on a new topic.

- **About Screen**
  - Displays an explanation of the app: what it is and how to play.
  - Contains a back/home button that returns to the Home screen.

- **Navigation**
  - The Home screen is the entry point and links to the Trivia Questions screen and the About screen.
  - The Trivia Questions screen and the About screen each have a back/home button that returns to Home.

- **PWA Installation**
  - The app can be installed on a device's home screen as a Progressive Web App, with the app name and an icon.

### b. Edge Cases & Error Handling
- **Empty topic:** The app doesn't send a request and shows a friendly prompt (e.g., **"כתבו נושא כדי לקבל שאלה 🙂"**).
- **Inappropriate topic:** The app generates a question on a related, child-safe angle (see AI Question Generation). No error message is shown.
- **Unclear or meaningless topic** (e.g., random letters): *Assumption:* The app shows a friendly message asking the child to try a different topic (e.g., **"לא הצלחנו להבין את הנושא, נסו נושא אחר"**).
- **AI service failure or timeout:** The app shows a friendly error message (e.g., **"אופס! משהו השתבש. נסו שוב"**) with an option to try again. No partial or broken question is displayed.
- **Invalid AI response** (e.g., not exactly 4 options, no single correct answer): *Assumption:* The response is treated as a failure and handled like an AI service failure (or retried automatically once).
- **No internet connection:** Question generation requires an internet connection. The app shows a friendly message that there is no connection and asks the child to try again once connected (**"אין חיבור לאינטרנט. התחברו ונסו שוב"**).
- **Repeated taps on the request button:** While a question is loading, the button is disabled, so only one request is sent at a time.
- **Topic changed mid-question:** If the child edits the topic and requests a question before answering the current one, the current question is replaced by a question on the new topic.
- **Very long topic text:** *Assumption:* Topic input is limited to a reasonable maximum length (e.g., 50 characters).
- **Running out of new questions on a narrow topic:** *Assumption:* If the app cannot generate a non-repeated question, it suggests trying a different topic (**"נגמרו לנו שאלות חדשות על הנושא הזה. נסו נושא אחר!"**).

## 5. Technical Requirements and Constraints

### a. Technical Requirements
- **Platform:** A mobile-responsive website, installable as a Progressive Web App (PWA).
- **Devices:** Mobile phones, tablets, and desktop computers.
- **Browsers:** *Assumption:* Current versions of the major browsers (Chrome, Safari, Edge, Firefox), including mobile Safari and Chrome.
- **Interface language:** Hebrew only, with full right-to-left (RTL) layout.
- **AI integration:** The app requires an AI service to generate questions, answer options, correct answers, and explanations in real time.
- **Connectivity:** An internet connection is required to generate questions.

### b. Constraints
- **Budget:** A budget is available for paid AI usage, and no special usage limits are required.
- **Child safety:** All generated content must be appropriate for children aged 8–12 (see the child-safe content rule).
- **Privacy:** *Assumption:* The app has no user accounts and does not collect or store personal information about children. Only the entered topic is sent to the AI service to generate the question.
- **Security:** *Assumption:* AI service access credentials must not be exposed in the client-side app.

## 6. Out of Scope

### a. Out of Scope
- Scores, points, progress tracking, or statistics (in session or saved)
- User accounts, registration, or login
- Multiple attempts per question
- Difficulty levels or age selection
- A fixed or pre-built question bank or predefined topic lists
- Interface languages other than Hebrew
- Offline question generation
- Multiplayer, competitions, or leaderboards
- Parent or teacher dashboards
- Saving question history between visits
