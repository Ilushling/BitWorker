// Import in workers
importScripts('./Components/Worker/BinaryComponent.js', './Components/Worker/Transform2DComponent.js');

class Transform2D {
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

        const rows = binaryTransformBuffer.byteLength / binaryComponentType.BYTES_PER_ELEMENT;
        const columns = binaryTransformBufferMeta.columns;
        const count = rows * columns;

        if (count === 0) {
            return { data, buffers };
        }

        // console.log('columns', columns, 'rows', rows, 'count', count);

        for (let row = 0; row < rows;) {
            binaryTransform.data[row] += 1; // X
            binaryTransform.data[row + 1] += 1; // Y

            // Hard computations...
            let a = 0;
            let b = 0;
            for (let i = 0; i < 10; i++) {
                a = Math.abs(Math.ceil(Math.sin(Math.random() * 360) * 10));
                b = Math.abs(Math.ceil(Math.cos(Math.random() * 360) * 10));
                if (a + 0.1 < b + 0.2 || b + 0.1 < a + 0.2) {
                    a += Math.abs(Math.ceil(Math.sin(Math.random() * 360) * 10));
                }
                if (a + 0.1 > b + 0.2 || b + 0.1 > a + 0.2) {
                    b += Math.abs(Math.ceil(Math.cos(Math.random() * 360) * 10));
                }
            }

            binaryTransform.data[row] += a; // X
            binaryTransform.data[row + 1] += b; // Y

            row += columns;
        }

        // let row = count;
        // while (row -= columns) {
        //     binaryTransform.data[row] += 1; // X
        //     binaryTransform.data[row + 1] += 10; // Y
        //     // Math.floor(Math.ceil(Math.cos(Math.random() * 90)));
        // }

        return { data, buffers };
    }
}

self[self.moduleName] = Transform2D;