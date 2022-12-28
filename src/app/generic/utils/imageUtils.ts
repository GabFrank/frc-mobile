function encodeImageFileAsURL(file) {
  let reader = new FileReader();
  reader.onloadend = function() {
    let base64Data = reader.result;
    return base64Data;
  }
}
