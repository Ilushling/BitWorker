class BinaryComponent {
    static typesIds = {
        Array: 0,
        Int8Array: 1,
        Uint8Array: 2,
        Int16Array: 3,
        Uint16Array: 4,
        Int32Array: 5,
        Uint32Array: 6,
        Float32Array: 7,
        Float64Array: 8,
        BigInt64Array: 9,
        BigUint64Array: 10
    }

    static types = [
        Array,         // 0
        Int8Array,     // 1
        Uint8Array,    // 2
        Int16Array,    // 3
        Uint16Array,   // 4
        Int32Array,    // 5
        Uint32Array,   // 6
        Float32Array,  // 7
        Float64Array,  // 8
        BigInt64Array, // 9
        BigUint64Array // 10
    ]

    static columns = 1;

    constructor(buffer = new ArrayBuffer(), typeId = BinaryComponent.typesIds.Uint32Array) {
        this.typeId = typeId;
        this.Type = BinaryComponent.types[typeId];

        if (buffer instanceof ArrayBuffer) {
            this._buffer = buffer;
            this.data = new this.Type(this._buffer);
        } else if (Array.isArray(buffer)) {
            // Buffer is not buffer. buffer == [...];
            this.data = new this.Type(this.buffer);
            this._buffer = this.data.buffer;
        }
    }

    get buffer() {
        return this._buffer;
    }

    set buffer(value) {
        this._buffer = value;
        this.data = new this.Type(value);
    }
}