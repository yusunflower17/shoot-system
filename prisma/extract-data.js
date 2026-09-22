const https = require('https');
const fs = require('fs');

const url = 'https://bucolic-maamoul-d1fe02.netlify.app/js/app.js';
https.get(url, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('app.js length:', d.length);
    fs.writeFileSync('prisma/app.js', d);
    
    // Look for data - the site stores bike catalog in a big object
    // Try multiple patterns
    const patterns = [
      /window\.__[A-Z_]+__\s*=\s*(\{[\s\S]+\});/,
      /const\s+\w+\s*=\s*(\[\s*\{[\s\S]{500,}?\}\s*\])/,
      /let\s+\w+\s*=\s*(\[\s*\{[\s\S]{500,}?\}\s*\])/,
      /var\s+\w+\s*=\s*(\[\s*\{[\s\S]{500,}?\}\s*\])/,
      /data\s*[:=]\s*(\[\s*\{[\s\S]{500,}?\}\s*\])/,
      /models?\s*[:=]\s*(\[\s*\{[\s\S]{500,}?\}\s*\])/,
      /catalog\s*[:=]\s*(\[\s*\{[\s\S]{500,}?\}\s*\])/,
    ];
    
    for (const p of patterns) {
      const m = d.match(p);
      if (m) {
        console.log('\nFOUND pattern:', p.toString().substring(0, 50));
        console.log('Match length:', m[1].length);
        console.log('First 200 chars:', m[1].substring(0, 200));
        // Try to parse it
        try {
          const obj = JSON.parse(m[1]);
          console.log('Parsed! Type:', Array.isArray(obj) ? 'array len=' + obj.length : 'object keys=' + Object.keys(obj).length);
          fs.writeFileSync('prisma/extracted-data.json', JSON.stringify(obj, null, 2));
          console.log('Saved extracted-data.json');
        } catch(e) {
          console.log('JSON parse failed:', e.message);
        }
      }
    }
    
    // Also check if there are separate JSON files
    const jsonRefs = d.match(/['"]([^'"]+\.json)['"]/g) || [];
    console.log('\nJSON file refs:', jsonRefs);
    
    // Check for fetch calls
    const fetchRefs = d.match(/fetch\(['"]([^'"]+)['"]\)/g) || [];
    console.log('Fetch calls:', fetchRefs);
    
    // Look for WheelTop, R7120 etc. to find config area
    const wtIdx = d.indexOf('WheelTop');
    if (wtIdx > -1) {
      console.log('\nWheelTop found at', wtIdx);
      console.log('Context:', d.substring(Math.max(0, wtIdx-100), wtIdx+300));
    }
    
    const r7120Idx = d.indexOf('R7120');
    if (r7120Idx > -1) {
      console.log('\nR7120 found at', r7120Idx);
      console.log('Context:', d.substring(Math.max(0, r7120Idx-100), r7120Idx+300));
    }
  });
}).on('error', e => console.error(e));
