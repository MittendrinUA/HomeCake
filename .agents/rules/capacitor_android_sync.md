# Capacitor Android Sync

When working in this project, if you make any modifications to the web source code (`src/` folder, HTML, etc.), you MUST automatically run the following commands at the end of your task before finishing:

1. `npm run build`
2. `npx cap sync android`

This ensures that the latest web assets are always pushed to the Android native project, allowing the user to immediately test the results in Android Studio.

Use the `run_command` tool to execute `npm run build; npx cap sync android`. You do not need to ask for permission to run this at the end of a modification task.
