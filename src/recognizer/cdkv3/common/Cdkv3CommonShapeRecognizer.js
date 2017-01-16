import { recognizerLogger as logger } from '../../../configuration/LoggerConfig';
import * as InkModel from '../../../model/InkModel';
import * as StrokeComponent from '../../../model/StrokeComponent';

/**
 * Extract recognized symbols from recognition output
 * @param {Model} model Current model
 * @param {Object} segment Shape recognition output
 * @return {Array<Object>} Recognized symbols
 */
export function extractSymbols(model, segment) {
  let symbols = [];
  const strokes = model.rawStrokes.slice();
  if (segment.candidates && segment.candidates.length > 0) {
    const selectedCandidate = segment.candidates[segment.selectedCandidateIndex];
    const matchingStrokes = [];
    segment.inkRanges.forEach((inkRange) => {
      strokes.slice(inkRange.firstStroke, inkRange.lastStroke + 1)
          .forEach((stroke, i) => {
            const start = (i === inkRange.firstStroke) ? inkRange.firstPoint : 0;
            const end = (i === inkRange.lastStroke) ? inkRange.lastPoint + 1 : stroke.x.length;
            matchingStrokes.push(StrokeComponent.slice(stroke, start, end));
          });
    });
    // Apply first stroke rendering params
    const style = {
      color: InkModel.extractPendingStrokes(model)[0].color,
      width: InkModel.extractPendingStrokes(model)[0].width
    };
    if (matchingStrokes.length > 0) {
      style.color = matchingStrokes[0].color;
      style.width = matchingStrokes[0].width;
    }
    Object.assign(segment, style);

    if (selectedCandidate.type === 'notRecognized') {
      // Flagging strokes recognized as notRecognized
      symbols = matchingStrokes;
    } else if (selectedCandidate.type === 'erased') {
      // Flagging strokes recognized as toBeRemove
    } else {
      symbols = selectedCandidate.primitives.map(primitive => Object.assign(primitive, style));
    }
  }
  return symbols;
}

/**
 * Enrich the model with recognized symbols
 * @param {Model} model Current model
 * @return {Model} Updated model
 */
export function processRenderingResult(model) {
  const mutatedModel = model;
  let recognizedComponents = [];
  // TODO Check the wording compare to the SDK doc
  if (mutatedModel.rawResult.result && mutatedModel.rawResult.result.segments) {
    mutatedModel.rawResult.result.segments.forEach((segment) => {
      recognizedComponents = recognizedComponents.concat(extractSymbols(model, segment));
    });
  }
  mutatedModel.recognizedSymbols.forEach((symbol, index) => {
    recognizedComponents[index] = Object.assign({}, symbol, recognizedComponents[index]);
  });
  mutatedModel.recognizedSymbols = recognizedComponents;
  logger.debug('Building the rendering model', mutatedModel);
  return mutatedModel;
}
