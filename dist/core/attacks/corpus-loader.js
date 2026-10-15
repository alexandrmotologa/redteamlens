import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
let cachedProbes = null;
export function getCorpusDirectory() {
    // Resolve relative to current module or project root
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const possiblePaths = [
        path.resolve(currentDir, '../../../attack-corpus'),
        path.resolve(currentDir, '../../attack-corpus'),
        path.resolve(process.cwd(), 'attack-corpus')
    ];
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            return p;
        }
    }
    return path.resolve(process.cwd(), 'attack-corpus');
}
export function loadAllProbes() {
    if (cachedProbes) {
        return cachedProbes;
    }
    const corpusDir = getCorpusDirectory();
    const probes = [];
    if (fs.existsSync(corpusDir)) {
        const files = fs.readdirSync(corpusDir).filter(f => f.endsWith('.json'));
        for (const file of files) {
            try {
                const content = fs.readFileSync(path.join(corpusDir, file), 'utf8');
                const list = JSON.parse(content);
                probes.push(...list);
            }
            catch (err) {
                console.warn(`Failed to parse attack corpus file ${file}:`, err);
            }
        }
    }
    cachedProbes = probes;
    return probes;
}
export function getFilteredProbes(options = {}) {
    let probes = loadAllProbes();
    if (options.categories && options.categories.length > 0) {
        const catSet = new Set(options.categories);
        probes = probes.filter(p => catSet.has(p.category));
    }
    if (options.severities && options.severities.length > 0) {
        const sevSet = new Set(options.severities);
        probes = probes.filter(p => sevSet.has(p.severity));
    }
    if (options.limit && options.limit > 0) {
        probes = probes.slice(0, options.limit);
    }
    return probes;
}
//# sourceMappingURL=corpus-loader.js.map