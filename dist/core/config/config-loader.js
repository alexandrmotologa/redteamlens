import fs from 'node:fs';
import path from 'node:path';
export class ConfigLoader {
    static findConfigFile(customPath) {
        if (customPath && fs.existsSync(customPath)) {
            return path.resolve(customPath);
        }
        const candidateFiles = [
            'redteamlens.config.json',
            '.redteamlensrc',
            '.redteamlens.json',
            'redteamlens.json'
        ];
        for (const name of candidateFiles) {
            const fullPath = path.resolve(process.cwd(), name);
            if (fs.existsSync(fullPath)) {
                return fullPath;
            }
        }
        return null;
    }
    static loadConfig(customPath) {
        const configPath = ConfigLoader.findConfigFile(customPath);
        if (!configPath) {
            return {};
        }
        try {
            const raw = fs.readFileSync(configPath, 'utf8');
            const parsed = JSON.parse(raw);
            // If customProbesDir defined, load extra probes
            if (parsed.customProbesDir) {
                const fullDir = path.resolve(path.dirname(configPath), parsed.customProbesDir);
                if (fs.existsSync(fullDir)) {
                    const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.json'));
                    const loaded = [];
                    for (const file of files) {
                        try {
                            const content = fs.readFileSync(path.join(fullDir, file), 'utf8');
                            const list = JSON.parse(content);
                            loaded.push(...list);
                        }
                        catch (err) {
                            console.warn(`Failed to parse custom probe file ${file}:`, err);
                        }
                    }
                    parsed.customProbes = [...(parsed.customProbes || []), ...loaded];
                }
            }
            return parsed;
        }
        catch (err) {
            console.warn(`Warning: Could not parse configuration file ${configPath}: ${err.message}`);
            return {};
        }
    }
}
//# sourceMappingURL=config-loader.js.map