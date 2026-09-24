const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

const walkSync = function(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const files = walkSync('./src').filter(f => f.endsWith('.jsx'));
const cyrillicRegex = /[\u0400-\u04FF]+/;
let dictionary = {};
let keyCounter = 1;

files.forEach(file => {
  if (file.includes('SettingsModal.jsx') || file.includes('DrawerMenu.jsx')) return;
  
  let code = fs.readFileSync(file, 'utf8');
  if (!cyrillicRegex.test(code)) return;

  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx']
  });

  let needsTranslation = false;
  let hasUseTranslationImport = false;

  traverse(ast, {
    ImportDeclaration(p) {
      if (p.node.source.value === 'react-i18next') {
        hasUseTranslationImport = true;
      }
    },
    JSXText(p) {
      if (cyrillicRegex.test(p.node.value)) {
        const text = p.node.value.trim();
        if (!text) return;
        
        let key = Object.keys(dictionary).find(k => dictionary[k] === text);
        if (!key) {
            key = `t_${keyCounter++}`;
            dictionary[key] = text;
        }

        p.replaceWith(
          t.jsxExpressionContainer(
            t.callExpression(t.identifier('t'), [
              t.stringLiteral(`auto.${key}`),
              t.stringLiteral(text)
            ])
          )
        );
        needsTranslation = true;
      }
    },
    JSXAttribute(p) {
        if (p.node.value && p.node.value.type === 'StringLiteral' && cyrillicRegex.test(p.node.value.value)) {
            const attrNames = ['placeholder', 'label', 'title', 'alt'];
            if (attrNames.includes(p.node.name.name)) {
                const text = p.node.value.value;
                let key = Object.keys(dictionary).find(k => dictionary[k] === text);
                if (!key) {
                    key = `t_${keyCounter++}`;
                    dictionary[key] = text;
                }
                
                p.get('value').replaceWith(
                  t.jsxExpressionContainer(
                    t.callExpression(t.identifier('t'), [
                      t.stringLiteral(`auto.${key}`),
                      t.stringLiteral(text)
                    ])
                  )
                );
                needsTranslation = true;
            }
        }
    }
  });

  if (needsTranslation) {
      // Find components to inject const { t } = useTranslation();
      traverse(ast, {
          VariableDeclarator(p) {
              if (p.node.id.type === 'Identifier' && /^[A-Z]/.test(p.node.id.name)) {
                  if (p.node.init && (p.node.init.type === 'ArrowFunctionExpression' || p.node.init.type === 'FunctionExpression')) {
                      injectHook(p.get('init.body'));
                  } else if (p.node.init && p.node.init.type === 'CallExpression' && p.node.init.callee.name === 'memo') {
                      if (p.node.init.arguments[0] && (p.node.init.arguments[0].type === 'FunctionExpression' || p.node.init.arguments[0].type === 'ArrowFunctionExpression')) {
                          injectHook(p.get('init.arguments.0.body'));
                      }
                  }
              }
          },
          FunctionDeclaration(p) {
              if (p.node.id && /^[A-Z]/.test(p.node.id.name)) {
                  injectHook(p.get('body'));
              }
          }
      });

      function injectHook(bodyPath) {
          if (bodyPath.node.type === 'BlockStatement') {
              const hasHook = bodyPath.node.body.some(stmt => 
                  stmt.type === 'VariableDeclaration' && 
                  stmt.declarations[0].id.type === 'ObjectPattern' &&
                  stmt.declarations[0].id.properties.some(prop => prop.key && prop.key.name === 't')
              );
              if (!hasHook) {
                  bodyPath.unshiftContainer('body', 
                      t.variableDeclaration('const', [
                          t.variableDeclarator(
                              t.objectPattern([
                                  t.objectProperty(t.identifier('t'), t.identifier('t'), false, true)
                              ]),
                              t.callExpression(t.identifier('useTranslation'), [])
                          )
                      ])
                  );
              }
          }
      }

      if (!hasUseTranslationImport) {
          ast.program.body.unshift(
              t.importDeclaration(
                  [t.importSpecifier(t.identifier('useTranslation'), t.identifier('useTranslation'))],
                  t.stringLiteral('react-i18next')
              )
          );
      }

      const output = generate(ast, { retainLines: true }, code);
      fs.writeFileSync(file, output.code);
      console.log(`Updated ${file}`);
  }
});

fs.writeFileSync('extracted_strings.json', JSON.stringify(dictionary, null, 2));
console.log('Extraction and replacement complete!');
