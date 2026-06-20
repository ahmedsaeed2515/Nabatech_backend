const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const BACKEND_DIR = __dirname;
const SRC_DIR = path.join(BACKEND_DIR, 'src');

// --- DATABASE INVENTORY ---
function generateDatabaseInventory() {
    const modelsDir = path.join(SRC_DIR, 'models');
    let md = '# DATABASE INVENTORY\n\n';
    
    if (fs.existsSync(modelsDir)) {
        const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.ts'));
        for (const file of files) {
            const content = fs.readFileSync(path.join(modelsDir, file), 'utf8');
            const modelMatch = content.match(/mongoose\.model(?:<[^>]+>)?\s*\(\s*['"]([^'"]+)['"]/);
            const modelName = modelMatch ? modelMatch[1] : 'Unknown';
            
            md += `## Collection: ${modelName} (File: src/models/${file})\n\n`;
            
            // Try to find the schema definition
            const schemaMatch = content.match(/new\s+(?:mongoose\.)?Schema\s*\(\s*({[\s\S]*?})\s*(?:,|}\))/);
            if (schemaMatch) {
                md += '### Fields & Types\n```typescript\n' + schemaMatch[1].substring(0, 500) + (schemaMatch[1].length > 500 ? '\n... (truncated)' : '') + '\n```\n\n';
            } else {
                md += '[Schema definition not easily extracted via regex, review code directly]\n\n';
            }
            
            // Extract refs
            const refs = [...content.matchAll(/ref:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
            if (refs.length > 0) {
                md += `**Relationships / References:** ${Array.from(new Set(refs)).join(', ')}\n\n`;
            } else {
                md += `**Relationships / References:** [None found]\n\n`;
            }
            
            // Extract indexes
            const indexes = [...content.matchAll(/\.index\s*\(\{([^}]+)\}/g)].map(m => m[1]);
            if (indexes.length > 0) {
                md += `**Indexes:**\n${indexes.map(i => `- {${i}}`).join('\n')}\n\n`;
            }
        }
    } else {
        md += '[NOT FOUND IN CODEBASE]\n';
    }
    
    fs.writeFileSync(path.join(ROOT_DIR, 'DATABASE_INVENTORY.md'), md);
}

// --- API INVENTORY ---
function generateApiInventory() {
    let md = '# API INVENTORY\n\n';
    const dirs = [path.join(SRC_DIR, 'routers'), path.join(SRC_DIR, 'routes')];
    
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) continue;
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));
        
        for (const file of files) {
            md += `## Router: src/${path.basename(dir)}/${file}\n\n`;
            const content = fs.readFileSync(path.join(dir, file), 'utf8');
            
            // match router.METHOD('path', ...middlewares)
            const routeRegex = /router\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/g;
            let match;
            let count = 0;
            while ((match = routeRegex.exec(content)) !== null) {
                count++;
                const method = match[1].toUpperCase();
                const route = match[2];
                md += `### ${method} ${route}\n`;
                
                // try to find protect/auth
                const lineIndex = content.lastIndexOf('\n', match.index);
                const nextLineIndex = content.indexOf('\n', match.index);
                const line = content.substring(lineIndex, nextLineIndex);
                const isProtected = line.includes('protect') || line.includes('requireAuth') ? 'Yes' : 'No';
                
                md += `- **Authentication:** ${isProtected}\n`;
                md += `- **Method:** ${method}\n`;
                md += `- **Route:** ${route}\n`;
                md += `- **Files Involved:** src/${path.basename(dir)}/${file}\n\n`;
            }
            if (count === 0) {
                md += `*No explicit router.METHOD(...) routes detected via regex*\n\n`;
            }
        }
    }
    
    fs.writeFileSync(path.join(ROOT_DIR, 'API_INVENTORY.md'), md);
}

// --- ARCHITECTURE ANALYSIS ---
function generateArchitectureAnalysis() {
    let md = '# ARCHITECTURE ANALYSIS\n\n';
    
    md += '## System Architecture\n';
    md += 'Based on directory structure and files:\n';
    md += '- **Backend:** Node.js, Express, TypeScript, MongoDB (Mongoose)\n';
    md += '- **Deployment:** Docker (`Dockerfile`, `Dockerfile.prod`), Vercel (`vercel.json`)\n';
    md += '- **Structure:** MVC-like (Controllers, Models, Routes/Routers, Services, Repositories, DTOs)\n';
    md += '- **AI:** Endpoints for AI models (`ai_models_router.ts`, `ai_settings_router.ts`, `ai_assistant_router.ts`)\n\n';
    
    md += '## Application Architecture\n';
    md += 'Separation of concerns is maintained through:\n';
    md += '- `src/routes` / `src/routers`: Route definitions\n';
    md += '- `src/controllers`: Request handlers\n';
    md += '- `src/services`: Business logic\n';
    md += '- `src/repositories`: Database access\n';
    md += '- `src/models`: Mongoose schemas\n\n';
    
    md += '## Flutter Architecture\n';
    const flutterTreePath = path.join(ROOT_DIR, 'flutter_tree.txt');
    if (fs.existsSync(flutterTreePath)) {
        md += 'Flutter application tree is present (`flutter_tree.txt`). Extracting deep architecture requires analyzing `lib/` directory inside `flutter/`.\n\n';
    } else {
        md += '[NOT FOUND IN CODEBASE]\n\n';
    }
    
    fs.writeFileSync(path.join(ROOT_DIR, 'ARCHITECTURE_ANALYSIS.md'), md);
}

console.log('Generating files...');
generateDatabaseInventory();
generateApiInventory();
generateArchitectureAnalysis();
console.log('Done.');
