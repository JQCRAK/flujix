This file is a merged representation of the entire codebase, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
.github/workflows/ci.yml
.gitignore
backend/.env
backend/package.json
backend/src/app.js
backend/src/controllers/taskController.js
backend/src/models/Task.js
backend/src/routes/tasks.js
backend/tests/task.test.js
devops/environments/dev.env
devops/environments/prod.env
devops/environments/test.env
devops/nginx/flujix.conf
devops/scripts/install.sh
devops/scripts/run-tests.sh
devops/scripts/start-dev.sh
devops/scripts/start-prod.sh
docs/test-plan.md
frontend/index.html
frontend/package.json
frontend/src/api.js
frontend/src/App.jsx
frontend/src/components/Sidebar.jsx
frontend/src/components/StatsBar.jsx
frontend/src/components/TaskCard.jsx
frontend/src/components/TaskForm.jsx
frontend/src/components/TaskList.jsx
frontend/src/components/TaskModal.jsx
frontend/src/index.css
frontend/src/main.jsx
frontend/vite.config.js
README.md
```
