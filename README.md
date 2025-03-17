# Real Estate Photography Automation Script

A Python-based automation script for batch editing and HDR merging of real estate photos in Adobe Photoshop. This tool is designed specifically for real estate photographers to streamline their post-processing workflow.

## Features

- **Batch editing** of real estate photos with:
  - Automated exposure correction
  - Automated lens corrections
  - Automated color grading for real estate aesthetics
  
- **HDR Merging** of bracketed photos:
  - Automatically merges bracketed exposures
  - Supports conversion to 32-bit with ghost removal
  - Optimized for real estate photography

## Requirements

- Adobe Photoshop (tested with CS6 and CC versions)
- Python 3.6 or later
- Operating System: Windows, macOS, or Linux (with Photoshop)

## Installation

1. Clone or download this repository to your local machine
2. Make sure you have Python 3.6+ installed
3. No additional Python packages are required

## Usage

### Batch Editing Photos

Process a directory of real estate photos with automated editing:

```bash
python photo_automation.py batch INPUT_DIRECTORY OUTPUT_DIRECTORY [options]
```

#### Options for Batch Editing

- `--recursive` or `-r`: Recursively search for photos in subdirectories
- `--no-exposure`: Skip exposure correction
- `--no-lens`: Skip lens correction
- `--no-color`: Skip color grading
- `--photoshop PATH`: Specify the path to Photoshop executable (optional)

### HDR Merging

Merge bracketed photos into HDR images:

```bash
python photo_automation.py hdr INPUT_DIRECTORY OUTPUT_DIRECTORY [options]
```

#### Options for HDR Merging

- `--bracket-count N` or `-b N`: Number of photos in each bracketed set (default: 3)
- `--no-ghost`: Disable ghost removal in HDR merge
- `--photoshop PATH`: Specify the path to Photoshop executable (optional)

## How It Works

### Batch Editing

The batch editing process applies the following adjustments to each photo:

1. **Exposure Correction**: Optimizes brightness and contrast
2. **Lens Correction**: Removes distortion and fixes perspective issues
3. **Color Grading**: Enhances colors for real estate presentation

### HDR Merging

The HDR merging process:

1. Identifies sets of bracketed exposures
2. Merges them into 32-bit HDR images
3. Applies ghost removal to eliminate motion artifacts
4. Optimizes tone mapping for real estate presentation
