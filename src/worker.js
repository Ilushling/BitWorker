let workerId = 0;
let modules = new Map();
let moduleDirs = new Set(/*['./Systems/Worker']*/);
self.moduleDirs = moduleDirs;

onmessage = async event => {
    const action = event.data.action;
    let data = event.data.data;
    let buffers = event.data.buffers;

    switch (action) {
        case 'init':
            workerId = event.data.id;
            break;
        case 'initModules':
            const modulesToInit = event.data.modules;

            if (moduleDirs) {
                addModuleDirs(event.data.moduleDirs);
            }
            for (let i = modules.length; i--;) {
                initModule(modulesToInit[i]);
            }
            break;
        case 'execute':
            const moduleName = event.data.moduleName;

            if (moduleDirs) {
                addModuleDirs(event.data.moduleDirs);
            }
            const Module = initModule(moduleName);
            if (Module) {
                ({ data, buffers } = await Module.execute(data, buffers));
            }
            break;
    }

    return postMessage({
        workerId,
        action,
        data,
        buffers
    }, buffers);
};

function addModuleDirs(modulesDirsToInit) {
    modulesDirsToInit.forEach(moduleDir => moduleDirs.add(moduleDir));
}

function initModule(moduleName) {
    let Module;

    // For use in module, put class to self context
    self.moduleName = moduleName;
    if (!modules.has(moduleName)) {
        // Import in workers
        moduleDirs.forEach(moduleDir => {
            if (Module) {
                return;
            }
            const modulePath = `${moduleDir}/${moduleName}.js`;

            // const { [moduleName]: Module } = await import(modulePath);

            importScripts(modulePath);
            // After load, script should execute - self[self.moduleName] = [ClassName];

            // Get [ClassName] from script
            Module = self[moduleName];
        });

        Module = new Module();

        modules.set(moduleName, Module);
    } else {
        Module = modules.get(moduleName);
    }

    return Module;
}