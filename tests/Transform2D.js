import { BitWorkers } from '../src/BitWorkers.js';
import { BinaryComponent } from '../src/Components/BinaryComponent.js';
import { Transform2DComponent } from '../src/Components/Transform2DComponent.js';

let binaryComponentElementsCount = 2;
let binaryComponentTypeId = BinaryComponent.typesIds.Uint32Array;
let binaryComponentType = BinaryComponent.types[binaryComponentTypeId];
let binaryComponentArrayBuffer = new ArrayBuffer(binaryComponentElementsCount * binaryComponentType.BYTES_PER_ELEMENT);
let binaryComponent = new BinaryComponent(binaryComponentArrayBuffer, binaryComponentTypeId);
binaryComponent.data[0] = 1;
binaryComponent.data[1] = 2;
// console.log('binaryComponent', binaryComponent);


let transform2DComponentElementsCount = 5000000;
let transform2DComponentTypeId = Transform2DComponent.typesIds.Uint32Array;
let transform2DComponentType = Transform2DComponent.types[transform2DComponentTypeId];
let transform2DArrayBuffer = new ArrayBuffer(transform2DComponentElementsCount * transform2DComponentType.BYTES_PER_ELEMENT);
let transform2DComponent = new Transform2DComponent(transform2DArrayBuffer, transform2DComponentTypeId);
transform2DComponent.data[0] = 1;
transform2DComponent.data[1] = 2;

transform2DComponent.data[2] = 0;
transform2DComponent.data[3] = 0;

transform2DComponent.data[4] = 10;
transform2DComponent.data[5] = 10;
// console.log('transform2DComponent', transform2DComponent, transform2DComponent.data);

window.binaryComponent = binaryComponent;
window.transform2DComponent = transform2DComponent;


let data = {
  buffersMeta: [
    {
      typeId: binaryComponent.typeId,
      columns: BinaryComponent.columns,
    },
    {
      typeId: transform2DComponent.typeId,
      columns: Transform2DComponent.columns,
    }
  ]
};
let buffers = [
  binaryComponent.buffer,
  transform2DComponent.buffer
];

const workersCount = 8;
const bitWorkers = new BitWorkers(workersCount);
window.bitWorkers = bitWorkers;
await bitWorkers.init('./src/worker.js',/* { type: 'module' }*/ /* now it's useless */);

console.time(`initModules`);
const moduleDirs = [
  './Systems/Worker'
];
await bitWorkers.initModules([
  'Transform2D'
], {
  moduleDirs
});
console.timeEnd(`initModules`);

const iterations = 4;
for (let i = 0; i < iterations; i++) {
  console.time(`${workersCount} workers ${i + 1}/${iterations} execute`);
  let response = await bitWorkers.execute('Transform2D', { data, buffers, moduleDirs });
  console.timeEnd(`${workersCount} workers ${i + 1}/${iterations} execute`);

  binaryComponent.buffer = response.buffers[0];
  transform2DComponent.buffer = response.buffers[1];
}

console.log(
  '=== Result ===',
  '\nsuccess', transform2DComponent.data.length === transform2DComponentElementsCount,
  // 'binaryComponent', binaryComponent.data,
  '\n\nTransform2DComponent', transform2DComponent.data,
);