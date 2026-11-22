import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

/**
 * Prevent browser-native confirmation / alert / prompt windows from being
 * reintroduced. Use the application's accessible Dialog / AlertDialog instead.
 */
const extensions = /\.(?:js|jsx|ts|tsx|mjs)$/;
const paths = ['src'];
const violations = [];

async function scan(folder) {
  for (const item of await readdir(folder, {withFileTypes:true})) {
    const file = path.join(folder,item.name);
    if(item.isDirectory()) { await scan(file); continue; }
    if(!item.isFile() || !extensions.test(item.name)) continue;
    const source = await readFile(file,'utf8');
    // TS/JS parser instead of regex-only text searching avoids false alarms
    // from documentation strings or method names on unrelated objects.
    const sf = ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,
      /\.tsx?$/.test(file)?ts.ScriptKind.TSX:ts.ScriptKind.JSX);
    function visit(node) {
      if(ts.isCallExpression(node)){
        const expr=node.expression;
        const bare=ts.isIdentifier(expr) && ['confirm','alert','prompt'].includes(expr.text);
        const global=ts.isPropertyAccessExpression(expr) &&
          ts.isIdentifier(expr.expression) && ['window','globalThis'].includes(expr.expression.text) &&
          ['confirm','alert','prompt'].includes(expr.name.text);
        if(bare||global){
          const lc=sf.getLineAndCharacterOfPosition(node.getStart(sf));
          violations.push(`${file}:${lc.line+1} browser-native ${expr.getText(sf)}()`);
        }
      }
      ts.forEachChild(node,visit);
    }
    visit(sf);
  }
}
for(const folder of paths) await scan(folder);
if(violations.length){
 console.error('Use an in-app confirmation/modal, not browser-native dialogs:\n'+violations.join('\n'));
 process.exitCode=1;
}else{
 console.log('Pass: no browser-native confirm(), alert(), or prompt() in src.');
}
