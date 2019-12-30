importScripts("./xlsx.full.min.js", "./base64.js");
postMessage({ t: "ready" });
onmessage = function(evt) {
  switch (evt.data.t) {
    case "xlsx":
      var rawFile = new XMLHttpRequest();
      rawFile.onprogress = function(event) {
        console.log('XMLHttpRequest::progress:' + event.loaded + '/' + evt.data.size + ' = ' + Math.round((event.loaded / evt.data.size)*100) + '%');
        postMessage({ t: "progress", d: event.loaded });
      }
      rawFile.onreadystatechange = function() {
          if(rawFile.readyState === 0) {
            // console.log('UNSENT');
          } else if(rawFile.readyState === 1) {
            console.log('XMLHttpRequest::OPENED', evt.data.file);
            // progressbar.done = false;
            // $(progressbar_id).show();
          } else if(rawFile.readyState === 2) {
            // Server要設置header:"Content-Length"這才有辦法
            // console.log('HEADERS_RECEIVED:' + rawFile.getResponseHeader("Content-Length"));
          } else if(rawFile.readyState === 3) {
            // console.log('LOADING');
          } else if(rawFile.readyState === 4) {
            console.log('XMLHttpRequest::DONE', evt.data.file);
            // progressbar.opened = false;
            // progressbar.done = true;
            if(rawFile.status === 200 || rawFile.status == 0) {
              // setTimeout(( () => $(progressbar_id).hide() ), 1500);
              var data64 = base64.encode(rawFile.responseText);
              var v;
              try {
                v = XLSX.read(data64, evt.data.b);
              } catch (e) {
                postMessage({ t: "error", d: e.stack });
              }
              postMessage({ t: evt.data.t, d: JSON.stringify(v) });
            }
          }
      };

      // progressbar.opened = true;
      rawFile.open("GET", evt.data.file, true); // 非同步下載才會觸發onprogress
      rawFile.send(null);
      break;
    case "close":
      close();
      break;
  }
};
