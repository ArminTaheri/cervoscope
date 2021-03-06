import R from 'ramda';

import Application from './Application';

// Applications
import BrainSlicer from '../applications/BrainSlicer';

// Begin Page Imports
import QuadViewOrthoPlanes from './pages/quad-view-ortho-planes';
import EEGViewerView from './pages/eeg-viewer';
// End Page Imports

// Begin CanvasLayout Imports
import XYZPerspectiveQuadView from './view-layout/canvas3d/XYZPerspectiveQuadView';
// End CanvasLayout Imports

// Begin Scene Imports
import OrthoPlanes from './scene/OrthoPlanes';
// End Scene Imports


// Begin Tool Imports
import AppHelp from './tools/app-help';
import CurveTool from './tools/curve-tool/';
import PlanesMaterialManager from './tools/planes-material-manager';
import VolumeInfo from './tools/volume-info';
import MNIMesh from './tools/mni-mesh';
import OrthoPlanesParameters from './tools/ortho-planes-parameters';
import QuadViewCameraParameters from './tools/quad-view-camera-parameters';
import QuadViewCameraControls from './tools/quad-view-camera-controls';
import QuadViewCameraAxes from './tools/quad-view-camera-axes';
import LineSegmentTool from './tools/line-segment-tool';
import IntensityPlotWindow from './tools/intensity-plot-window';
import EEGSpectrumPlot from './tools/eeg-spectrum-plot';
import EEGFileLoader from './tools/eeg-file-loader';
import ActiveViewportIndicator from './tools/ActiveViewportIndicator';
import SliceTraversal from './tools/SliceTraversal';
// End Tool Imports

// Begin Mediator Imports
import ActiveViewportControlsManager from './mediators/ActiveViewportControlsManager';
import BrainSlicerHelp from './mediators/brain-slicer-help';
import QuadViewControlsReset from './mediators/QuadViewControlsReset';
import LineSegmentTransmitter from './mediators/LineSegmentTransmitter';
import QuadViewXYZOrthoPlanesLayers from './mediators/QuadViewXYZOrthoPlanesLayers';
import QuadViewXYZOrthoPlanesShifter from './mediators/QuadViewXYZOrthoPlanesShifter';
import OrthoPlanesContrastSettings from './mediators/OrthoPlanesContrastSettings';
import PlanesShaderTransmitter from './mediators/PlanesShaderTransmitter';
// End Mediator Imports

class ApplicationManager {
  constructor() {
    this.registry = {};
    this.appCount = {};
    this.currentApplications = [];
    window.appManager = this;

    // Begin Page Registers
    this.registerConstructor(QuadViewOrthoPlanes);
    // End Page Registers

    // Begin Layout Registers
    this.registerConstructor(XYZPerspectiveQuadView);
    this.registerConstructor(EEGViewerView);
    // End Layout Registers

    // Begin Scene Registers
    this.registerConstructor(OrthoPlanes);
    // End Scene Registers

    // Begin Tool Registers
    this.registerConstructor(AppHelp);
    this.registerConstructor(CurveTool);
    this.registerConstructor(PlanesMaterialManager);
    this.registerConstructor(VolumeInfo);
    this.registerConstructor(MNIMesh);
    this.registerConstructor(OrthoPlanesParameters);
    this.registerConstructor(QuadViewCameraParameters);
    this.registerConstructor(QuadViewCameraControls);
    this.registerConstructor(QuadViewCameraAxes);
    this.registerConstructor(LineSegmentTool);
    this.registerConstructor(IntensityPlotWindow);
    this.registerConstructor(EEGSpectrumPlot);
    this.registerConstructor(EEGFileLoader);
    this.registerConstructor(ActiveViewportIndicator);
    this.registerConstructor(SliceTraversal);
    // End Tool Registers

    // Begin Mediator Registers
    this.registerConstructor(ActiveViewportControlsManager);
    this.registerConstructor(BrainSlicerHelp);
    this.registerConstructor(QuadViewControlsReset);
    this.registerConstructor(LineSegmentTransmitter);
    this.registerConstructor(QuadViewXYZOrthoPlanesLayers);
    this.registerConstructor(QuadViewXYZOrthoPlanesShifter);
    this.registerConstructor(OrthoPlanesContrastSettings);
    this.registerConstructor(PlanesShaderTransmitter);
    // End Mediator Registers
  }
  /**
   * [create Build an application out of a JSON description]
   * The description of the application is formatted as follows:
   * ExtensionJSON = {
   *  'name': 'myNewVisualization', # Title of the application.
   *  'page': { #configure the applications hosting component
   *    name: 'mainPage',
   *    controller: 'QuadViewOrthoPlanes',
   *    canvas3ds: [{
   *       name: 'view', # referenced by dependencies
   *       layout: 'XYZPerspectiveQuadView', # layout's class.
   *       scene: 'OrthoPlanes, # scene's class
   *    }],
   *  },
   *  tools: [
   *    {
   *      name: 'contrast', # referenced by dependencies
   *      tool: 'CurveTool', # controls the tool's state and ui.
   *      dependencies: ['view'],
   *    },
   *   ...
   *  ],
   *  'mediators': [ #The mediators between the scene, layout, and tools.
   *    {
   *      'type': 'CurveToolMediator', #The curve tool's channel to the color map and scene.
   *      'dependencies': ['view', 'constrast'],
   *    },
   *  ...
   *  ],
   * }
   * @param  {[JSON]} jsonDescription [JSON-serializable description of the application]
   * @return {[Application]} [A running instantiation of the application's description]
   */
  create(index, jsonDescription) {
    /**
     * The following setup does the following steps:
     * - For each tool, wait for the canvas dependencies to load into the UI
     * - Construct the tool when the canvas dependencies are loaded for that tool
     * - For each mediator, wait for the canvas dependencies AND tool dependencies to load.
     * - Construct the tool when the dependencies load.
     * - Add all of the loaded tools to the application asynchronously.
     * NOTE: ALL of the canvas dependencies for a certain tool must mount for the tool to load.
     * TODO: Allow partially loaded dependencies.
     */
    const {
      type,
      page,
      tools,
      mediators
    } = jsonDescription;
    let dependencies = {}; // Hash of promises that resolve to a loaded dependency
    let canvas3ds = [];
    const application = new Application(`${type} ${index}`, type);
    if (page.canvas3ds instanceof Array) {
      canvas3ds = page.canvas3ds;
    }
    const pageController = this.createFromConstructorName(page.controller);
    pageController.name = page.name;
    dependencies[page.name] = Promise.resolve(pageController);
    const lazyLoadCanvas3d = canvas3d => (
      pageController.waitForCanvas3d(canvas3d.name).then(({ renderer, canvas }) => {
        const canvas3dObj = {
          name: canvas3d.name,
          layout: this.createFromConstructorName(canvas3d.layout, renderer, canvas),
          scene: this.createFromConstructorName(canvas3d.scene)
        };
        application.addCanvas3d(canvas3dObj);
        return canvas3dObj;
      })
    );
    const canvProms = R.fromPairs(canvas3ds.map(c => [c.name, lazyLoadCanvas3d(c)]));
    dependencies = R.merge(dependencies, canvProms);
    application.setPageController(pageController);
    tools.forEach((toolMeta) => {
      const deps = R.props(toolMeta.dependencies, dependencies).filter(R.identity);
      const tool = Promise.all(deps)
        .then(loadedDeps => this.createFromConstructorName(toolMeta.tool, ...loadedDeps))
        .then((toolObj) => {
          toolObj.name = toolMeta.name; // eslint-disable-line no-param-reassign
          application.addTool(toolObj);
          return toolObj;
        });
      dependencies[toolMeta.name] = tool;
    });
    const mediatorPromises = mediators.map((medMeta) => {
      const deps = R.props(medMeta.dependencies, dependencies).filter(R.identity);
      return Promise.all(deps)
        .then(loadedDeps => this.createFromConstructorName(medMeta.mediator, ...loadedDeps))
        .then((medObj) => {
          medObj.name = medMeta.name; // eslint-disable-line no-param-reassign
          application.addMediator(medObj);
          return medObj;
        });
    });
    return {
      app: application,
      creationPromise: Promise.all(mediatorPromises)
    };
  }
  getApplication(index) {
    return this.currentApplications[index];
  }
  getApplications() {
    return this.currentApplications;
  }
  loadApplication(application) {
    if (!this.appCount[application.type]) {
      this.appCount[application.type] = 0;
    }
    const { app, creationPromise } = this.create(
      this.appCount[application.type],
      application
    );
    this.appCount[application.type] += 1;
    creationPromise.then(() => this.startApplication(app));
    this.currentApplications.push(app);
    return { app, creationPromise };
  }
  removeApplication(application) {
    application.dispose();
    this.currentApplications = this.currentApplications.filter(a => a !== application);
    if (this.currentApplications.length > 0) {
      this.startApplication(this.currentApplications[0]);
    }
  }
  startApplication(application) {
    this.currentApplications.forEach((a) => { a.stop(); });
    application.run();
  }
  /**
   * [mapToConstructor Takes a constructor's name as a string and returns its true
   * constructor to instatiate the tool or mediator.]
   * @param  {[String]} constructorName [Name of the tool or mediator's constructor]
   * @return {[Function]} [The constructor registered for the given name]
   */
  mapToConstructor(constructorName) {
    const ctr = this.registry[constructorName];
    if (!ctr) {
      throw new Error(`"${constructorName}" is not a registered tool or mediator constructor.`);
    }
    return ctr;
  }
  /**
   * [createFromConstructorName Takes a constructor's name as a string and instatiates
   * an object using the constructor registered for that name.]
   * @param  {[String]} constructorName [Name of the tool or mediator's constructor]
   * @return {[Function]} [An instance of the constructor registered for the given name]
   */
  createFromConstructorName(constructorName, ...constructorArgs) {
    // eslint-disable new-cap
    return new (this.mapToConstructor(constructorName))(...constructorArgs);
  }
  /**
   * [registerConstructor Register a constructor's name as a
   * string to it's associated constructor function.]
   * @param  {[String]} constructorName
   * @param  {[Function]} toolConstructor [The class constructor of the tool.]
   */
  registerConstructor(constructorFunction) {
    this.registry[constructorFunction.name] = constructorFunction;
  }
}

let instance;
export default {
  getInstance() {
    if (!instance) {
      instance = new ApplicationManager();
    }
    return instance;
  },
  APPLICATION_TYPES: { BrainSlicer }
};
