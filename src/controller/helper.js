const url = require("url");

class Helper{

	static idFromURI(uri){
		//This could have been a more general Regex, but it was not necessary for the scope of this assignment.
		//It made more sense to include this method in a helper class, since it is not necessarily only pertinent
		//To books.
		const matchURI = /(?:\/api\/books\/)(.*)/;
		const bookID = matchURI.exec(uri)[1];
		return bookID;
	}
}

module.exports = Helper;
