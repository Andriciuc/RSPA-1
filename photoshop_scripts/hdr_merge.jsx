// Real Estate Photography HDR Merge Script
// This script merges bracketed photos into HDR images.
//
// The script expects the following parameters:
// - inputFiles: Array of file paths to merge
// - outputFile: Path to save the merged HDR file
// - removeGhosts: Boolean, whether to remove ghosts
// - bit32: Boolean, whether to output as 32-bit HDR

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
        // Log the files we're merging
        $.writeln("Merging " + params.inputFiles.length + " files into HDR:");
        for (var i = 0; i < params.inputFiles.length; i++) {
            $.writeln("  - " + params.inputFiles[i]);
        }
        
        // Create the HDR image
        if (createHDR(params.inputFiles, params.outputFile, params.removeGhosts, params.bit32)) {
            $.writeln("HDR merge complete: " + params.outputFile);
        } else {
            $.writeln("Failed to create HDR image");
        }
        
    } catch (err) {
        $.writeln("Script error: " + err);
    }
}

// Create an HDR image from bracketed exposures
function createHDR(inputFiles, outputFile, removeGhosts, bit32) {
    try {
        // Create an array of File objects
        var fileList = [];
        for (var i = 0; i < inputFiles.length; i++) {
            var fileRef = new File(inputFiles[i]);
            if (fileRef.exists) {
                fileList.push(fileRef);
            } else {
                $.writeln("File not found: " + inputFiles[i]);
            }
        }
        
        if (fileList.length < 2) {
            $.writeln("Not enough files for HDR merge. Need at least 2 files.");
            return false;
        }
        
        // Merge to HDR Pro
        mergeToHDRPro(fileList, removeGhosts, bit32);
        
        // Save the result
        var saveFile = new File(outputFile);
        
        // Make sure it has a proper extension
        if (!outputFile.toLowerCase().match(/\.(tif|tiff)$/)) {
            saveFile = new File(outputFile + ".tif");
        }
        
        // Save options for 32-bit TIFF
        var saveOptions = new TiffSaveOptions();
        saveOptions.embedColorProfile = true;
        saveOptions.imageCompression = TIFFEncoding.NONE;
        saveOptions.byteOrder = ByteOrder.IBM;
        
        // Save the file
        app.activeDocument.saveAs(saveFile, saveOptions, true, Extension.LOWERCASE);
        
        // Close the document
        app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
        
        return true;
    } catch (err) {
        $.writeln("Error creating HDR: " + err);
        return false;
    }
}

// Use Merge to HDR Pro to combine the images
function mergeToHDRPro(fileList, removeGhosts, bit32) {
    try {
        // Create a descriptor for the HDR Pro merge command
        var desc = new ActionDescriptor();
        var refs = new ActionList();
        
        // Add all files to the list
        for (var i = 0; i < fileList.length; i++) {
            var ref = new ActionDescriptor();
            ref.putPath(charIDToTypeID("null"), fileList[i]);
            refs.putObject(charIDToTypeID("File"), ref);
        }
        
        desc.putList(charIDToTypeID("null"), refs);
        
        // Set ghost removal option
        if (removeGhosts) {
            desc.putBoolean(stringIDToTypeID("removeGhosts"), true);
        }
        
        // Execute the HDR Pro command
        executeAction(stringIDToTypeID("mergeToHDR"), desc, DialogModes.NO);
        
        // Now configure the HDR Pro settings
        configureHDRPro(bit32);
        
        return true;
    } catch (err) {
        $.writeln("Error in Merge to HDR Pro: " + err);
        return false;
    }
}

// Configure the HDR Pro settings and apply
function configureHDRPro(bit32) {
    try {
        // Create descriptor for HDR settings
        var desc = new ActionDescriptor();
        
        // Set the bit depth
        if (bit32) {
            desc.putInteger(charIDToTypeID("Dpth"), 32); // 32-bit
        } else {
            desc.putInteger(charIDToTypeID("Dpth"), 16); // 16-bit
        }
        
        // Set Local Adaptation method for tone mapping
        desc.putString(charIDToTypeID("Mthd"), "Local Adaptation");
        
        // HDR Toning parameters (these are defaults, can be customized)
        var toningDesc = new ActionDescriptor();
        
        // Curve settings for balanced exposure in real estate photos
        toningDesc.putDouble(stringIDToTypeID("radius"), 30); // Edge detection radius
        toningDesc.putDouble(stringIDToTypeID("strength"), 1.0); // Strength of edge preservation
        toningDesc.putDouble(stringIDToTypeID("gamma"), 1.0); // Gamma of the curve
        toningDesc.putDouble(stringIDToTypeID("exposure"), 0.0); // Overall exposure adjustment
        toningDesc.putDouble(stringIDToTypeID("detail"), 30); // Detail enhancement
        toningDesc.putDouble(stringIDToTypeID("shadow"), 0); // Shadow recovery
        toningDesc.putDouble(stringIDToTypeID("highlight"), 0); // Highlight recovery
        toningDesc.putDouble(stringIDToTypeID("vibrance"), 20); // Color vibrance
        toningDesc.putDouble(stringIDToTypeID("saturation"), 20); // Color saturation
        
        // Add toning settings
        desc.putObject(stringIDToTypeID("toneMapping"), stringIDToTypeID("toneMapping"), toningDesc);
        
        // Apply the HDR Pro settings
        executeAction(stringIDToTypeID("hdrOptions"), desc, DialogModes.NO);
        
        // If we're keeping it as 32-bit, we need to change the bit depth
        if (bit32) {
            // Convert to 32-bit
            var depthDesc = new ActionDescriptor();
            depthDesc.putInteger(charIDToTypeID("Dpth"), 32);
            executeAction(stringIDToTypeID("convertMode"), depthDesc, DialogModes.NO);
        }
        
        return true;
    } catch (err) {
        $.writeln("Error configuring HDR Pro: " + err);
        return false;
    }
}

// Close all open documents
function closeAllDocuments() {
    var desc = new ActionDescriptor();
    desc.putBoolean(charIDToTypeID('Svng'), false); // Don't save changes
    executeAction(charIDToTypeID('ClsA'), desc, DialogModes.NO);
}

// Run the main function
main();
