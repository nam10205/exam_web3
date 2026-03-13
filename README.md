# Exam System - Modular JavaScript Structure

This project has been refactored to use a modular JavaScript structure for better maintainability.

## File Structure

```
exam3/
├── js/
│   ├── utils.js      # Utility functions (toText, etc.)
│   ├── data.js       # Data structures and global state variables
│   ├── auth.js       # Authentication logic (login/register/logout)
│   ├── student.js    # Student interface functions (exam taking, quiz logic)
│   ├── admin.js      # Admin interface functions (exam/user management)
│   └── chart.js      # Chart and statistics functionality
├── script.js         # Main entry point that loads all modules
├── index.html        # Main HTML file
└── style.css         # Stylesheet
```

## Module Descriptions

### utils.js
Contains utility functions used throughout the application:
- `toText()` - Sanitizes HTML content

### data.js
Contains all data structures and global state:
- `EXAMS` - Array of exam objects
- `QUESTIONS_DB` - Database of questions organized by exam ID
- `USERS_DB` - Array of user objects
- Global state variables (currentUser, currentExam, etc.)

### auth.js
Handles all authentication-related functionality:
- Login form switching
- User authentication
- Registration logic
- Logout functionality

### student.js
Manages student-side functionality:
- Exam listing and display
- Quiz taking interface
- Answer selection and timer
- Result display and review

### admin.js
Contains admin panel functionality:
- Dashboard management
- Exam CRUD operations
- User management
- Question builder interface

### chart.js
Handles chart and statistics visualization:
- Score distribution charts
- Chart initialization and updates

## Benefits of This Structure

1. **Maintainability**: Each module has a single responsibility
2. **Readability**: Code is organized logically by functionality
3. **Debugging**: Easier to locate and fix issues in specific areas
4. **Collaboration**: Multiple developers can work on different modules
5. **Testing**: Individual modules can be tested in isolation
6. **Reusability**: Functions can be easily reused across modules

## Loading Order

The modules are loaded in the following order in `script.js`:
1. utils.js (dependencies for other modules)
2. data.js (data structures needed by all modules)
3. auth.js (authentication logic)
4. student.js (student interface)
5. admin.js (admin interface)
6. chart.js (chart functionality)

This ensures that dependencies are available when needed.
