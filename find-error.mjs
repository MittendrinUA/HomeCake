import fs from 'fs';
import { SourceMapConsumer } from 'source-map';

async function run() {
  const files = fs.readdirSync('dist/assets');
  const jsFile = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
  const mapFile = jsFile + '.map';
  
  const rawSourceMap = JSON.parse(fs.readFileSync('dist/assets/' + mapFile, 'utf8'));
  
  await SourceMapConsumer.with(rawSourceMap, null, consumer => {
    // We check line 17 at various columns to see what variables are there
    console.log('--- LINE 17 MAPPINGS ---');
    let prevName = null;
    let prevSource = null;
    let prevLine = null;
    for (let col = 0; col < 100000; col += 100) {
      const pos = consumer.originalPositionFor({
        line: 17,
        column: col
      });
      
      if (pos.source) {
        if (pos.name !== prevName || pos.source !== prevSource || pos.line !== prevLine) {
          console.log(`Col ${col}: ${pos.source}:${pos.line}:${pos.column} -> ${pos.name}`);
          prevName = pos.name;
          prevSource = pos.source;
          prevLine = pos.line;
        }
      }
    }
  });
}

run().catch(console.error);
