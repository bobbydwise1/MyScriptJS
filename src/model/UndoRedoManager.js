import cloneJSObject from '../util/Cloner';
import * as InkModel from '../model/InkModel';
import { modelLogger as logger } from '../configuration/LoggerConfig';


export function createUndoRedoManager(domElementRef, from) {
  const newUndoRedoManager = cloneJSObject({ stack: [], currentPosition: -1 }, from);
  newUndoRedoManager.domElementRef = domElementRef;
  return newUndoRedoManager;
}

function eventDispatcherOnUpdate(undoRedoManager) {
  // We are making usage of a browser provided class
  /* eslint-disable no-undef */
  if (CustomEvent) {
    const data = {
      currentPosition: undoRedoManager.currentPosition,
      length: undoRedoManager.stack.length
    };
    undoRedoManager.domElementRef.dispatchEvent(new CustomEvent('undoredoupdated', { detail: data }));
  }
  /* eslint-enable no-undef */
}

export function undo(undoRedoManager) {
  const undoRedoManagerReference = undoRedoManager;
  if (undoRedoManagerReference.currentPosition > 0) {
    undoRedoManagerReference.currentPosition -= 1;
  }
  eventDispatcherOnUpdate(undoRedoManagerReference);
  return { undoRedoManagerReference, newModel: undoRedoManagerReference.stack[undoRedoManagerReference.currentPosition] };
}

export function redo(undoRedoManager) {
  const undoRedoManagerReference = undoRedoManager;
  if (undoRedoManagerReference.currentPosition < undoRedoManagerReference.stack.length - 1) {
    undoRedoManagerReference.currentPosition += 1;
    logger.debug('redo index', undoRedoManagerReference.currentPosition);
  }
  eventDispatcherOnUpdate(undoRedoManagerReference);
  return { undoRedoManagerReference, newModel: undoRedoManagerReference.stack[undoRedoManagerReference.currentPosition] };
}

/**
 * Mutate the undoRedo stack by adding a new model to it.
 * @param undoRedoManager
 * @param modelParam
 * @returns {*}
 */
export function pushModel(undoRedoManager, modelParam) {
  const modelReference = modelParam;
  const undoRedoManagerReference = undoRedoManager;
  undoRedoManagerReference.currentPosition += 1;
  undoRedoManagerReference.stack = undoRedoManagerReference.stack.slice(0, undoRedoManagerReference.currentPosition);
  modelReference.undoRedoPosition = undoRedoManagerReference.currentPosition;
  undoRedoManagerReference.stack.push(InkModel.cloneModel(modelReference));
  eventDispatcherOnUpdate(undoRedoManagerReference);
  return undoRedoManagerReference;
}

/**
 * Update in the undoRedoManager stack the model given in param.
 * @param undoRedoManager
 * @param model
 * @returns undoRedoManager ref (same as in param)
 */
export function updateModelInStack(undoRedoManager, model) {
  const undoRedoManagerReference = undoRedoManager;
  undoRedoManagerReference.stack[model.undoRedoPosition] = InkModel.cloneModel(model);
  eventDispatcherOnUpdate(undoRedoManagerReference);
  return undoRedoManagerReference;
}
