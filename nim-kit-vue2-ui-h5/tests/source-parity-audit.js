const fs = require("node:fs");
const path = require("node:path");
const babelParser = require("@babel/parser");
const vue2Compiler = require("vue-template-compiler");
const vue3Compiler = require("../../im-kit-vue-ui-h5/node_modules/@vue/compiler-sfc");

const vue2Root = path.resolve(__dirname, "../src");
const vue3Root = path.resolve(__dirname, "../../im-kit-vue-ui-h5/src");

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
}

function parseJavaScript(source, typescript = false) {
  return babelParser.parse(source, {
    sourceType: "module",
    plugins: typescript ? ["typescript"] : [],
  });
}

function propertyName(property) {
  if (!property || property.computed) {
    return null;
  }
  return property.key && (property.key.name || property.key.value);
}

function getVue3Info(file) {
  const source = fs.readFileSync(file, "utf8");
  const descriptor = vue3Compiler.parse(source).descriptor;
  const script = descriptor.scriptSetup || descriptor.script;
  const info = { functions: [], computed: [], state: [] };
  if (!script) {
    return info;
  }

  const ast = parseJavaScript(script.content, script.lang === "ts");
  for (const node of ast.program.body) {
    if (node.type === "FunctionDeclaration" && node.id) {
      info.functions.push(node.id.name);
    }
    if (node.type !== "VariableDeclaration") {
      continue;
    }
    for (const declaration of node.declarations) {
      if (declaration.id.type !== "Identifier" || !declaration.init) {
        continue;
      }
      const name = declaration.id.name;
      const init = declaration.init;
      if (["ArrowFunctionExpression", "FunctionExpression"].includes(init.type)) {
        info.functions.push(name);
      }
      if (
        init.type === "CallExpression" &&
        init.callee.type === "Identifier"
      ) {
        if (init.callee.name === "computed") {
          info.computed.push(name);
        }
        if (["ref", "reactive"].includes(init.callee.name)) {
          info.state.push(name);
        }
      }
    }
  }
  return info;
}

function objectKeys(node) {
  return node && node.type === "ObjectExpression"
    ? node.properties.map(propertyName).filter(Boolean)
    : [];
}

function getVue2Info(file) {
  const source = fs.readFileSync(file, "utf8");
  const script = vue2Compiler.parseComponent(source).script;
  const info = { methods: [], computed: [], state: [] };
  if (!script) {
    return info;
  }

  const ast = parseJavaScript(script.content);
  const exportNode = ast.program.body.find(
    (node) => node.type === "ExportDefaultDeclaration"
  );
  if (!exportNode || exportNode.declaration.type !== "ObjectExpression") {
    return info;
  }

  for (const property of exportNode.declaration.properties) {
    const name = propertyName(property);
    if (name === "methods") {
      info.methods = objectKeys(property.value);
    } else if (name === "computed") {
      info.computed = objectKeys(property.value);
    } else if (name === "data") {
      const body =
        property.type === "ObjectMethod" ? property.body : property.value.body;
      const returnNode =
        body &&
        body.body &&
        body.body.find((node) => node.type === "ReturnStatement");
      info.state = objectKeys(returnNode && returnNode.argument);
    }
  }
  return info;
}

const failures = [];
for (const vue2File of walk(vue2Root).filter((file) => file.endsWith(".vue"))) {
  const relativeFile = path.relative(vue2Root, vue2File);
  const vue3File = path.join(vue3Root, relativeFile);
  if (!fs.existsSync(vue3File)) {
    continue;
  }

  const vue3 = getVue3Info(vue3File);
  const vue2 = getVue2Info(vue2File);
  const missingFunctions = vue3.functions.filter(
    (name) => !vue2.methods.includes(name)
  );
  const missingComputed = vue3.computed.filter(
    (name) => !vue2.computed.includes(name)
  );
  const missingState = vue3.state.filter(
    (name) => !vue2.state.includes(name) && !vue2.computed.includes(name)
  );

  if (missingFunctions.length || missingComputed.length || missingState.length) {
    failures.push({
      file: relativeFile,
      missingFunctions,
      missingComputed,
      missingState,
    });
  }
}

process.stdout.write(JSON.stringify(failures, null, 2) + "\n");
process.exitCode = failures.length ? 1 : 0;
