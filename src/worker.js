onmessage = async event => {
  const action = event.data.action;
  let data = event.data.data;
  let buffers = event.data.buffers;

  switch (action) {
    case 'init':
      globalThis.workerId = event.data.id;

      globalThis.modules = new Map();
      globalThis.moduleDirs = new Set(/*['./Systems/Worker']*/);
      
      globalThis.data = {};
      break;
    case 'initModules':
      initModules(event.data.modules, event.data.moduleDirs);
      break;
    case 'execute':
      ({ data, buffers } = await execute({ moduleName: event.data.moduleName, data, buffers }));
      break;
  }

  return postMessage({
    workerId: globalThis.workerId,

    action,

    data,
    buffers
  }, buffers);
};

/**
 * @param {Array} modules
 * @param {Array} moduleDirs
 */
function initModules(modules, moduleDirs) {
  if (Array.isArray(moduleDirs)) {
    addModuleDirs(moduleDirs);
  }

  for (const module of modules) {
    initModule(module);
  }
}

/**
 * @param {Array} moduleDirs
 */
function addModuleDirs(moduleDirs) {
  for (const modulesDir of moduleDirs) {
    globalThis.moduleDirs.add(modulesDir);
  }
}

/**
 * @param {string} moduleName 
 * @returns {object} Module
 */
/*async */function initModule(moduleName) {
  let Module;
  let module;

  if (globalThis.modules.has(moduleName)) {
    return globalThis.modules.get(moduleName);
  }

  // For use in module, put class to globalThis context
  globalThis.moduleName = moduleName;
  for (const moduleDir of globalThis.moduleDirs) {
    const modulePath = `${moduleDir}/${moduleName}.js`;

    // const { [moduleName]: Module } = await import(modulePath);

    globalThis.importScripts(modulePath);
    // After load, script should execute - globalThis[globalThis.moduleName] = [ClassName];

    // Get [ClassName] from script
    Module = globalThis[moduleName];

    if (Module) {
      break;
    }
  }

  if (Module) {
    module = new Module();

    globalThis.modules.set(moduleName, module);

    return module;
  }
}

/**
 * @param {object} params 
 * @param {string} params.moduleName
 * @param {object} params.data
 * @param {Array} params.buffers
 * @returns {object} data
 * @returns {object} data.data
 * @returns {Array} data.buffers
 */
async function execute({ moduleName, data, buffers }) {
  const module = initModule(moduleName);
  if (module) {
    ({ data, buffers } = await module.execute(data, buffers));
  }

  return { data, buffers };
}