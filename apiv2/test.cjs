const fs = require('fs');

function extractFunctionsFromFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const functionRegex = /(?:async\s+)?([a-zA-Z_$][0-9a-zA-Z_$]*)\s*\([^)]*\)\s*{([^}]*)}/g;

  var functionDefinitions = [];
  let match;
  while ((match = functionRegex.exec(fileContent)) !== null) {
    const functionName = match[1];
    const functionBlock = match[2];
    //console.log(12, functionName);
    functionDefinitions.push(functionName);
  }

  functionDefinitions = [ ... new Set(functionDefinitions) ];
	const reservedKeywords = [
	  'constructor',
	  'break',
	  'case',
	  'catch',
	  'class',
	  'const',
	  'continue',
	  'debugger',
	  'default',
	  'delete',
	  'do',
	  'else',
	  'export',
	  'extends',
	  'finally',
	  'for',
	  'function',
	  'if',
	  'import',
	  'in',
	  'instanceof',
	  'new',
	  'return',
	  'super',
	  'switch',
	  'this',
	  'throw',
	  'try',
	  'typeof',
	  'var',
	  'void',
	  'while',
	  'with',
	  'yield'
	];

  functionDefinitions = functionDefinitions.filter(func => !reservedKeywords.includes(func));

  return functionDefinitions;
}

// Example usage
const filePath = '1.0/endpoints/chatgpt/chatgpt.js';

const functions = extractFunctionsFromFile(filePath);
console.log(functions);
