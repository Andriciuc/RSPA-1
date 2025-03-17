#!/usr/bin/env python3
"""
Real Estate Photography Automation Script

This script automates batch editing and HDR merging of real estate photos using Photoshop.
It provides functionality for exposure correction, lens corrections, color grading,
and HDR merging of bracketed photos.

Author: AI Assistant
"""

import os
import sys
import argparse
import subprocess
import time
import logging
import glob
import shutil
from typing import List, Dict, Any, Optional, Tuple

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("photo_automation.log")
    ]
)
logger = logging.getLogger("PhotoAutomation")

# Define constants
SUPPORTED_IMAGE_FORMATS = ['.jpg', '.jpeg', '.tif', '.tiff', '.raw', '.cr2', '.nef', '.arw']
PHOTOSHOP_PATHS = {
    'darwin': [
        '/Applications/Adobe Photoshop 2023/Adobe Photoshop 2023.app/Contents/MacOS/Adobe Photoshop 2023',
        '/Applications/Adobe Photoshop 2022/Adobe Photoshop 2022.app/Contents/MacOS/Adobe Photoshop 2022',
        '/Applications/Adobe Photoshop 2021/Adobe Photoshop 2021.app/Contents/MacOS/Adobe Photoshop 2021',
        '/Applications/Adobe Photoshop CC 2020/Adobe Photoshop CC 2020.app/Contents/MacOS/Adobe Photoshop CC 2020',
    ],
    'win32': [
        'C:\\Program Files\\Adobe\\Adobe Photoshop 2023\\Photoshop.exe',
        'C:\\Program Files\\Adobe\\Adobe Photoshop 2022\\Photoshop.exe',
        'C:\\Program Files\\Adobe\\Adobe Photoshop 2021\\Photoshop.exe',
        'C:\\Program Files\\Adobe\\Adobe Photoshop CC 2020\\Photoshop.exe',
    ],
    'linux': [
        # Photoshop doesn't natively support Linux, but users might run it through Wine
        '/usr/bin/photoshop',
        '/opt/photoshop/photoshop',
    ]
}


def find_photoshop_path() -> Optional[str]:
    """
    Find the path to the Photoshop executable based on the operating system.
    
    Returns:
        Optional[str]: Path to Photoshop executable if found, None otherwise.
    """
    platform = sys.platform
    
    if platform not in PHOTOSHOP_PATHS:
        logger.error(f"Unsupported platform: {platform}")
        return None
        
    for path in PHOTOSHOP_PATHS[platform]:
        if os.path.exists(path):
            logger.info(f"Found Photoshop at: {path}")
            return path
            
    logger.error("Photoshop executable not found. Please install Photoshop or provide the path manually.")
    return None


def is_valid_dir(path: str) -> bool:
    """
    Check if the specified path is a valid directory.
    
    Args:
        path (str): Path to check
        
    Returns:
        bool: True if the path is a valid directory, False otherwise.
    """
    return os.path.isdir(path)


def is_valid_file(path: str) -> bool:
    """
    Check if the specified path is a valid file.
    
    Args:
        path (str): Path to check
        
    Returns:
        bool: True if the path is a valid file, False otherwise.
    """
    return os.path.isfile(path)


def get_image_files(directory: str, recursive: bool = False) -> List[str]:
    """
    Get all image files in the specified directory.
    
    Args:
        directory (str): Directory to search for images
        recursive (bool): Whether to search recursively
        
    Returns:
        List[str]: List of image file paths
    """
    image_files = []
    
    if recursive:
        for root, _, files in os.walk(directory):
            for file in files:
                if any(file.lower().endswith(ext) for ext in SUPPORTED_IMAGE_FORMATS):
                    image_files.append(os.path.join(root, file))
    else:
        for ext in SUPPORTED_IMAGE_FORMATS:
            image_files.extend(glob.glob(os.path.join(directory, f"*{ext}")))
            image_files.extend(glob.glob(os.path.join(directory, f"*{ext.upper()}")))
    
    return sorted(image_files)


def identify_bracketed_sets(image_files: List[str], bracket_count: int = 3) -> List[List[str]]:
    """
    Identify bracketed sets of images based on file naming patterns.
    
    Args:
        image_files (List[str]): List of image file paths
        bracket_count (int): Expected number of images in each bracketed set
        
    Returns:
        List[List[str]]: List of bracketed image sets
    """
    # This is a simple implementation that assumes files are named with sequential numbers
    # A more robust implementation would analyze EXIF data for exposure bracketing
    
    bracketed_sets = []
    current_set = []
    
    # Sort files to ensure they're in sequence
    image_files.sort()
    
    for i, file_path in enumerate(image_files):
        filename = os.path.basename(file_path)
        
        # Add to current set
        current_set.append(file_path)
        
        # If we've reached the expected bracket count or this is the last file
        if len(current_set) == bracket_count or i == len(image_files) - 1:
            if len(current_set) >= 2:  # Need at least 2 images for HDR
                bracketed_sets.append(current_set)
            current_set = []
    
    return bracketed_sets


def run_photoshop_script(photoshop_path: str, jsx_script_path: str, params: Optional[Dict[str, Any]] = None) -> bool:
    """
    Run a JSX script in Photoshop.
    
    Args:
        photoshop_path (str): Path to Photoshop executable
        jsx_script_path (str): Path to JSX script
        params (Optional[Dict[str, Any]]): Parameters to pass to the script
        
    Returns:
        bool: True if the script ran successfully, False otherwise
    """
    if not is_valid_file(jsx_script_path):
        logger.error(f"Script file not found: {jsx_script_path}")
        return False
        
    # Create a temporary file with parameters if needed
    temp_params_file = None
    temp_script_file = None  # Initialize to avoid "possibly unbound" error
    
    if params:
        import json
        import tempfile
        
        temp_params_file = tempfile.NamedTemporaryFile(delete=False, suffix='.json')
        with open(temp_params_file.name, 'w') as f:
            json.dump(params, f)
            
        # Modify the JSX script to load parameters
        temp_script_file = tempfile.NamedTemporaryFile(delete=False, suffix='.jsx')
        with open(jsx_script_path, 'r') as original:
            script_content = original.read()
            
        # Replace backslashes with double backslashes for JavaScript
        escaped_path = temp_params_file.name.replace('\\', '\\\\')
        params_loader = f"""
        // Load parameters from JSON file
        var paramsFile = new File("{escaped_path}");
        paramsFile.open('r');
        var params = JSON.parse(paramsFile.read());
        paramsFile.close();
        
        """
        
        with open(temp_script_file.name, 'w') as modified:
            modified.write(params_loader + script_content)
            
        jsx_script_path = temp_script_file.name
        
    try:
        if sys.platform == 'darwin':
            # On macOS, use osascript to run Photoshop and execute the script
            cmd = [
                'osascript', 
                '-e', 
                f'tell application "Adobe Photoshop" to open file "{jsx_script_path}" as JavaScript'
            ]
        else:
            # On Windows and Linux, run Photoshop with the script parameter
            cmd = [
                photoshop_path,
                '--javascript',
                jsx_script_path
            ]
            
        logger.info(f"Running command: {' '.join(cmd)}")
        
        # Run the command and capture output
        process = subprocess.Popen(
            cmd, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            universal_newlines=True
        )
        
        stdout, stderr = process.communicate()
        
        if stdout:
            logger.info(f"Photoshop output: {stdout}")
        if stderr:
            logger.error(f"Photoshop error: {stderr}")
            
        if process.returncode != 0:
            logger.error(f"Photoshop script failed with return code {process.returncode}")
            return False
            
        logger.info("Photoshop script executed successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error running Photoshop script: {e}")
        return False
        
    finally:
        # Clean up temporary files
        if temp_params_file:
            try:
                os.unlink(temp_params_file.name)
            except:
                pass
                
        if 'temp_script_file' in locals() and temp_script_file:
            try:
                os.unlink(temp_script_file.name)
            except:
                pass


def batch_edit_photos(photoshop_path: str, input_files: List[str], output_dir: str, 
                      apply_exposure: bool = True, apply_lens: bool = True, 
                      apply_color: bool = True) -> Tuple[int, int]:
    """
    Batch edit photos using Photoshop.
    
    Args:
        photoshop_path (str): Path to Photoshop executable
        input_files (List[str]): List of input image files
        output_dir (str): Directory to save output files
        apply_exposure (bool): Whether to apply exposure correction
        apply_lens (bool): Whether to apply lens correction
        apply_color (bool): Whether to apply color grading
        
    Returns:
        Tuple[int, int]: Number of successfully processed files and total files
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    # Parameters for the JSX script
    params = {
        'inputFiles': input_files,
        'outputDir': output_dir,
        'applyExposure': apply_exposure,
        'applyLens': apply_lens,
        'applyColor': apply_color,
        'saveFormat': 'jpg',
        'jpegQuality': 80
    }
    
    # Run the batch edit script
    jsx_script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 
                                  'photoshop_scripts', 'batch_edit.jsx')
    
    success_count = 0
    total_count = len(input_files)
    
    # Process in smaller batches to avoid overwhelming Photoshop
    batch_size = 10
    for i in range(0, total_count, batch_size):
        batch_files = input_files[i:i+batch_size]
        batch_params = params.copy()
        batch_params['inputFiles'] = batch_files
        
        logger.info(f"Processing batch {i//batch_size + 1}/{(total_count+batch_size-1)//batch_size}: {len(batch_files)} files")
        
        if run_photoshop_script(photoshop_path, jsx_script_path, batch_params):
            # Count successfully processed files
            for file in batch_files:
                output_file = os.path.join(output_dir, os.path.basename(file))
                if os.path.exists(output_file):
                    success_count += 1
        
        # Allow Photoshop some time to process and release resources
        time.sleep(2)
    
    return success_count, total_count


def merge_hdr_photos(photoshop_path: str, bracketed_sets: List[List[str]], 
                     output_dir: str, remove_ghosts: bool = True) -> Tuple[int, int]:
    """
    Merge bracketed photos into HDR images using Photoshop.
    
    Args:
        photoshop_path (str): Path to Photoshop executable
        bracketed_sets (List[List[str]]): List of bracketed image sets
        output_dir (str): Directory to save output files
        remove_ghosts (bool): Whether to remove ghosts in HDR merge
        
    Returns:
        Tuple[int, int]: Number of successfully processed sets and total sets
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    # Run the HDR merge script for each bracketed set
    jsx_script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 
                                  'photoshop_scripts', 'hdr_merge.jsx')
    
    success_count = 0
    total_count = len(bracketed_sets)
    
    for i, bracketed_set in enumerate(bracketed_sets):
        # Generate output filename based on the first file in the set
        first_file = os.path.basename(bracketed_set[0])
        base_name = os.path.splitext(first_file)[0]
        output_file = os.path.join(output_dir, f"{base_name}_HDR.tif")
        
        logger.info(f"Processing HDR set {i+1}/{total_count}: {[os.path.basename(f) for f in bracketed_set]}")
        
        # Parameters for the JSX script
        params = {
            'inputFiles': bracketed_set,
            'outputFile': output_file,
            'removeGhosts': remove_ghosts,
            'bit32': True
        }
        
        if run_photoshop_script(photoshop_path, jsx_script_path, params):
            if os.path.exists(output_file):
                success_count += 1
                logger.info(f"Successfully created HDR image: {output_file}")
            else:
                logger.error(f"Failed to create HDR image: {output_file}")
        
        # Allow Photoshop some time to process and release resources
        time.sleep(3)
    
    return success_count, total_count


def main():
    """Main function to parse arguments and execute the appropriate commands."""
    parser = argparse.ArgumentParser(description="Real Estate Photography Automation Script")
    
    # Create subparsers for different commands
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")
    
    # Batch edit command
    batch_parser = subparsers.add_parser("batch", help="Batch edit photos")
    batch_parser.add_argument("input", help="Input directory containing photos")
    batch_parser.add_argument("output", help="Output directory for processed photos")
    batch_parser.add_argument("--recursive", "-r", action="store_true", help="Recursively search for photos in subdirectories")
    batch_parser.add_argument("--no-exposure", action="store_true", help="Skip exposure correction")
    batch_parser.add_argument("--no-lens", action="store_true", help="Skip lens correction")
    batch_parser.add_argument("--no-color", action="store_true", help="Skip color grading")
    batch_parser.add_argument("--photoshop", help="Path to Photoshop executable (optional)")
    
    # HDR merge command
    hdr_parser = subparsers.add_parser("hdr", help="Merge bracketed photos into HDR")
    hdr_parser.add_argument("input", help="Input directory containing bracketed photos")
    hdr_parser.add_argument("output", help="Output directory for HDR photos")
    hdr_parser.add_argument("--bracket-count", "-b", type=int, default=3, help="Number of photos in each bracketed set (default: 3)")
    hdr_parser.add_argument("--no-ghost", action="store_true", help="Disable ghost removal in HDR merge")
    hdr_parser.add_argument("--photoshop", help="Path to Photoshop executable (optional)")
    
    # Parse arguments
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
        
    # Find Photoshop path
    photoshop_path = args.photoshop if hasattr(args, 'photoshop') and args.photoshop else find_photoshop_path()
    if not photoshop_path:
        logger.error("Photoshop executable not found. Please specify the path with --photoshop.")
        return
        
    # Validate input directory
    if not is_valid_dir(args.input):
        logger.error(f"Input directory not found: {args.input}")
        return
        
    # Create output directory if it doesn't exist
    if not os.path.exists(args.output):
        os.makedirs(args.output)
        
    # Execute the appropriate command
    if args.command == "batch":
        # Batch edit photos
        image_files = get_image_files(args.input, args.recursive)
        
        if not image_files:
            logger.error(f"No image files found in {args.input}")
            return
            
        logger.info(f"Found {len(image_files)} image files")
        
        success_count, total_count = batch_edit_photos(
            photoshop_path, 
            image_files,
            args.output,
            not args.no_exposure,
            not args.no_lens,
            not args.no_color
        )
        
        logger.info(f"Batch processing complete. Successfully processed {success_count}/{total_count} files.")
        
    elif args.command == "hdr":
        # Merge bracketed photos into HDR
        image_files = get_image_files(args.input)
        
        if not image_files:
            logger.error(f"No image files found in {args.input}")
            return
            
        logger.info(f"Found {len(image_files)} image files")
        
        bracketed_sets = identify_bracketed_sets(image_files, args.bracket_count)
        
        if not bracketed_sets:
            logger.error(f"No bracketed sets identified with {args.bracket_count} images per set")
            return
            
        logger.info(f"Identified {len(bracketed_sets)} bracketed sets")
        
        success_count, total_count = merge_hdr_photos(
            photoshop_path,
            bracketed_sets,
            args.output,
            not args.no_ghost
        )
        
        logger.info(f"HDR merging complete. Successfully processed {success_count}/{total_count} sets.")


if __name__ == "__main__":
    main()
