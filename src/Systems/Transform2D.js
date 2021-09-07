import { BinaryComponent } from '../Components/BinaryComponent.js';
import { Transform2DComponent } from '../Components/Transform2DComponent.js';

export class Transform2D {
    execute(data, buffers) {
        // const binaryComponent = new BinaryComponent(buffers[0]);
        // const bufferMeta = this.data.buffersMeta[bufferI];
        // const typeId = bufferMeta.typeId;
        // const binaryComponentType = BinaryComponent.types[typeId];

        const binaryTransformBufferId = 1;
        const binaryTransformBuffer = buffers[binaryTransformBufferId];
        const binaryTransform = new Transform2DComponent(binaryTransformBuffer);
        const binaryTransformBufferMeta = data.buffersMeta[binaryTransformBufferId];
        const binaryTransformTypeId = binaryTransformBufferMeta.typeId;
        const binaryComponentType = BinaryComponent.types[binaryTransformTypeId];

        const columns = binaryTransformBufferMeta.columns;
        const rows = binaryTransformBuffer.byteLength / binaryComponentType.BYTES_PER_ELEMENT;

        // console.log('columns', columns, 'rows', rows);

        for (let row = 0; row < rows;) {
            binaryTransform.data[row] += 1; // X
            binaryTransform.data[row + 1] += 10; // Y
            // Math.floor(Math.ceil(Math.cos(Math.random() * 90)));

            row += columns;
        }

        return { data, buffers };
    }
}