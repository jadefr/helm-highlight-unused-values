# Helm Highligth Unused Values
 
VS Code extension that highlights unused values in Helm `values.yaml` files.
 
## Features
 
- Automatically detects `values.yaml` files
- Scans corresponding `templates/` directory for value usage
- Highlights unused values with orange background
- Real-time updates as you edit
 
## Installation
 
1. Compile the extension:
   ```bash
   npm install
   npm run compile
   ```
 
2. Package and install:
   ```bash
   npx vsce package
   code --install-extension helm-highlight-unused-values-0.0.1.vsix
   ```
 
## Usage
 
Open any `values.yaml` file in a Helm chart. Unused values will be highlighted automatically.
 
## Development Testing
 
1. Press F5 in VS Code to open an Extension Development Host
 
2. Make your color changes in extension.ts
 
3. Save the file
 
4. Press Ctrl+R in the Extension Development Host window to reload
 
Or
 
1. Compile:
 
   ```bash
   npm run compile
   ```
 
2. Package it:
 
   ```bash
   vsce package   # needs to be installed with npm install -g @vscode/vsce
   ```
 
3. Install it again
 
   ```bash
   code --install-extension helm-highlight-unused-values-0.0.1.vsix
   ```
 
4. Reload VS Code (Developer: Reload Window) or restart it
 
## Uninstall
 
Uninstall the extension:
 
   ```bash
   code --uninstall-extension helm-highlight-unused-values
   ```
