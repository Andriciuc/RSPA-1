// Real Estate Photography Batch Edit Script
// This script applies exposure correction, lens correction, and color grading
// to a batch of real estate photos.
//
// The script expects the following parameters:
// - inputFiles: Array of file paths to process
// - outputDir: Directory to save processed files
// - applyExposure: Boolean, whether to apply exposure correction
// - applyLens: Boolean, whether to apply lens correction
// - applyColor: Boolean, whether to apply color grading
// - saveFormat: String, format to save the processed files (jpg, tif, psd)
// - jpegQuality: Number, quality level for JPEG files (0-100)

// Enable double clicking from the OS
#target photoshop

// Set preferences for better script performance
app.preferences.rulerUnits = Units.PIXELS;
app.displayDialogs = DialogModes.NO;
app.bringToFront();

// Main function
function main() {
    // Check if Photoshop is available
    if (app.documents.length > 0) {
        // Close any open documents
        closeAllDocuments();
    }
    
    try {
        // Process each input file
        for (var i = 0; i < params.inputFiles.length; i++) {
            try {
                var filePath = params.inputFiles[i];
                var fileName = getFileName(filePath);
                
                // Log progress
                var progressMsg = "Processing file " + (i + 1) + " of " + params.inputFiles.length + ": " + fileName;
                $.writeln(progressMsg);
                
                // Open the file
                var docRef = openDocument(filePath);
                
                if (docRef) {
                    // Apply the edits
                    if (params.applyExposure) {
                        applyExposureCorrection(docRef);
                    }
                    
                    if (params.applyLens) {
                        applyLensCorrection(docRef);
                    }
                    
                    if (params.applyColor) {
                        applyColorGrading(docRef);
                    }
                    
                    // Save the processed file
                    var outputPath = params.outputDir + "/" + fileName;
                    saveDocument(docRef, outputPath, params.saveFormat, params.jpegQuality);
                    
                    // Close the document
                    docRef.close(SaveOptions.DONOTSAVECHANGES);
                }
            } catch (err) {
                $.writeln("Error processing file: " + filePath + ": " + err);
            }
        }
        
        $.writeln("Batch processing complete!");
        
    } catch (err) {
        $.writeln("Script error: " + err);
    }
}

// Open a document
function openDocument(filePath) {
    try {
        var fileRef = new File(filePath);
        
        if (!fileRef.exists) {
            $.writeln("File not found: " + filePath);
            return null;
        }
        
        return app.open(fileRef);
    } catch (err) {
        $.writeln("Error opening file: " + filePath + ": " + err);
        return null;
    }
}

// Apply exposure correction
function applyExposureCorrection(docRef) {
    try {
        // Create an adjustment layer for exposure
        var adjustmentLayer = docRef.artLayers.add();
        adjustmentLayer.name = "Exposure Correction";
        
        // Convert to smart object to preserve original data
        docRef.activeLayer = adjustmentLayer;
        convertToSmartObject();
        
        // Apply Auto Tone for basic exposure correction
        app.doAction("Auto Tone", "Default Actions");
        
        // Fine-tune with Levels adjustment
        var levelsLayer = docRef.artLayers.add();
        levelsLayer.name = "Levels Adjustment";
        
        // Apply Levels adjustment
        var levelsDesc = new ActionDescriptor();
        var levelsReference = new ActionReference();
        levelsReference.putClass(stringIDToTypeID("adjustmentLayer"));
        levelsDesc.putReference(charIDToTypeID("null"), levelsReference);
        
        var adjustmentDesc = new ActionDescriptor();
        adjustmentDesc.putClass(charIDToTypeID("Type"), stringIDToTypeID("levels"));
        levelsDesc.putObject(charIDToTypeID("Usng"), stringIDToTypeID("adjustmentLayer"), adjustmentDesc);
        executeAction(charIDToTypeID("Mk  "), levelsDesc, DialogModes.NO);
        
        // Auto-adjust Levels
        app.runMenuItem(stringIDToTypeID('autoLevelsMenuItemClass'));
        
    } catch (err) {
        $.writeln("Error applying exposure correction: " + err);
    }
}

// Apply lens correction
function applyLensCorrection(docRef) {
    try {
        // Create a smart object for lens correction
        var smartObj = docRef.artLayers.add();
        smartObj.name = "Lens Correction";
        
        docRef.activeLayer = smartObj;
        convertToSmartObject();
        
        // Apply Lens Correction filter
        var desc = new ActionDescriptor();
        var reference = new ActionReference();
        reference.putName(stringIDToTypeID("lensCorrection"), "Lens Correction");
        desc.putReference(charIDToTypeID("null"), reference);
        
        var filterDesc = new ActionDescriptor();
        // Enable auto correction
        filterDesc.putBoolean(stringIDToTypeID("autoScale"), true);
        filterDesc.putBoolean(stringIDToTypeID("chromatic"), true);
        filterDesc.putBoolean(stringIDToTypeID("vignette"), true);
        filterDesc.putBoolean(stringIDToTypeID("geometric"), true);
        
        desc.putObject(charIDToTypeID("Usng"), stringIDToTypeID("lensCorrection"), filterDesc);
        executeAction(stringIDToTypeID("filterLensCorrection"), desc, DialogModes.NO);
        
    } catch (err) {
        $.writeln("Error applying lens correction: " + err);
    }
}

// Apply color grading for real estate photos
function applyColorGrading(docRef) {
    try {
        // Create an adjustment layer for vibrance
        var vibranceLayer = docRef.artLayers.add();
        vibranceLayer.name = "Vibrance";
        
        // Apply Vibrance adjustment
        var vibranceDesc = new ActionDescriptor();
        var vibranceReference = new ActionReference();
        vibranceReference.putClass(stringIDToTypeID("adjustmentLayer"));
        vibranceDesc.putReference(charIDToTypeID("null"), vibranceReference);
        
        var adjustmentDesc = new ActionDescriptor();
        adjustmentDesc.putClass(charIDToTypeID("Type"), stringIDToTypeID("vibrance"));
        vibranceDesc.putObject(charIDToTypeID("Usng"), stringIDToTypeID("adjustmentLayer"), adjustmentDesc);
        executeAction(charIDToTypeID("Mk  "), vibranceDesc, DialogModes.NO);
        
        // Set vibrance and saturation values
        var desc = new ActionDescriptor();
        var adjustmentReference = new ActionReference();
        adjustmentReference.putEnumerated(charIDToTypeID("AdjL"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
        desc.putReference(charIDToTypeID("null"), adjustmentReference);
        
        var adjustmentDesc2 = new ActionDescriptor();
        // Increase vibrance for more natural-looking enhanced colors
        adjustmentDesc2.putInteger(stringIDToTypeID("vibrance"), 25);
        // Slight increase in saturation
        adjustmentDesc2.putInteger(stringIDToTypeID("saturation"), 5);
        
        desc.putObject(charIDToTypeID("T   "), stringIDToTypeID("vibrance"), adjustmentDesc2);
        executeAction(charIDToTypeID("setd"), desc, DialogModes.NO);
        
        // Create a Hue/Saturation adjustment layer to enhance specific colors
        var hueLayer = docRef.artLayers.add();
        hueLayer.name = "Color Enhancement";
        
        // Apply Hue/Saturation adjustment
        var hueDesc = new ActionDescriptor();
        var hueReference = new ActionReference();
        hueReference.putClass(stringIDToTypeID("adjustmentLayer"));
        hueDesc.putReference(charIDToTypeID("null"), hueReference);
        
        var hueAdjustmentDesc = new ActionDescriptor();
        hueAdjustmentDesc.putClass(charIDToTypeID("Type"), stringIDToTypeID("hueSaturation"));
        hueDesc.putObject(charIDToTypeID("Usng"), stringIDToTypeID("adjustmentLayer"), hueAdjustmentDesc);
        executeAction(charIDToTypeID("Mk  "), hueDesc, DialogModes.NO);
        
        // Enhance blues slightly (for skies)
        var blueDesc = new ActionDescriptor();
        var blueRef = new ActionReference();
        blueRef.putEnumerated(charIDToTypeID("AdjL"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
        blueDesc.putReference(charIDToTypeID("null"), blueRef);
        
        var blueAdjDesc = new ActionDescriptor();
        // Set adjustment to Blues
        blueAdjDesc.putEnumerated(charIDToTypeID("Hst "), charIDToTypeID("Hst "), stringIDToTypeID("blues"));
        // Increase saturation of blues
        blueAdjDesc.putInteger(charIDToTypeID("Strt"), 15);
        blueDesc.putObject(charIDToTypeID("T   "), stringIDToTypeID("hueSaturation"), blueAdjDesc);
        executeAction(charIDToTypeID("setd"), blueDesc, DialogModes.NO);
        
        // Create a Curves adjustment layer for final contrast
        var curvesLayer = docRef.artLayers.add();
        curvesLayer.name = "Contrast Enhancement";
        
        // Apply Curves adjustment
        var curvesDesc = new ActionDescriptor();
        var curvesReference = new ActionReference();
        curvesReference.putClass(stringIDToTypeID("adjustmentLayer"));
        curvesDesc.putReference(charIDToTypeID("null"), curvesReference);
        
        var curvesAdjustmentDesc = new ActionDescriptor();
        curvesAdjustmentDesc.putClass(charIDToTypeID("Type"), stringIDToTypeID("curves"));
        curvesDesc.putObject(charIDToTypeID("Usng"), stringIDToTypeID("adjustmentLayer"), curvesAdjustmentDesc);
        executeAction(charIDToTypeID("Mk  "), curvesDesc, DialogModes.NO);
        
        // Apply S-curve for balanced contrast
        applySCurve();
        
    } catch (err) {
        $.writeln("Error applying color grading: " + err);
    }
}

// Apply an S-curve to the current adjustment layer
function applySCurve() {
    try {
        // Create an S-curve for balanced contrast
        var desc = new ActionDescriptor();
        var ref = new ActionReference();
        ref.putEnumerated(charIDToTypeID("AdjL"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
        desc.putReference(charIDToTypeID("null"), ref);
        
        var curvesDesc = new ActionDescriptor();
        
        // Create the curve
        var curveList = new ActionList();
        
        // Point 1 (shadows down)
        var point1 = new ActionDescriptor();
        point1.putDouble(charIDToTypeID("Hrzn"), 64); // x coordinate (0-255)
        point1.putDouble(charIDToTypeID("Vrtc"), 56); // y coordinate (0-255)
        curveList.putObject(charIDToTypeID("Pnt "), point1);
        
        // Point 2 (midtones unchanged)
        var point2 = new ActionDescriptor();
        point2.putDouble(charIDToTypeID("Hrzn"), 128); // x coordinate (0-255)
        point2.putDouble(charIDToTypeID("Vrtc"), 128); // y coordinate (0-255)
        curveList.putObject(charIDToTypeID("Pnt "), point2);
        
        // Point 3 (highlights up)
        var point3 = new ActionDescriptor();
        point3.putDouble(charIDToTypeID("Hrzn"), 192); // x coordinate (0-255)
        point3.putDouble(charIDToTypeID("Vrtc"), 200); // y coordinate (0-255)
        curveList.putObject(charIDToTypeID("Pnt "), point3);
        
        // Add the curve points
        var curveDesc = new ActionDescriptor();
        curveDesc.putList(charIDToTypeID("Crv "), curveList);
        
        // RGB Channel
        curvesDesc.putObject(charIDToTypeID("Crvs"), charIDToTypeID("Crvs"), curveDesc);
        
        desc.putObject(charIDToTypeID("T   "), charIDToTypeID("Crvs"), curvesDesc);
        executeAction(charIDToTypeID("setd"), desc, DialogModes.NO);
        
    } catch (err) {
        $.writeln("Error applying S-curve: " + err);
    }
}

// Convert the active layer to a smart object
function convertToSmartObject() {
    try {
        var idnewPlacedLayer = stringIDToTypeID("newPlacedLayer");
        executeAction(idnewPlacedLayer, undefined, DialogModes.NO);
    } catch (err) {
        $.writeln("Error converting to smart object: " + err);
    }
}

// Save the document
function saveDocument(docRef, outputPath, format, quality) {
    try {
        var saveFile = new File(outputPath);
        var saveOptions;
        
        if (format.toLowerCase() === "jpg" || format.toLowerCase() === "jpeg") {
            // Add jpg extension if needed
            if (!outputPath.toLowerCase().match(/\.jpe?g$/)) {
                saveFile = new File(outputPath + ".jpg");
            }
            
            saveOptions = new JPEGSaveOptions();
            saveOptions.embedColorProfile = true;
            saveOptions.formatOptions = FormatOptions.STANDARDBASELINE;
            saveOptions.matte = MatteType.NONE;
            saveOptions.quality = quality || 80;
            
        } else if (format.toLowerCase() === "tif" || format.toLowerCase() === "tiff") {
            // Add tif extension if needed
            if (!outputPath.toLowerCase().match(/\.tiff?$/)) {
                saveFile = new File(outputPath + ".tif");
            }
            
            saveOptions = new TiffSaveOptions();
            saveOptions.embedColorProfile = true;
            saveOptions.imageCompression = TIFFEncoding.NONE;
            
        } else if (format.toLowerCase() === "psd") {
            // Add psd extension if needed
            if (!outputPath.toLowerCase().match(/\.psd$/)) {
                saveFile = new File(outputPath + ".psd");
            }
            
            saveOptions = new PhotoshopSaveOptions();
            saveOptions.embedColorProfile = true;
            saveOptions.alphaChannels = true;
            saveOptions.layers = true;
            
        } else {
            // Default to JPEG
            if (!outputPath.toLowerCase().match(/\.jpe?g$/)) {
                saveFile = new File(outputPath + ".jpg");
            }
            
            saveOptions = new JPEGSaveOptions();
            saveOptions.embedColorProfile = true;
            saveOptions.formatOptions = FormatOptions.STANDARDBASELINE;
            saveOptions.matte = MatteType.NONE;
            saveOptions.quality = quality || 80;
        }
        
        // Save the file
        docRef.saveAs(saveFile, saveOptions, true, Extension.LOWERCASE);
        $.writeln("Saved file: " + saveFile.fsName);
        
        return true;
    } catch (err) {
        $.writeln("Error saving file: " + err);
        return false;
    }
}

// Get the filename from a path
function getFileName(filePath) {
    return filePath.split('/').pop().split('\\').pop();
}

// Close all open documents
function closeAllDocuments() {
    var desc = new ActionDescriptor();
    desc.putBoolean(charIDToTypeID('Svng'), false); // Don't save changes
    executeAction(charIDToTypeID('ClsA'), desc, DialogModes.NO);
}

// Run the main function
main();
