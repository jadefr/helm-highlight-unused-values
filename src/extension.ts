import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'yaml';
 
let decorationType: vscode.TextEditorDecorationType;

function getDecorationOptions(): vscode.DecorationRenderOptions {
    const isLightTheme = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Light;
    
    // Use darker colors for light theme, lighter colors for dark theme
    const color = isLightTheme 
        ? 'rgba(180, 141, 0, 0.33)'    // Dark gold for light theme
        : 'rgba(253, 251, 251, 0.43)'; // Light gray for dark theme
    
    return {
        textDecoration: `underline wavy ${color}`,
        overviewRulerColor: color,
        overviewRulerLane: vscode.OverviewRulerLane.Right
    };
}

export function activate(context: vscode.ExtensionContext) {
    // Create initial decoration type
    decorationType = vscode.window.createTextEditorDecorationType(getDecorationOptions());
    
    // Update decoration when theme changes
    context.subscriptions.push(
        vscode.window.onDidChangeActiveColorTheme(() => {
            decorationType.dispose();
            decorationType = vscode.window.createTextEditorDecorationType(getDecorationOptions());
            // Refresh all active editors
            vscode.window.visibleTextEditors.forEach(editor => {
                if (editor.document.languageId === 'yaml' && isValuesFile(editor.document.fileName)) {
                    updateDecorations(editor);
                }
            });
        })
    );
    
    const disposable = vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document.languageId === 'yaml' && isValuesFile(event.document.fileName)) {
            updateDecorations(vscode.window.activeTextEditor);
        }
    });
 
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor && editor.document.languageId === 'yaml' && isValuesFile(editor.document.fileName)) {
            updateDecorations(editor);
        }
    });
 
    if (vscode.window.activeTextEditor) {
        updateDecorations(vscode.window.activeTextEditor);
    }
 
    context.subscriptions.push(disposable);
}
 
function isValuesFile(fileName: string): boolean {
    return fileName.includes('values.yaml') || fileName.includes('values.yml');
}
 
function updateDecorations(editor: vscode.TextEditor | undefined) {
    if (!editor) return;
 
    const document = editor.document;
    const text = document.getText();
   
    try {
        const valuesData = parse(text);
        const templateFiles = findTemplateFiles(document.fileName);
        const usedValues = findUsedValues(templateFiles);
        const unusedRanges = findUnusedValues(document, valuesData, usedValues);
       
        editor.setDecorations(decorationType, unusedRanges);
    } catch (error) {
        console.error('Error parsing YAML:', error);
    }
}
 
function findTemplateFiles(valuesPath: string): string[] {
    const chartDir = path.dirname(valuesPath);
    const templatesDir = path.join(chartDir, 'templates');
   
    if (!fs.existsSync(templatesDir)) return [];
   
    return fs.readdirSync(templatesDir)
        .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
        .map(file => path.join(templatesDir, file));
}
 
function findUsedValues(templateFiles: string[]): Set<string> {
    const used = new Set<string>();
    const valuePattern = /\{\{\s*[-.]?\s*\.Values\.([a-zA-Z0-9._-]+)/g;
   
    templateFiles.forEach(file => {
        try {
            const content = fs.readFileSync(file, 'utf8');
            let match;
            while ((match = valuePattern.exec(content)) !== null) {
                used.add(match[1]);
            }
        } catch (error) {
            console.error(`Error reading template file ${file}:`, error);
        }
    });
   
    return used;
}
 
function findUnusedValues(document: vscode.TextDocument, valuesData: any, usedValues: Set<string>): vscode.Range[] {
    const ranges: vscode.Range[] = [];
    const lines = document.getText().split('\n');
   
    function checkObject(obj: any, prefix: string = '', startLine: number = 0) {
        if (typeof obj !== 'object' || obj === null) return;
       
        for (const [key, value] of Object.entries(obj)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            const keyLine = findKeyLine(lines, key, startLine);
           
            if (keyLine !== -1 && !isValueUsed(fullKey, usedValues)) {
                const range = new vscode.Range(keyLine, 0, keyLine, lines[keyLine].length);
                ranges.push(range);
            }
           
            if (typeof value === 'object' && value !== null) {
                checkObject(value, fullKey, keyLine + 1);
            }
        }
    }
   
    checkObject(valuesData);
    return ranges;
}
 
function findKeyLine(lines: string[], key: string, startLine: number): number {
    for (let i = startLine; i < lines.length; i++) {
        if (lines[i].trim().startsWith(`${key}:`)) {
            return i;
        }
    }
    return -1;
}
 
function isValueUsed(key: string, usedValues: Set<string>): boolean {
    if (usedValues.has(key)) return true;
   
    // Check if any parent or child path is used
    for (const used of usedValues) {
        if (key.startsWith(used + '.') || used.startsWith(key + '.')) {
            return true;
        }
    }
   
    return false;
}
 
export function deactivate() {
    if (decorationType) {
        decorationType.dispose();
    }
}