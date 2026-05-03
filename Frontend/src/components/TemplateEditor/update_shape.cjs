const fs = require('fs');
const file = 'd:/Frontend/src/components/TemplateEditor/ShapeProperties.jsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

const importIdx = lines.findIndex(l => l.includes("from 'lucide-react';"));
lines.splice(importIdx + 1, 0, "import { Color, CornerRadius, Effect } from './sharedproperty';");

const findLine = (str, start = 0) => lines.findIndex((l, i) => i >= start && l.includes(str));

const effectEnd = findLine('      {/* PORTALED EFFECT PROPERTIES */}');
const effectStart = findLine('      {/* EFFECT ACCORDION CARDS (EXACT TEXT EDITOR STYLE) */}');
if (effectStart !== -1 && effectEnd !== -1) {
    const effectStr = `      {/* EFFECT ACCORDION CARDS (EXACT TEXT EDITOR STYLE) */}
      <Effect 
        openAccordion={openAccordion}
        setOpenAccordion={setOpenAccordion}
        selectedElementProps={selectedElementProps}
        updateAttr={updateAttr}
        activeEffectPopupId={activeEffectPopupId}
        handleEffectRowClick={handleEffectRowClick}
      />`;
    lines.splice(effectStart, effectEnd - effectStart, effectStr);
}

const cornerStart = findLine('      {/* CORNER RADIUS ACCORDION (FIGMA STYLE) */}');
const cornerEnd = findLine('      {/* EFFECT ACCORDION CARDS (EXACT TEXT EDITOR STYLE) */}');
if (cornerStart !== -1 && cornerEnd !== -1) {
    const cornerStr = `      {/* CORNER RADIUS ACCORDION (FIGMA STYLE) */}
      {(selectedElementProps.tagName === 'rect' || selectedElementProps['data-shape-type'] === 'rectangle') && (
        <CornerRadius 
          openAccordion={openAccordion}
          setOpenAccordion={setOpenAccordion}
          selectedElementProps={selectedElementProps}
          updateAttr={updateAttr}
          handleScrubHelper={handleScrubHelper}
        />
      )}`;
    lines.splice(cornerStart, cornerEnd - cornerStart, cornerStr);
}

const colorStart = findLine('      {/* COLOR ACCORDION CARDS (EXACT TEXT EDITOR STYLE) */}');
const colorEnd = findLine('      {/* CORNER RADIUS ACCORDION (FIGMA STYLE) */}');
if (colorStart !== -1 && colorEnd !== -1) {
    const colorStr = `      {/* COLOR ACCORDION CARDS (EXACT TEXT EDITOR STYLE) */}
      <Color 
        openAccordion={openAccordion}
        setOpenAccordion={setOpenAccordion}
        selectedElementProps={selectedElementProps}
        updateAttr={updateAttr}
        activeColorPicker={activeColorPicker}
        setActiveColorPicker={setActiveColorPicker}
        showStrokeSettings={showStrokeSettings}
        setShowStrokeSettings={setShowStrokeSettings}
        setStrokeSettingsPos={setStrokeSettingsPos}
        isStrokeTypeOpen={isStrokeTypeOpen}
        isStrokeStyleOpen={isStrokeStyleOpen}
        setIsStrokeStyleOpen={setIsStrokeStyleOpen}
        dropdownPos={dropdownPos}
        setDropdownPos={setDropdownPos}
        handleScrubHelper={handleScrubHelper}
      />`;
    lines.splice(colorStart, colorEnd - colorStart, colorStr);
}

const colorFieldStart = findLine('const ColorField = ({ label, color, opacity');
const colorFieldEnd = findLine('const ShapeProperties = ({');
if (colorFieldStart !== -1 && colorFieldEnd !== -1) {
    lines.splice(colorFieldStart, colorFieldEnd - colorFieldStart - 1);
}

fs.writeFileSync(file, lines.join('\n'));
