import { BinaryComponent } from './Components/BinaryComponent.js';

export class BitWorkers {
  constructor(count = 8) {
    this.count = count;

    this.workers = [];
    this.executedWorkers = new Uint8Array(count);

    this.data = {};
    this.buffers = [];

    this.dataParts = [];
    this.buffersParts = [];
  }

  async init(workerPath = (new URL('./worker.js', import.meta.url)).pathname, options) {
    let i = this.count;
    if (i < 1) {
      return;
    }

    while (i--) {
      const worker = new Worker(workerPath, options);
      this.workers[i] = worker;
    }

    await this.initWorkers();
  }

  initWorkers() {
    return new Promise(resolve => {
      let i = this.count;
      if (i < 1) {
        return;
      }

      while (i--) {
        const worker = this.workers[i];

        this.initListener(worker);

        worker.postMessage({ action: 'init', id: i });
        this.executedWorkers[i] = 1;
      }

      this.resolve = resolve;
    });
  }

  initListener(worker) {
    worker.onmessage = event => {
      const workerId = event.data.workerId;
      const action = event.data.action;
      const data = event.data.data;
      const buffers = event.data.buffers;

      this.dataParts[workerId] = data;
      this.buffersParts[workerId] = buffers;

      this.executedWorkers[workerId] = 0;

      if (this.executedWorkers.every(executedWorker => executedWorker === 0)) {
        // Every worker responded
        if (action === 'execute') {
          // Workers handled module execution
          if (Array.isArray(this.buffers)) {
            this.buffers = this.mergeArrayBuffersParts(this.buffers, this.buffersParts);
          }

          return this.resolve({ data: this.dataParts, buffers: this.buffers });
        }

        return this.resolve();
      }
    }
  }

  initModules(modules, options) {
    return new Promise(resolve => {
      let i = this.count;
      if (i < 1) {
        return;
      }

      while (i--) {
        const worker = this.workers[i];
        worker.postMessage({
          action: 'initModules',
          modules,
          moduleDirs: options.moduleDirs
        });
        this.executedWorkers[i] = 1;
      }

      this.resolve = resolve;
    });
  }

  mergeArrayBuffersParts(buffers, buffersParts) {
    return buffers.map((buffer, bufferI) => {
      const bufferMeta = this.data.buffersMeta[bufferI];

      const typeId = bufferMeta.typeId;
      const Type = BinaryComponent.types[typeId];

      let bufferPartsLength = 0;
      buffersParts.forEach(bufferParts => {
        bufferPartsLength += bufferParts[bufferI].byteLength / Type.BYTES_PER_ELEMENT;
      });

      const newPart = new Type(bufferPartsLength);
      let offset = 0;
      buffersParts.forEach(bufferParts => {
        const bufferPart = bufferParts[bufferI];
        const part = new Type(bufferPart);
        // Set is slow because it copying section buffer. If replace copying with detaching memory by chunks, it will be faster (buffer section transfer)
        // At the time of writing this code, JS does not support buffer section transfer
        // @TODO check from time to time if buffer section can be transferred
        newPart.set(part, offset);
        offset += bufferPart.byteLength / Type.BYTES_PER_ELEMENT;
      });

      return newPart.buffer;
    });
  }

  setData(data) {
    this.data = data;
  }

  setBuffers(buffers) {
    this.buffers = buffers;
  }

  execute(moduleName, options) {
    return new Promise(resolve => {
      this.setData(options.data);
      this.setBuffers(options.buffers);

      this.buffersParts = [];

      const workersCount = this.count;
      let workerI = workersCount;
      if (workerI < 1) {
        return;
      }

      while (workerI--) {
        const buffersPart = [];

        let bufferI = this.buffers?.length;
        if (bufferI > 0) {
          while (bufferI--) {
            const buffer = this.buffers[bufferI];
            const bufferMeta = this.data.buffersMeta[bufferI];

            const typeId = bufferMeta.typeId;
            const Type = BinaryComponent.types[typeId];

            const typedArrayLength = buffer.byteLength / Type.BYTES_PER_ELEMENT; // cells
            const columns = bufferMeta.columns;
            // const rows = typedArrayLength / columns;

            const rowsToWorkerRaw = typedArrayLength / workersCount;
            const remain = rowsToWorkerRaw % columns;
            const lastRemain = Math.round(remain * workersCount); // Math.round prevents 3.333333...333286 cases. Can bitwise ceil?
            const rowsToWorker = rowsToWorkerRaw - remain;

            // console.log('bufferI', bufferI, {
            //   typedArrayLength,
            //   workersCount,
            //   rowsToWorkerRaw,
            //   remain,
            //   lastRemain,
            //   rowsToWorker
            // });
            // console.log('workerI', workerI, new Type(buffer));

            // 1
            const start = rowsToWorker * workerI;
            const limit = start + rowsToWorker + (workerI === workersCount - 1 ? lastRemain : 0);
            // Slice is slow because it copying section buffer. If replace copying with detaching memory by chunks, it will be faster (buffer section transfer)
            // At the time of writing this code, JS does not support buffer section transfer
            // @TODO check from time to time if buffer section can be transferred
            const bufferPart = buffer.slice(start * Type.BYTES_PER_ELEMENT, limit * Type.BYTES_PER_ELEMENT);
            buffersPart[bufferI] = bufferPart;

            // 2
            // const start = rowsToWorker * workerI;
            // const limit = rowsToWorker + (workerI === workersCount - 1 ? lastRemain : 0);

            // const chunk = new Type(limit);
            // const bufferPart = new Type(buffer, start * Type.BYTES_PER_ELEMENT, limit);
            // chunk.set(bufferPart);
            // buffersPart[bufferI] = chunk.buffer;

            // 3
            // const start = rowsToWorker * workerI;
            // const limit = rowsToWorker + (workerI === workersCount - 1 ? lastRemain : 0);

            // console.log('total', buffer.byteLength / Type.BYTES_PER_ELEMENT, 'from', start, 'to', limit);
            // const bufferPart = new Type(buffer, start * Type.BYTES_PER_ELEMENT, limit);
            // buffersPart[bufferI] = bufferPart;
          }
        }

        this.workers[workerI].postMessage({
          action: 'execute',
          moduleName,
          moduleDirs: options.moduleDirs,
          data: this.data,
          buffers: buffersPart,
        }, buffersPart);

        this.executedWorkers[workerI] = 1;
      }

      this.resolve = resolve;
    });
  }

  remove(worker) {
    // worker.terminate();
    // this.count--;
  }
}