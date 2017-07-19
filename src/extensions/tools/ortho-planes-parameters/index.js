import OrthoPlanesParametersWidget from './OrthoPlanesParametersWidget';

/**
 * OrthoPlanesParameters is a controller for updating the OrthoPlanes
 * given the input updates in the OrthoPlanesParametersWidget component.
 * If the scene is updated by other tools like PlaneShifter then inputs are re-updated
 * and callbacks are called to handle this event.
 * If the rotation is reset then callbacks are called in particular for
 * viewports to realign their orientation to the scene.
 */
export default class OrthoPlanesParameters {
  constructor(view) {
    this.sidebarWidget = OrthoPlanesParametersWidget;
    this.scene = view.scene;
    this.sceneUpdateCallbacks = [];
    this.rotationResetCallbacks = [];
  }
  setPlanePos(x, y, z) {
    this.scene.getPlaneSystem().position.set(x, y, z);
  }
  setPlaneRot(x, y, z, rads = false) {
    const rate = rads ? 1.0 : Math.PI / 180.0;
    this.scene.getPlaneSystem().rotation.set(x * rate, y * rate, z * rate);
  }
  updateFromScene() {
    const { position, rotation } = this.scene.getPlaneSystem();
    this.sceneUpdateCallbacks.forEach((f) => { f(position, rotation); });
  }
  onSceneUpdate(callback) {
    this.sceneUpdateCallbacks.push(callback);
  }
  onRotationReset(callback) {
    this.rotationResetCallbacks.push(callback);
  }
}
