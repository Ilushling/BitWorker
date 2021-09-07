// Import in workers
typeof BinaryComponent === 'undefined' && importScripts('./BinaryComponent.js');

class Transform2DComponent extends BinaryComponent {
    static columns = 6; // PositionX, PositionY, RotateX, RotateY, ScaleX, ScaleY

    constructor(buffer, typeId = BinaryComponent.typesIds.Uint32Array) {
        super(buffer, typeId);
    }
}