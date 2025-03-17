Testing the Script on Your Windows PC
To test this script on your Windows PC, follow these steps:

Prerequisites:
Adobe Photoshop installed (CS6 or any Creative Cloud version)
Python 3.6+ installed on your system (download from python.org if you don't have it)
Installation Steps:
Download the project files:

Download all files from this Replit project
Alternatively, I can create a zip file here for you to download
Extract the files to a folder on your computer (e.g., C:\PhotoAutomation)

Prepare test photos:

Create a folder for your test photos (e.g., C:\TestPhotos)
For batch editing: Add some real estate photos to test
For HDR: Add sets of bracketed exposures (typically 3 photos per set)
Running the Script:
Open Command Prompt:

Press Win+R, type cmd, and press Enter
Navigate to script folder:

cd C:\path\to\PhotoAutomation
Run a batch edit test:

python photo_automation.py batch C:\TestPhotos\Input C:\TestPhotos\Output
Run an HDR merge test:

python photo_automation.py hdr C:\TestPhotos\BracketedSets C:\TestPhotos\HDROutput
Troubleshooting:
Photoshop not found automatically?

Use the --photoshop parameter to specify the path:
python photo_automation.py batch C:\Input C:\Output --photoshop "C:\Program Files\Adobe\Adobe Photoshop 2023\Photoshop.exe"
Issues with file paths?

Make sure to use double quotes around paths with spaces
Bracketed sets not detected?

Make sure your files follow a consistent naming pattern
Try specifying the bracket count: --bracket-count 5 if you have 5 exposures per set