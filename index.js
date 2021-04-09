var http = require('http');
var fs = require('fs');
var glyphWidth = 60;
var glyphHeight = 60;
var port = process.env.PORT || 5000;
var selectedLanguage = 'draconic';
var dictionary = [];

const server = http.createServer(function(request, response) {

	if (request.method == 'POST') {
		var body = ''
		request.on('data', function(data) {
			body += data
		})
		request.on('end', function() {

			response.writeHead(200, {
				'Content-Type': 'text/html'
			})

			var inputValue = decodeURIComponent((body.split('=')[1]).replace(/\+/g, ' ')).toLowerCase();

			console.log('Translating ' + inputValue);

			response.write('<p><h2>Translating: ' + inputValue + '</h2></p>');

			var translatedText = translateString(inputValue);

			response.write('<p><h2>Text Translation: ' + translatedText + '</h2></p>');

			var glyphHtml = translateStringToGlyphs(selectedLanguage, translatedText, response)

			response.end(null);

		});
	}
	else if (request.method == 'GET') {
		console.log(request.url);
		var html = `
				<html>
					<body>
						<center>
							<h2>Draconic Glyph Translate</h2>
							<h4>By Kenji776@gmail.com</h4>
						</center>
						<p>A simple application for converting text into draconic glyphs. Originally used for calligraphy practice</p>
						<form method="post" action="">Tex to Translate: 
							<textarea name="text" rows="5" cols="400" /></textarea><br/>
							<input type="submit" value="Submit" />
						</form><br><br>
						
						Credit to https://draconic.twilightrealm.com/ for providing translations.
					</body>
				</html>`
		response.writeHead(200, {
			'Content-Type': 'text/html'
		})
		response.end(html)
	}
}).listen(port)


function translateStringToGlyphs(language, message, response) {
    var returnString = '';
    var imgTag;
    var converted = {};

    for (var i = 0, len = message.length; i < len; i++) {
        var letter = message[i];
        //if its an empty space change it to the word 'space' so it can be found in the glyph collection
        if (letter == ' ') {
            letter = 'space';
        }

        //if the conversion map doesn't have this letter already stored then convert it. Otherwise we can just get it from the collection.
        if (!converted.hasOwnProperty(letter)) {
            converted[letter] = base64_encode(language, letter + '.png')
        }

        //create the contents of the src tag for the img tag
        var imageString = 'data:image/png;base64,' + converted[letter];

        //create the actual img tag
        imgTag = '<img src="' + imageString + '" width="' + glyphWidth + '" height="' + glyphHeight + '" title="' + letter + '">';

        //write the response to the document so it will build as it goes.
        response.write(imgTag);
        returnString += imgTag;
    }

    return returnString;
}

function base64_encode(folder, file) {
    try {
        // read binary data
        var bitmap = fs.readFileSync(folder + '/' + file);
        // convert binary data to base64 encoded string
        return new Buffer(bitmap).toString('base64');
    } catch (err) {
        console.log('No translation glyph for ' + file);
        var bitmap = fs.readFileSync(folder + '/missing.png');
        return new Buffer(bitmap).toString('base64');
    }
}

function readDictionary(language) {
    var data = fs.readFileSync(language+'/dictionary.json', 'utf8');

	// parse JSON string to JSON object
	var dictionaryData = JSON.parse(data);
	
	console.log('Loaded ' + language + ' dictionary with ' + Object.keys(dictionaryData).length + ' words');
	return dictionaryData;
}

function translateString(message) {
    var allWords = message.split(' ');
    var translation = '';
    for (var i = 0; i < allWords.length; i++) {
        translation += findWord(allWords[i]) + ' ';
    }
    return translation;
}

function findWord(word) {
	if(dictionary)
	{
		for (var i = 0; i < dictionary.length; i++) {
			// look for the entry with a matching `code` value
			if (dictionary[i].Common == word) {
				return dictionary[i].Translation;
			}
		}
	}
	else
	{
		console.log('No dictionary available for translation!');
	}
    return word;
}
console.log('Listening on port: ' + port);

dictionary = readDictionary(selectedLanguage);