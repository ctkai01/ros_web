import actionRegistry from './ActionRegistry';

// register all actions

// import and register actions
const initializeActions = async () => {
  try {
    // dynamic imports to avoid circular dependency
    const MoveAction = await import('./MoveAction/MoveAction');
    const DockingAction = await import('./DockingAction/DockingAction');
    const RelativeMoveAction = await import('./RelativeMoveAction/RelativeMoveAction');
    const LoopAction = await import('./LoopAction/LoopAction');
    const WaitAction = await import('./WaitAction/WaitAction');
    const BreakAction = await import('./BreakAction/BreakAction');
    const ReturnAction = await import('./ReturnAction/ReturnAction');
    const ContinueAction = await import('./ContinueAction/ContinueAction');
    const UserCreateAction = await import('./UserCreateAction/UserCreateAction');
    const MoveToCoordinateAction = await import('./MoveToCoordinateAction/MoveToCoordinateAction');
    const IfAction = await import('./IfAction/IfAction');
    const WhileAction = await import('./WhileAction/WhileAction');
    const TryCatchAction = await import('./TryCatchAction/TryCatchAction');
    const SwitchMapAction = await import('./SwitchMapAction/SwitchMapAction');
    const CreateLogAction = await import('./CreateLogAction/CreateLogAction');
    const ThrowErrorAction = await import('./ThrowErrorAction/ThrowErrorAction');
    const PromptUserAction = await import('./PromptUserAction/PromptUserAction');
    const MoveSettings = await import('./MoveAction/MoveSettings');
    const DockingSettings = await import('./DockingAction/DockingSettings');

    // register MoveAction
    actionRegistry.registerAction('move', MoveAction.default);

    // register DockingAction
    actionRegistry.registerAction('docking', DockingAction.default);

    // register RelativeMoveAction
    actionRegistry.registerAction('relativeMove', RelativeMoveAction.default);

    // register LoopAction
    actionRegistry.registerAction('loop', LoopAction.default);

    // register WaitAction
    actionRegistry.registerAction('wait', WaitAction.default);

    // register BreakAction
    actionRegistry.registerAction('break', BreakAction.default);
    actionRegistry.registerAction('return', ReturnAction.default);
    actionRegistry.registerAction('continue', ContinueAction.default);
    actionRegistry.registerAction('userCreate', UserCreateAction.default);
    actionRegistry.registerAction('moveToCoordinate', MoveToCoordinateAction.default);
    actionRegistry.registerAction('if', IfAction.default);
    actionRegistry.registerAction('while', WhileAction.default);
    actionRegistry.registerAction('tryCatch', TryCatchAction.default);
    actionRegistry.registerAction('switchMap', SwitchMapAction.default);
    actionRegistry.registerAction('createLog', CreateLogAction.default);
    actionRegistry.registerAction('throwError', ThrowErrorAction.default);
    actionRegistry.registerAction('promptUser', PromptUserAction.default);

    // Debug: Check if action is registered
    const registeredAction = actionRegistry.getAction('moveToCoordinate');

    // register settings components
    actionRegistry.registerSettings('move', MoveSettings.default);

    // register DockingSettings
    actionRegistry.registerSettings('docking', DockingSettings.default);

    // register RelativeMoveSettings
    const RelativeMoveSettings = await import('./RelativeMoveAction/RelativeMoveSettings');
    actionRegistry.registerSettings('relativeMove', RelativeMoveSettings.default);

    // register LoopSettings
    const LoopSettings = await import('./LoopAction/LoopSettings');
    actionRegistry.registerSettings('loop', LoopSettings.default);

    // register WaitSettings
    const WaitSettings = await import('./WaitAction/WaitSettings');
    actionRegistry.registerSettings('wait', WaitSettings.default);

    // register BreakSettings
    const BreakSettings = await import('./BreakAction/BreakSettings');
    actionRegistry.registerSettings('break', BreakSettings.default);
    // register ReturnSettings
    const ReturnSettings = await import('./ReturnAction/ReturnSettings');
    actionRegistry.registerSettings('return', ReturnSettings.default);
    // register ContinueSettings
    const ContinueSettings = await import('./ContinueAction/ContinueSettings');
    actionRegistry.registerSettings('continue', ContinueSettings.default);
    // register UserCreateSettings
    const UserCreateSettings = await import('./UserCreateAction/UserCreateSettings');
    actionRegistry.registerSettings('userCreate', UserCreateSettings.default);
    // register MoveToCoordinateSettings
    const MoveToCoordinateSettings = await import('./MoveToCoordinateAction/MoveToCoordinateSettings');
    actionRegistry.registerSettings('moveToCoordinate', MoveToCoordinateSettings.default);
    // register IfSettings
    const IfSettings = await import('./IfAction/IfSettings');
    actionRegistry.registerSettings('if', IfSettings.default);
    // register WhileSettings
    const WhileSettings = await import('./WhileAction/WhileSettings');
    actionRegistry.registerSettings('while', WhileSettings.default);
    // register TryCatchSettings
    const TryCatchSettings = await import('./TryCatchAction/TryCatchSettings');
    actionRegistry.registerSettings('tryCatch', TryCatchSettings.default);
    // register SwitchMapSettings
    const SwitchMapSettings = await import('./SwitchMapAction/SwitchMapSettings');
    actionRegistry.registerSettings('switchMap', SwitchMapSettings.default);
    // register CreateLogSettings
    const CreateLogSettings = await import('./CreateLogAction/CreateLogSettings');
    actionRegistry.registerSettings('createLog', CreateLogSettings.default);
    // register ThrowErrorSettings
    const ThrowErrorSettings = await import('./ThrowErrorAction/ThrowErrorSettings');
    actionRegistry.registerSettings('throwError', ThrowErrorSettings.default);
    // register PromptUserSettings
    const PromptUserSettings = await import('./PromptUserAction/PromptUserSettings');
    actionRegistry.registerSettings('promptUser', PromptUserSettings.default);

  } catch (error) {
    console.error('❌ Error initializing ActionRegistry:', error);
  }

  // Debug: Log all registered actions
};


// Track initialization status
let isInitialized = false;
let initPromise = null;

// initialize immediately and wait for completion
initPromise = initializeActions().then(() => {
    console.log('✅ ActionRegistry initialization completed');
    isInitialized = true;
    return actionRegistry;
}).catch(error => {
    console.error('❌ ActionRegistry initialization failed:', error);
    isInitialized = false;
    throw error;
});

// Add method to wait for initialization
actionRegistry.waitForInitialization = () => {
    if (isInitialized) {
        return Promise.resolve(actionRegistry);
    }
    return initPromise;
};

export default actionRegistry; 