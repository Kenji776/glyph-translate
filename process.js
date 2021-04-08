const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const axios = require('axios');
var http = require('http');
var fs = require('fs');
var DomParser = require('dom-parser');
var parser = new DomParser();
var glyphWidth = 60;
var glyphHeight = 60;

const server = http.createServer(function(request, response) {
	

  if (request.method == 'POST') {
    var body = ''
    request.on('data', function(data) {
      body += data
    })
    request.on('end', function() {
 
	response.writeHead(200, {'Content-Type': 'text/html'})
 
	  var inputValue = decodeURIComponent((body.split('=')[1]).replace(/\+/g, ' '));	  
	  
	  console.log('Translating ' + inputValue);
	  
	  response.write('<p><h2>Translating: ' + inputValue + '</h2></p>');
	  
	  callDraconicTranslate(inputValue, function(data,err){
		  
		  response.write('<p><h2>Text Translation: ' + data + '</h2></p>');
		  if(!err)
		  {
			var glyphHtml = translateStringToGlyphs('draconic',data)

			
			response.end(glyphHtml) 
		  }
		  else
		  {
			  console.log('Error!' + err.message);
		  }
	  });
    })
  } else {
    var html = `
            <html>
                <body>
                    <form method="post" action="http://localhost:3000">Tex to Translate: 
                        <input type="text" name="text" />
                        <input type="submit" value="Submit" />
                    </form>
                </body>
            </html>`
    response.writeHead(200, {'Content-Type': 'text/html'})
    response.end(html)
  }
})

async function callDraconicTranslate(textString,callback)
{
	axios.post('https://draconic.twilightrealm.com/mini.php?action=ctd&text='+textString+'&translate=Translate', null)
    .then((res) => {
		callback(extractTextFromFormElement(res.data, 'text', 1));
		
    }).catch((err) => {
		callback(null,err);
    });
}

function extractTextFromFormElement(htmlString, formElementName, offsetIndex)
{
	offsetIndex = offsetIndex == null ? 0 : offsetIndex;
	
	//turn the html text blob into a document object
	var doc = parser.parseFromString(htmlString);
	
	//extract the value from the dom element
	var elementAttributes = doc.getElementsByName(formElementName)[offsetIndex].attributes;
	
	var elementValue = extractAttribute(elementAttributes,'value');
	
	console.log('Translated value is: ' + elementValue);
	
	return elementValue;
	
}

function extractAttribute(nodeAttributes, attributeName)
{
	for(var i=0; i<nodeAttributes.length; i++)
	{
		if(nodeAttributes[i].name == attributeName)
		{
			return nodeAttributes[i].value;
		}
	}
	return '';
}

function translateStringToGlyphs(language,message)
{
	var returnString = '';
	
	for (var i = 0, len = message.length; i < len; i++) {
		if(message[i] == ' ')
		{
			var imageString = base64_encode(language+'/space.png')
			if(imageString != '') returnString += '<img src="data:image/png;base64,'+imageString+ '" width="'+glyphWidth+'" height="'+glyphHeight+'">';
		}
		else
		{
			var imageString = base64_encode(language+'/'+message[i]+'.png' );
			if(imageString != '') returnString += '<img src="data:image/png;base64,'+imageString+ '" width="'+glyphWidth+'" height="'+glyphHeight+'" title="'+message[i]+'">';
		}
	}
	
	return returnString;
}

function base64_encode(file) {
	try
	{
		// read binary data
		var bitmap = fs.readFileSync(file);
		// convert binary data to base64 encoded string
		return new Buffer(bitmap).toString('base64');
	}
	catch(err)
	{
		console.log('No translation glyph for ' + file);
		return '';
	}
}
			
const port = 3000
const host = '127.0.0.1'
server.listen(port, host)
console.log(`Listening at http://${host}:${port}`)