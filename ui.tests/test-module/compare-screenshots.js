#!/usr/bin/env node
/**
 * Visual Regression Comparison Script
 * Compares current screenshots against baseline
 * 
 * Usage: node compare-screenshots.js
 */

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

const BASELINE_DIR = path.join(__dirname, 'cypress/screenshots/baseline');
const CURRENT_DIR = path.join(__dirname, 'cypress/screenshots');
const OUTPUT_DIR = path.join(__dirname, 'cypress/screenshots/diff');

const THRESHOLD = 0.1; // 10% pixel difference allowed

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function readImage(filePath) {
    return new Promise((resolve, reject) => {
        const buffer = fs.readFileSync(filePath);
        const png = new PNG();
        png.parse(buffer, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });
}

async function compareImages(baselinePath, currentPath, diffPath) {
    try {
        const baseline = await readImage(baselinePath);
        const current = await readImage(currentPath);
        
        if (baseline.width !== current.width || baseline.height !== current.height) {
            return { 
                match: false, 
                error: `Dimension mismatch: ${baseline.width}x${baseline.height} vs ${current.width}x${current.height}`
            };
        }
        
        const diff = new PNG({ width: baseline.width, height: baseline.height });
        const numDiffPixels = pixelmatch(
            baseline.data, 
            current.data, 
            diff.data, 
            baseline.width, 
            baseline.height, 
            { threshold: THRESHOLD, diffColor: [255, 0, 0] }
        );
        
        const totalPixels = baseline.width * baseline.height;
        const diffPercentage = (numDiffPixels / totalPixels) * 100;
        
        // Save diff image
        diff.pack().pipe(fs.createWriteStream(diffPath));
        
        return {
            match: diffPercentage <= (THRESHOLD * 100),
            diffPixels: numDiffPixels,
            totalPixels,
            diffPercentage: diffPercentage.toFixed(2)
        };
    } catch (err) {
        return { match: false, error: err.message };
    }
}

async function runComparison() {
    ensureDir(BASELINE_DIR);
    ensureDir(OUTPUT_DIR);
    
    const baselineFiles = fs.readdirSync(BASELINE_DIR).filter(f => f.endsWith('.png'));
    
    if (baselineFiles.length === 0) {
        console.log('No baseline screenshots found. Run tests first with update=true');
        console.log('To create baseline: npm run test:update');
        return;
    }
    
    console.log('\n🖼️  Visual Regression Comparison');
    console.log('================================\n');
    
    let passed = 0;
    let failed = 0;
    const results = [];
    
    for (const baselineFile of baselineFiles) {
        const currentFile = baselineFile.replace('baseline-', '');
        const baselinePath = path.join(BASELINE_DIR, baselineFile);
        const currentPath = path.join(CURRENT_DIR, currentFile);
        const diffPath = path.join(OUTPUT_DIR, `diff-${currentFile}`);
        
        if (!fs.existsSync(currentPath)) {
            console.log(`⚠️  ${currentFile}: No current screenshot found`);
            failed++;
            results.push({ file: currentFile, status: 'missing' });
            continue;
        }
        
        const result = await compareImages(baselinePath, currentPath, diffPath);
        
        if (result.match) {
            console.log(`✅ ${currentFile}: PASS (${result.diffPercentage}% different)`);
            passed++;
        } else if (result.error) {
            console.log(`❌ ${currentFile}: ERROR - ${result.error}`);
            failed++;
        } else {
            console.log(`❌ ${currentFile}: FAIL (${result.diffPercentage}% different, ${result.diffPixels} pixels)`);
            failed++;
        }
        
        results.push({ file: currentFile, ...result });
    }
    
    console.log('\n================================');
    console.log(`Results: ${passed} passed, ${failed} failed\n`);
    
    if (failed > 0) {
        console.log('To update baselines, run: npm run test:update');
        process.exit(1);
    }
    
    process.exit(0);
}

runComparison().catch(console.error);
