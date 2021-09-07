let workerId = 0;
let modules = new Map();

onmessage = async event => {
    const action = event.data.action;
    let data = event.data.data;
    let buffers = event.data.buffers;

    switch (action) {
        case 'init':
            workerId = event.data.id;
            break;
        case 'initModules':
            const modules = event.data.modules;
            for (let i = 0; i < modules.length; i++) {
                initModule(modules[i]);
            }
            break;
        case 'execute':
            const moduleName = event.data.moduleName;
            const module = initModule(moduleName);
            ({ data, buffers } = await module.execute(data, buffers));
            break;
    }

    return postMessage({
        workerId,
        action,
        data,
        buffers
    }, buffers);
};

function initModule(moduleName) {
    let module;

    // For use in module, put class to self context
    self.moduleName = moduleName;
    if (!modules.has(moduleName)) {
        // const { [moduleName]: module } = await import(`./Systems/${moduleName}.js`);

        // Import in workers
        // After load, script should execute - self[self.moduleName] = [ClassName];
        importScripts(`./Systems/Worker/${moduleName}.js`);
        // Get [ClassName] from script
        module = self[moduleName];
        module = new module();

        modules.set(moduleName, module);
    } else {
        module = modules.get(moduleName);
    }

    return module;
}