# README #
    This README file includes general documents and instructions to use the library for extracting useful information like Email address, Contact, LinkedIn URL & Location.

# Quick summary #
    - This library enables ability to parse resumes & extract useful information like email address, conatct information, linkedIn address along with location.
    - Version: 1.0
    - File name: resumeParser.js

# Setup information #
Core Javascript
Allowed extensions: pdf, jpg, png
Maximum size of file: 100mb

# Dependencies # 
    [All dependencies must be included in the document inorder to use this library. In case of any missing dependency, the library will include it internally]
	- Pdf.js: [OPTIONAL] [Reads contents from pdf pages]
		Link: https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.js
	
	- Tesseract: [OPTIONAL] [Used for Optical Character Recognition from images]
		Link: https://unpkg.com/tesseract.js@v2.1.0/dist/tesseract.min.js
	
	- Google Maps: [OPTIONAL] [Used to fetch location using browser geolocation API]
		Link: https://maps.google.com/maps/api/js?key=<KEY>

# Contributions #
Author(s): Akash Mandilwar, Prashant Agarwal, Debasish Nayak

# Usage #
# Options:
	fileStream [REQUIRED] 
        - generally retrieved from a FileList object returned as a result of a user selecting files using the <input> element, or from a drag and drop operation's DataTransfer object
    
    checkSpecialCharInFileName [OPTIONAL] [Default: false]
        - set this if strict special character check is needed against file name

# Methods:
    init (triggers necessary validations & initializes scanning)

# Events:
    ScanProgress
        - Triggered when the script starts processing the file.
    
    ScanComplete
        - Triggered after a successful scan. Takes some time when performs OCR based scans - basically on images & pdf pages containing images.
        - Returns object with extracted email, contact & linkedIn, if found.
    
    FoundLocation
        - Triggered when user location is found (depends on browser navigator)
        - Returns location object with city, state & country
    
    Error
        - This method will be triggered with an error message, in case of any error.
        - Cases - File extension & size validations, Special chars found in file name (if checkSpecialCharInFileName option is set, Missing required options) 
# Notes:
    - All events will receive response from the script in {detail} property of the CustomEvent interface.

# Logging:
    For errors: console.error [A subsequent {Error} event is also triggered with appropriate message]
    For warnings: console.warn

# Example/Usage:
    var parser	= new resumeParser({
                    fileStream: // FileList Object,
                    checkSpecialCharInFileName: false   // default - false, if not set
                });
    
    parser.on('Error',function(e){
        var errorMsg = e.detail.message;
        // do stuffs
    });
    
    parser.on('ScanProgress',function(e){
        // Scan in progress
    });

    parser.on('ScanComplete',function(e){
        // Scan complete
    });

    parser.on('FoundLocation',function(e){
        var locationData = e.detail;
        // location data fetched
    });

    // initialize scanning
    parser.init();