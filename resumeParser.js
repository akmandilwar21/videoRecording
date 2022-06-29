var resumeParser = function (options) {
  this.targetElement = document.querySelector("body");
  this.foundImageObject = false;
  this.parsedDocumentText = "";
  this.includeLibraries = [
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.js",
    "https://unpkg.com/tesseract.js@v2.1.0/dist/tesseract.min.js",
    "https://maps.google.com/maps/api/js?key=AIzaSyDgKQPnFkQ_nX4BtOemDruaLFojMwZI6hc",
  ];
  this.libraryKeyMaps = ["pdfjsLib", "Tesseract", "google"];

  this.setOptions(options);
  this.initFileValidator();

  return this;
};

resumeParser.prototype.setOptions = function (options) {
  // default settings
  this.fileStream = null;
  this.checkSpecialCharInFileName = false;

  this.fileValidator = {
    fileNameLabelLength: 20,
    extensions: ["pdf", "jpg", "png"],
    maxInputFileSize: 100000000, // 100mb
    extensionError: false,
    fileSizeError: false,
    fileNameHasSpclChars: false,
    message: "",
    success: false,
  };

  if (typeof options !== "object") {
    return;
  }

  if (typeof options.fileStream !== "undefined") {
    this.fileStream = options.fileStream;
  }

  if (
    typeof options.checkSpecialCharInFileName !== "undefined" &&
    options.checkSpecialCharInFileName
  ) {
    this.checkSpecialCharInFileName = true;
  }
};
resumeParser.prototype.init = function () {
  var _this = this;
  var callback = function () {
    // dependencies check
    if (
      typeof pdfjsLib == "undefined" ||
      typeof Tesseract == "undefined" ||
      typeof google == "undefined"
    ) {
      console.error(
        "Failed to initiate resumeParser library. Missing dependencies."
      );
      _this.eventHandler.trigger("Error", _this.targetElement, {
        message:
          "Failed to initiate resumeParser library. Missing dependencies.",
      });
      return false;
    }

    if (_this.fileStream == null) {
      console.error("Missing file stream.");
      _this.eventHandler.trigger("Error", _this.targetElement, {
        message: "Missing file stream.",
      });
      return false;
    }

    _this.fileValidator.validate(_this.fileStream);

    if (!_this.fileValidator.success) {
      console.error(_this.fileValidator.message);
      _this.eventHandler.trigger("Error", _this.targetElement, {
        message: _this.fileValidator.message,
      });
      return;
    }

    _this.readFile();
    _this.getLocation();
  };

  if (
    typeof pdfjsLib !== "undefined" &&
    typeof Tesseract !== "undefined" &&
    typeof google !== "undefined"
  ) {
    callback();
  } else {
    _this.loadDependancy(callback);
  }
};
resumeParser.prototype.loadDependancy = function (callback) {
  var _this = this;
  var loadScript = function (index) {
    if (typeof window[_this.libraryKeyMaps[index]] == "undefined") {
      let scriptEl = document.createElement("script");
      scriptEl.setAttribute("src", _this.includeLibraries[index]);
      scriptEl.setAttribute("type", "text/javascript");
      scriptEl.setAttribute("async", "");
      document.body.appendChild(scriptEl);

      // success event
      scriptEl.addEventListener("load", () => {
        var nextKey = index + 1;

        if (nextKey in _this.includeLibraries) {
          loadScript(nextKey);
        } else {
          // All files loaded successfully
          if (callback) {
            callback();
          }
        }
      });
      // error event
      scriptEl.addEventListener("error", (ev) => {
        // console.log("Error on loading file", ev);
        _this.eventHandler.trigger("Error", _this.targetElement, {
          message: "Error on loading file: " + _this.includeLibraries[index],
        });
      });
    } else {
      if (nextKey in _this.includeLibraries) {
        loadScript(nextKey);
      } else {
        // All files loaded successfully
        if (callback) {
          callback();
        }
      }
    }
  };

  loadScript(0);
};
resumeParser.prototype.initFileValidator = function () {
  var parser = this;
  // Need to revisit this function
  // fetch details from fileValidator object & set the default values accordingly
  // this function is not being called from anywhere
  this.fileValidator.reset = function () {
    var _this = this;
    _this.extensions = ["pdf", "jpg", "png"];
    _this.maxInputFileSize = 100000000; // 100mb
    _this.extensionError = false;
    _this.fileSizeError = false;
    _this.fileNameHasSpclChars = false;
    _this.message = "";
    _this.success = false;
  };

  this.fileValidator.specialCharInFileName = function (fileName) {
    var patern = new RegExp(/^(?!-)[A-Za-z0-9 ._-]+\.[a-zA-Z0-9]{2,15}$/i);
    if (!patern.test(fileName) || fileName.length > 255) {
      return true;
    } else {
      return false;
    }
  };

  this.fileValidator.setErrors = function () {
    var _this = this;
    _this.message = "";

    // Error messages
    // 1. Extension error message
    if (_this.extensionError) {
      var extErrorMsg = "Only " + _this.extensions.join();
      extErrorMsg += _this.extensions.length == 1 ? " is" : " are";
      extErrorMsg += " accepted. Please try again.";
      _this.message = extErrorMsg;
    }

    // 2. File size error message
    if (_this.fileSizeError) {
      _this.message = "File size cannot be larger than 100mb.";
    }

    // 3. File name has special characters
    if (_this.fileNameHasSpclChars) {
      _this.message =
        "Problem found with filename. Allowed characters: letters, numbers, _ or -. Note: Dash (-) can be used anywhere except beginning of filename. Filename length can't be longer than 255 characters.";
    }
  };

  this.fileValidator.validate = function (file) {
    var _this = this;

    // reset error flags
    _this.extensionError = false;
    _this.fileSizeError = false;
    _this.fileNameHasSpclChars = false;
    _this.message = "";

    var fileName = file.name;
    var hasErrors = false;

    if (
      parser.checkSpecialCharInFileName &&
      _this.specialCharInFileName(fileName)
    ) {
      _this.fileNameHasSpclChars = true;
      hasErrors = true;
    }

    var fileExt = fileName.split(".").pop();

    if (_this.extensions.length > 0 && !_this.extensions.includes(fileExt)) {
      _this.extensionError = true;
      hasErrors = true;
    }

    if (_this.maxInputFileSize && file.size > _this.maxInputFileSize) {
      _this.fileSizeError = true;
      hasErrors = true;
    }

    if (hasErrors) {
      _this.success = false;
      _this.setErrors();
    } else {
      _this.success = true;
      _this.fileCount++;
    }
  };
};
resumeParser.prototype.on = function (event, callback) {
  var evt = this.eventHandler.bindEvent(event, callback, this.targetElement);
};
resumeParser.prototype.off = function (event) {
  var evt = this.eventHandler.unbindEvent(event, this.targetElement);
};
resumeParser.prototype.eventHandler = {
  events: [],
  bindEvent: function (event, callback, targetElement) {
    this.unbindEvent(event, targetElement);
    targetElement.addEventListener(event, callback, false);
    this.events.push({
      type: event,
      event: callback,
      target: targetElement,
    });
  },
  findEvent: function (event) {
    return this.events.filter(function (evt) {
      return evt.type === event;
    }, event)[0];
  },
  unbindEvent: function (event, targetElement) {
    var foundEvent = this.findEvent(event);
    if (foundEvent !== undefined) {
      targetElement.removeEventListener(event, foundEvent.event, false);
    }
    this.events = this.events.filter(function (evt) {
      return evt.type !== event;
    }, event);
  },
  trigger: function (event, targetElement, args) {
    var foundEvent = this.findEvent(event);

    if (typeof args !== "object") {
      args = {};
    }

    if (foundEvent !== undefined) {
      var e = new CustomEvent(event, { detail: args });
      targetElement.dispatchEvent(e);
    }
  },
};
resumeParser.prototype.searchPdfPage = function (doc, pageNumber) {
  var _this = this;

  return doc
    .getPage(pageNumber)
    .then(function (page) {
      page.getOperatorList().then(function (ops) {
        for (var i = 0; i < ops.fnArray.length; i++) {
          if (_this.imageObjCode.indexOf(ops.fnArray[i]) !== -1) {
            _this.foundImageObject = true;
          }
        }
      });

      return page.getTextContent();
    })
    .then(function (content) {
      var pageText = content.items
        .map(function (i) {
          return i.str;
        })
        .join("");
      return pageText;
    });
};
resumeParser.prototype.convertAndRunOCR = async function () {
  var _this = this;
  var images = [];
  var data = await _this.readFileData();
  var pdf = await pdfjsLib.getDocument(data).promise;
  var canvas = document.createElement("canvas");

  // converting pdf pages to images
  for (let i = 0; i < pdf.numPages; i++) {
    var page = await pdf.getPage(i + 1);
    var viewport = page.getViewport({ scale: 3 });
    var context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: context, viewport: viewport }).promise;
    images.push(canvas.toDataURL());
  }
  canvas.remove();

  const worker = new Tesseract.createWorker();

  await worker.load();
  await worker.loadLanguage("eng");
  await worker.initialize("eng");

  for (let i = 0; i < images.length; i++) {
    const {
      data: { text },
    } = await worker.recognize(images[i]);
    _this.parsedDocumentText += text;
  }

  // console.log(_this.parsedDocumentText);
  await worker.terminate();

  var resp = _this.response();
  _this.eventHandler.trigger("ScanComplete", _this.targetElement, resp);
};
resumeParser.prototype.runOCR = async function () {
  var _this = this;
  _this.eventHandler.trigger("ScanProgress", _this.targetElement);
  const worker = new Tesseract.createWorker();
  await worker.load();
  await worker.loadLanguage("eng");
  await worker.initialize("eng");
  const {
    data: { text },
  } = await worker.recognize(_this.fileStream);
  await worker.terminate();

  _this.parsedDocumentText = text;

  // console.log(_this.parsedDocumentText)

  var resp = _this.response();
  _this.eventHandler.trigger("ScanComplete", _this.targetElement, resp);
};
resumeParser.prototype.readFileData = function () {
  var _this = this;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (e) {
      resolve(e.target.result);
    };

    reader.onerror = function (err) {
      reject(err);
    };

    reader.readAsDataURL(_this.fileStream);
  });
};
resumeParser.prototype.readFile = function () {
  var _this = this;

  // pdfjsLib.OPS.beginImageData(64)
  // pdfjsLib.OPS.beginInlineImage(63)
  // pdfjsLib.OPS.endInlineImage(65)
  // pdfjsLib.OPS.paintFormXObjectBegin(74)
  // pdfjsLib.OPS.paintFormXObjectEnd(75)
  // pdfjsLib.OPS.paintImageMaskXObject(83)
  // pdfjsLib.OPS.paintImageMaskXObjectGroup(84)
  // pdfjsLib.OPS.paintImageMaskXObjectRepeat(89)
  // pdfjsLib.OPS.paintImageXObject(85)
  // pdfjsLib.OPS.paintImageXObjectRepeat(88)
  // pdfjsLib.OPS.paintInlineImageXObject(86)
  // pdfjsLib.OPS.paintInlineImageXObjectGroup(87)
  // pdfjsLib.OPS.paintJpegXObject(82)
  // pdfjsLib.OPS.paintSolidColorImageMask(90)
  // pdfjsLib.OPS.paintXObject(66)
  _this.imageObjCode = new Array(
    pdfjsLib.OPS.beginImageData,
    pdfjsLib.OPS.beginInlineImage,
    pdfjsLib.OPS.endInlineImage,
    pdfjsLib.OPS.paintFormXObjectBegin,
    pdfjsLib.OPS.paintFormXObjectEnd,
    pdfjsLib.OPS.paintImageMaskXObject,
    pdfjsLib.OPS.paintImageMaskXObjectGroup,
    pdfjsLib.OPS.paintImageMaskXObjectRepeat,
    pdfjsLib.OPS.paintImageXObject,
    pdfjsLib.OPS.paintImageXObjectRepeat,
    pdfjsLib.OPS.paintInlineImageXObject,
    pdfjsLib.OPS.paintInlineImageXObjectGroup,
    pdfjsLib.OPS.paintJpegXObject,
    pdfjsLib.OPS.paintSolidColorImageMask,
    pdfjsLib.OPS.paintXObject
  );

  var fileExt = _this.fileStream.name.split(".").pop();

  if (fileExt !== "pdf") {
    _this.runOCR();
    return false;
  }

  var fileReader = new FileReader();
  fileReader.onload = function () {
    var typedArr = new Uint8Array(this.result);
    var loading = pdfjsLib.getDocument(typedArr);
    loading.promise
      .then(function (doc) {
        var results = [];

        _this.eventHandler.trigger("ScanProgress", _this.targetElement);

        for (var i = 1; i <= doc.numPages; i++) {
          results.push(_this.searchPdfPage(doc, i));
        }
        return Promise.all(results);
      })
      .then(function (searchResults) {
        if (!searchResults[0] && _this.foundImageObject) {
          _this.convertAndRunOCR();
        } else {
          var pdfContent = "";
          searchResults.forEach(function (result) {
            pdfContent += result;
          });

          _this.parsedDocumentText = pdfContent;

          var resp = _this.response();
          _this.eventHandler.trigger("ScanComplete", _this.targetElement, resp);
        }
      })
      .catch(console.error);
  };
  fileReader.readAsArrayBuffer(_this.fileStream);
};
resumeParser.prototype.response = function () {
  var _this = this;
  return {
    email: _this.getEmail(),
    contact: _this.getContact(),
    linkedIn: _this.getLinkedInAddress(),
  };
};
resumeParser.prototype.getEmail = function () {
  var email = "";

  if (this.parsedDocumentText) {
    // var parsedEmail = this.parsedDocumentText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]{2,3})/gi);
    var parsedEmail = this.parsedDocumentText.match(
      /([a-zA-Z]{1}[a-zA-Z0-9._-]+@(([a-zA-z]+\.[a-zA-Z]{2,3})|([a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)))/gi
    );

    if (parsedEmail !== null) {
      email = parsedEmail[0].replace(/^[^a-zA-Z]+/, "");
    }
  }

  return email;
};
resumeParser.prototype.getContact = function () {
  var contact = "";

  if (this.parsedDocumentText) {
    // var parsedContact   = this.parsedDocumentText.match(/(?:[-+() ]*\d){10,13}/g);
    var parsedContact = this.parsedDocumentText.match(
      /(\s+?\+[0-9]{2}\-)?(\s+[0]{1})?([6-9]{1})([0-9]{9})/g
    );

    if (parsedContact && parsedContact[0] !== null) {
      contact = parsedContact[0];
    }
  }

  return contact;
};
resumeParser.prototype.getLinkedInAddress = function () {
  var linkedInAddress = "";

  if (this.parsedDocumentText) {
    // var parsedLinkedInAddr  = this.parsedDocumentText.match(/linkedin.com(\w+:{0,1}\w*@)?(\S+)(:([0-9])+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/g);
    var parsedLinkedInAddr = this.parsedDocumentText.match(
      /\s?linkedin\.com\/in\/([a-zA-Z\-])+([0-9a-zA-Z]{0,9})?/g
    );
    if (parsedLinkedInAddr && parsedLinkedInAddr[0] !== null) {
      linkedInAddress = parsedLinkedInAddr[0];
    }
  }
  return linkedInAddress;
};
resumeParser.prototype.getLocation = function () {
  var _this = this;
  if (!navigator.geolocation) {
    console.warn("Geolocation is not supported by this browser.");
    return false;
  }

  navigator.geolocation.getCurrentPosition(async function (pos) {
    var latitude = pos.coords.latitude;
    var longitude = pos.coords.longitude;
    var coordinates = new google.maps.LatLng(latitude, longitude);
    var geocoder = new google.maps.Geocoder();
    var locationData = {};

    await geocoder.geocode({ latLng: coordinates }, function (res, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (res[0]) {
          var address = res[0].formatted_address;
          var addressArr = address.split(",");
          var totalAddr = addressArr.length;
          locationData.country = addressArr[totalAddr - 1];
          locationData.state = addressArr[totalAddr - 2];
          locationData.city = addressArr[totalAddr - 3];
        }
      }
      _this.eventHandler.trigger(
        "FoundLocation",
        _this.targetElement,
        locationData
      );
    });
  });
};
